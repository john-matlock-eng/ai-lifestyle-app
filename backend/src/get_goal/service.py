"""
Service layer for goal retrieval business logic.
"""


from aws_lambda_powertools import Logger

from goals_common import (
    Goal,
    GoalArchivedException,
    GoalNotFoundError,
    GoalPermissionError,
    GoalsRepository,
)

logger = Logger()


class GetGoalService:
    """Handles goal retrieval business logic."""

    def __init__(self):
        self.repository = GoalsRepository()

    def get_goal(self, user_id: str, goal_id: str) -> Goal:
        """
        Retrieve a specific goal.

        Args:
            user_id: User's unique identifier
            goal_id: Goal's unique identifier

        Returns:
            The requested goal

        Raises:
            GoalNotFoundError: If goal doesn't exist
            GoalPermissionError: If user doesn't own the goal
            GoalArchivedException: If goal is archived and should not be accessed
        """
        # Get goal from repository
        goal = self.repository.get_goal(user_id, goal_id)

        if not goal:
            logger.warning(f"Goal {goal_id} not found for user {user_id}")
            raise GoalNotFoundError(goal_id, user_id)

        # Verify ownership
        if goal.user_id != user_id:
            logger.warning(
                f"User {user_id} attempted to access goal {goal_id} owned by {goal.user_id}"
            )
            raise GoalPermissionError("read", goal_id)

        # Log access
        logger.info(f"User {user_id} accessed goal {goal_id} (status: {goal.status})")

        return goal
