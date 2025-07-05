"""
Service layer for goal archiving business logic.
"""

from aws_lambda_powertools import Logger

from goals_common import (
    GoalStatus, GoalsRepository,
    GoalNotFoundError, GoalPermissionError, 
    GoalAlreadyCompletedError, GoalError
)

logger = Logger()


class ArchiveGoalService:
    """Handles goal archiving business logic."""
    
    def __init__(self):
        self.repository = GoalsRepository()
    
    def archive_goal(self, user_id: str, goal_id: str) -> None:
        """
        Archive (soft delete) a goal.
        
        Args:
            user_id: User's unique identifier
            goal_id: Goal's unique identifier
            
        Raises:
            GoalNotFoundError: If goal doesn't exist
            GoalPermissionError: If user doesn't own the goal
            GoalAlreadyCompletedError: If goal is already archived
        """
        # Get existing goal
        existing_goal = self.repository.get_goal(user_id, goal_id)
        
        if not existing_goal:
            logger.warning(f"Goal {goal_id} not found for user {user_id}")
            raise GoalNotFoundError(goal_id, user_id)
        
        # Verify ownership
        if existing_goal.userId != user_id:
            logger.warning(f"User {user_id} attempted to archive goal {goal_id} owned by {existing_goal.userId}")
            raise GoalPermissionError("delete", goal_id)
        
        # Check if already archived
        if existing_goal.status == GoalStatus.ARCHIVED:
            logger.info(f"Goal {goal_id} is already archived")
            raise GoalAlreadyCompletedError(goal_id)
        
        # Archive the goal
        success = self.repository.delete_goal(user_id, goal_id)
        
        if not success:
            logger.error(f"Failed to archive goal {goal_id}")
            raise GoalError("Failed to archive goal")
        
        logger.info(f"Archived goal {goal_id} for user {user_id}")
        
        # TODO: In the future, we might want to:
        # - Archive related activities
        # - Send notification about archived goal
        # - Update any dependent goals
