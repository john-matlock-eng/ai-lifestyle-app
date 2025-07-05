"""
Service layer for activity logging business logic.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional
from aws_lambda_powertools import Logger

from goals_common import (
    Goal, GoalActivity, LogActivityRequest, GoalStatus,
    GoalsRepository, GoalValidator, ProgressCalculator,
    GoalNotFoundError, GoalPermissionError, 
    ActivityValidationError, InvalidGoalPatternError, GoalError
)

logger = Logger()


class LogActivityService:
    """Handles activity logging business logic."""
    
    def __init__(self):
        self.repository = GoalsRepository()
    
    def log_activity(
        self, 
        user_id: str, 
        goal_id: str, 
        request: LogActivityRequest,
        timezone_str: str = 'UTC'
    ) -> GoalActivity:
        """
        Log an activity for a goal.
        
        Args:
            user_id: User's unique identifier
            goal_id: Goal's unique identifier
            request: Activity data
            timezone_str: User's timezone
            
        Returns:
            Created activity
            
        Raises:
            GoalNotFoundError: If goal doesn't exist
            GoalPermissionError: If user doesn't own the goal
            ActivityValidationError: If activity data is invalid
            InvalidGoalPatternError: If activity is invalid for goal pattern
        """
        # Get the goal
        goal = self.repository.get_goal(user_id, goal_id)
        
        if not goal:
            logger.warning(f"Goal {goal_id} not found for user {user_id}")
            raise GoalNotFoundError(goal_id, user_id)
        
        # Verify ownership
        if goal.userId != user_id:
            logger.warning(f"User {user_id} attempted to log activity for goal {goal_id} owned by {goal.userId}")
            raise GoalPermissionError("log activity", goal_id)
        
        # Check if goal is active
        if goal.status not in [GoalStatus.ACTIVE, GoalStatus.PAUSED]:
            logger.warning(f"Attempt to log activity for {goal.status} goal {goal_id}")
            raise ActivityValidationError([f"Cannot log activities for {goal.status} goals"])
        
        # Build activity object
        activity = self._build_activity(user_id, goal_id, goal, request, timezone_str)
        
        # Validate activity against goal
        validation_errors = GoalValidator.validate_activity_for_goal(activity, goal)
        if validation_errors:
            raise ActivityValidationError(validation_errors)
        
        # Additional pattern-specific validations
        self._validate_pattern_specific_rules(goal, activity)
        
        # Save activity
        saved_activity = self.repository.log_activity(activity)
        
        # Update goal progress (async in production)
        self._update_goal_progress(goal, activity)
        
        logger.info(f"Logged {activity.activityType} activity for goal {goal_id}")
        
        return saved_activity
    
    def _build_activity(
        self,
        user_id: str,
        goal_id: str,
        goal: Goal,
        request: LogActivityRequest,
        timezone_str: str
    ) -> GoalActivity:
        """Build activity object from request."""
        activity_id = str(uuid.uuid4())
        
        # Determine activity date
        if request.activityDate:
            # Convert date string to datetime
            activity_date = datetime.fromisoformat(
                request.activityDate.isoformat() if hasattr(request.activityDate, 'isoformat') 
                else request.activityDate
            )
        else:
            activity_date = datetime.now(timezone.utc)
        
        # Ensure unit matches goal if not provided
        unit = request.unit or goal.target.unit
        
        # Build context
        context = request.context or {}
        
        # Add automatic context enrichment
        if 'dayOfWeek' not in context:
            context['dayOfWeek'] = activity_date.strftime('%A').lower()
        if 'isWeekend' not in context:
            context['isWeekend'] = activity_date.weekday() >= 5
        
        return GoalActivity(
            activityId=activity_id,
            goalId=goal_id,
            userId=user_id,
            value=request.value,
            unit=unit,
            activityType=request.activityType,
            activityDate=activity_date,
            loggedAt=datetime.now(timezone.utc),
            timezone=timezone_str,
            location=request.location,
            context=context,
            note=request.note,
            attachments=request.attachments or [],
            source=request.source
        )
    
    def _validate_pattern_specific_rules(self, goal: Goal, activity: GoalActivity) -> None:
        """Validate activity based on goal pattern."""
        if goal.goalPattern == 'streak':
            # Streak activities should be marked as progress with value 1
            if activity.activityType != 'progress' or activity.value != 1:
                raise InvalidGoalPatternError(
                    goal.goalPattern,
                    "Streak goals require progress activities with value 1"
                )
        
        elif goal.goalPattern == 'limit':
            # Limit goals track consumption/usage
            if activity.value < 0:
                raise ActivityValidationError(["Limit goal activities must have positive values"])
        
        elif goal.goalPattern == 'milestone':
            # Milestone goals accumulate progress
            if activity.value <= 0 and activity.activityType == 'progress':
                raise ActivityValidationError(["Milestone progress must be positive"])
    
    def _update_goal_progress(self, goal: Goal, activity: GoalActivity) -> None:
        """
        Update goal progress after logging activity.
        
        In production, this would be done asynchronously via EventBridge.
        """
        try:
            # Get recent activities for progress calculation
            recent_activities = self.repository.get_goal_activities(
                goal.userId,
                goal.goalId,
                limit=100
            )
            
            # Calculate new progress
            if goal.goalPattern == 'recurring':
                progress = ProgressCalculator.calculate_recurring_progress(
                    goal, recent_activities
                )
            elif goal.goalPattern == 'milestone':
                progress = ProgressCalculator.calculate_milestone_progress(
                    goal, recent_activities
                )
            elif goal.goalPattern == 'target':
                progress = ProgressCalculator.calculate_target_progress(
                    goal, recent_activities
                )
            elif goal.goalPattern == 'streak':
                progress = ProgressCalculator.calculate_streak_progress(
                    goal, recent_activities
                )
            elif goal.goalPattern == 'limit':
                progress = ProgressCalculator.calculate_limit_progress(
                    goal, recent_activities
                )
            
            # Update goal with new progress
            self.repository.update_goal(
                goal.userId,
                goal.goalId,
                {'progress': progress.model_dump()}
            )
            
            logger.info(f"Updated progress for goal {goal.goalId}: {progress.percentComplete}%")
            
        except Exception as e:
            # Don't fail the activity log if progress update fails
            logger.error(f"Failed to update goal progress: {str(e)}")
