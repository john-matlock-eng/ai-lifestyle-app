"""
Service layer for goal creation business logic.
"""

import uuid
from datetime import datetime
from typing import Optional
from aws_lambda_powertools import Logger

from goals_common import (
    Goal, CreateGoalRequest, GoalStatus, GoalProgress,
    GoalsRepository, GoalValidator, GoalContext, GoalRewards,
    GoalValidationError, GoalQuotaExceededError, GoalError
)

logger = Logger()

# Maximum number of active goals per user
MAX_ACTIVE_GOALS = 50


class CreateGoalService:
    """Handles goal creation business logic."""
    
    def __init__(self):
        self.repository = GoalsRepository()
    
    def create_goal(self, user_id: str, request: CreateGoalRequest) -> Goal:
        """
        Create a new goal for a user.
        
        Args:
            user_id: User's unique identifier
            request: Goal creation request data
            
        Returns:
            Created goal
            
        Raises:
            GoalValidationError: If goal data is invalid
            GoalQuotaExceededError: If user has too many goals
            GoalError: For other errors
        """
        try:
            # Check user's goal quota
            self._check_goal_quota(user_id)
            
            # Generate goal ID
            goal_id = str(uuid.uuid4())
            
            # Build goal object
            goal = Goal(
                goal_id=goal_id,
                user_id=user_id,
                title=request.title,
                description=request.description,
                category=request.category,
                icon=request.icon,
                color=request.color,
                goal_pattern=request.goal_pattern,
                target=request.target,
                schedule=request.schedule or self._get_default_schedule(request.goal_pattern),
                progress=GoalProgress(),  # Initialize empty progress
                context=request.context or GoalContext(),
                rewards=GoalRewards(),  # Default rewards
                status=request.status if request.status else GoalStatus.ACTIVE,
                visibility=request.visibility,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                metadata={}  # Default empty metadata
            )
            
            # Validate goal configuration
            validation_errors = GoalValidator.validate_goal_pattern_configuration(goal)
            if validation_errors:
                raise GoalValidationError(validation_errors)
            
            # Additional business rule validations
            self._validate_business_rules(goal)
            
            # Save to repository
            created_goal = self.repository.create_goal(goal)
            
            logger.info(f"Created goal {goal_id} for user {user_id} with pattern {goal.goalPattern}")
            
            return created_goal
            
        except (GoalValidationError, GoalQuotaExceededError):
            raise
        except Exception as e:
            logger.error(f"Failed to create goal: {str(e)}")
            raise GoalError(f"Failed to create goal: {str(e)}")
    
    def _check_goal_quota(self, user_id: str) -> None:
        """
        Check if user has reached their goal quota.
        
        Args:
            user_id: User's unique identifier
            
        Raises:
            GoalQuotaExceededError: If quota exceeded
        """
        # Get count of active goals
        active_goals, _ = self.repository.list_user_goals(
            user_id, 
            status=GoalStatus.ACTIVE,
            limit=MAX_ACTIVE_GOALS + 1
        )
        
        if len(active_goals) >= MAX_ACTIVE_GOALS:
            logger.warning(f"User {user_id} has reached goal quota: {len(active_goals)}")
            raise GoalQuotaExceededError(
                current_count=len(active_goals),
                max_allowed=MAX_ACTIVE_GOALS
            )
    
    def _get_default_schedule(self, goal_pattern: str) -> dict:
        """
        Get default schedule based on goal pattern.
        
        Args:
            goal_pattern: Type of goal pattern
            
        Returns:
            Default schedule configuration
        """
        from goals_common import GoalSchedule, Frequency, GoalPattern
        
        if goal_pattern == GoalPattern.RECURRING:
            return GoalSchedule(
                frequency=Frequency.DAILY,
                checkInFrequency=Frequency.DAILY,
                allowSkipDays=2,
                catchUpAllowed=True
            )
        elif goal_pattern == GoalPattern.STREAK:
            return GoalSchedule(
                frequency=Frequency.DAILY,
                checkInFrequency=Frequency.DAILY,
                allowSkipDays=0,
                catchUpAllowed=False
            )
        else:
            return GoalSchedule(
                checkInFrequency=Frequency.WEEKLY,
                catchUpAllowed=True
            )
    
    def _validate_business_rules(self, goal: Goal) -> None:
        """
        Validate business rules for goal creation.
        
        Args:
            goal: Goal to validate
            
        Raises:
            GoalValidationError: If validation fails
        """
        errors = []
        
        # Target date must be in the future for new goals
        if goal.target.targetDate and goal.target.targetDate < datetime.utcnow():
            errors.append("Target date must be in the future")
        
        # Streak goals must have reasonable targets
        if goal.goalPattern == "streak" and goal.target.value > 365:
            errors.append("Streak target cannot exceed 365 days")
        
        # Validate category
        valid_categories = [
            'fitness', 'nutrition', 'wellness', 'productivity', 
            'finance', 'learning', 'creativity', 'relationships',
            'career', 'habits', 'other'
        ]
        if goal.category.lower() not in valid_categories:
            errors.append(f"Invalid category. Must be one of: {', '.join(valid_categories)}")
        
        # Check for duplicate active goals with same title
        existing_goals, _ = self.repository.list_user_goals(
            goal.userId,
            status=GoalStatus.ACTIVE,
            limit=100
        )
        
        for existing in existing_goals:
            if existing.title.lower() == goal.title.lower():
                errors.append("You already have an active goal with this title")
                break
        
        if errors:
            raise GoalValidationError(errors)
