import uuid
"""
Service layer for activity logging business logic.
"""

from datetime import datetime
from datetime import datetime, timezone

from aws_lambda_powertools import Logger

from goals_common import (
    ActivityContext,
    ActivityValidationError,
    Goal,
    GoalActivity,
    GoalError,
    GoalNotFoundError,
    GoalPermissionError,
    GoalsRepository,
    GoalStatus,
    GoalValidator,
    InvalidGoalPatternError,
    LogActivityRequest,
    ProgressCalculator,
    TimeOfDay,
)

logger = Logger()


class LogActivityService:
    """Handles activity logging business logic."""

    def __init__(self):
        self.repository = GoalsRepository()

    def log_activity(
        self, user_id: str, goal_id: str, request: LogActivityRequest, timezone_str: str = "UTC"
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
        if goal.user_id != user_id:
            logger.warning(
                f"User {user_id} attempted to log activity for goal {goal_id} owned by {goal.user_id}"
            )
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

        logger.info(f"Logged {activity.activity_type} activity for goal {goal_id}")

        return saved_activity

    def _build_activity(
        self, user_id: str, goal_id: str, goal: Goal, request: LogActivityRequest, timezone_str: str
    ) -> GoalActivity:
        """Build activity object from request."""
        activity_id = str(uuid.uuid4())

        # Determine activity date
        if request.activity_date:
            # Convert date string to datetime
            try:
                from datetime import date

                # Parse YYYY-MM-DD format
                date_obj = date.fromisoformat(request.activity_date)
                # Convert to datetime at start of day in user's timezone
                activity_date = datetime.combine(date_obj, datetime.min.time()).replace(
                    tzinfo=timezone.utc
                )
            except ValueError:
                # If parsing fails, use current time
                activity_date = datetime.now(timezone.utc)
        else:
            activity_date = datetime.now(timezone.utc)

        # Ensure unit matches goal if not provided
        unit = request.unit or goal.target.unit

        # Build context
        if request.context:
            # ActivityContext is already a Pydantic model, use it directly
            context = request.context
            # Fill in missing temporal fields if not provided
            if context.time_of_day is None:
                hour = activity_date.hour
                if 4 <= hour < 7:
                    context.time_of_day = TimeOfDay.EARLY_MORNING
                elif 7 <= hour < 12:
                    context.time_of_day = TimeOfDay.MORNING
                elif 12 <= hour < 17:
                    context.time_of_day = TimeOfDay.AFTERNOON
                elif 17 <= hour < 21:
                    context.time_of_day = TimeOfDay.EVENING
                else:
                    context.time_of_day = TimeOfDay.NIGHT

            if context.day_of_week is None:
                context.day_of_week = activity_date.strftime("%A").lower()

            if context.is_weekend is None:
                context.is_weekend = activity_date.weekday() >= 5
        else:
            # Create a default context with minimal required fields
            hour = activity_date.hour
            if 4 <= hour < 7:
                time_of_day = TimeOfDay.EARLY_MORNING
            elif 7 <= hour < 12:
                time_of_day = TimeOfDay.MORNING
            elif 12 <= hour < 17:
                time_of_day = TimeOfDay.AFTERNOON
            elif 17 <= hour < 21:
                time_of_day = TimeOfDay.EVENING
            else:
                time_of_day = TimeOfDay.NIGHT

            context = ActivityContext(
                time_of_day=time_of_day,
                day_of_week=activity_date.strftime("%A").lower(),
                is_weekend=activity_date.weekday() >= 5,
            )

        return GoalActivity(
            activity_id=activity_id,
            goal_id=goal_id,
            user_id=user_id,
            value=request.value,
            unit=unit,
            activity_type=request.activity_type,
            activity_date=activity_date,
            logged_at=datetime.now(timezone.utc),
            timezone=timezone_str,
            location=request.location,
            context=context,
            note=request.note,
            attachments=request.attachments or [],
            source=request.source,
        )

    def _validate_pattern_specific_rules(self, goal: Goal, activity: GoalActivity) -> None:
        """Validate activity based on goal pattern."""
        if goal.goal_pattern == "streak":
            # Streak activities should be marked as progress with value 1
            if activity.activity_type != "progress" or activity.value != 1:
                raise InvalidGoalPatternError(
                    goal.goal_pattern, "Streak goals require progress activities with value 1"
                )

        elif goal.goal_pattern == "limit":
            # Limit goals track consumption/usage
            if activity.value < 0:
                raise ActivityValidationError(["Limit goal activities must have positive values"])

        elif goal.goal_pattern == "milestone":
            # Milestone goals accumulate progress
            if activity.value <= 0 and activity.activity_type == "progress":
                raise ActivityValidationError(["Milestone progress must be positive"])

    def _update_goal_progress(self, goal: Goal, activity: GoalActivity) -> None:
        """
        Update goal progress after logging activity.

        In production, this would be done asynchronously via EventBridge.
        """
        try:
            # Get recent activities for progress calculation
            recent_activities = self.repository.get_goal_activities(
                goal.user_id, goal.goal_id, limit=100
            )

            # Calculate new progress
            if goal.goal_pattern == "recurring":
                progress = ProgressCalculator.calculate_recurring_progress(goal, recent_activities)
            elif goal.goal_pattern == "milestone":
                progress = ProgressCalculator.calculate_milestone_progress(goal, recent_activities)
            elif goal.goal_pattern == "target":
                progress = ProgressCalculator.calculate_target_progress(goal, recent_activities)
            elif goal.goal_pattern == "streak":
                progress = ProgressCalculator.calculate_streak_progress(goal, recent_activities)
            elif goal.goal_pattern == "limit":
                progress = ProgressCalculator.calculate_limit_progress(goal, recent_activities)

            # Update goal with new progress
            self.repository.update_goal(
                goal.user_id, goal.goal_id, {"progress": progress.model_dump()}
            )

            logger.info(f"Updated progress for goal {goal.goal_id}: {progress.percent_complete}%")

        except Exception as e:
            # Don't fail the activity log if progress update fails
            logger.error(f"Failed to update goal progress: {str(e)}")
