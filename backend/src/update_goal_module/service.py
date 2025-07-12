from aws_lambda_powertools import Logger
from goals_common import GoalsRepository, GoalError, GoalNotFoundError, GoalPermissionError, GoalModule

logger = Logger()

class UpdateGoalModuleService:
    """Service to update a goal's module flag."""

    def __init__(self):
        self.repository = GoalsRepository()

    def update_module(self, user_id: str, goal_id: str, module: GoalModule | None):
        goal = self.repository.get_goal(user_id, goal_id)
        if not goal:
            raise GoalNotFoundError(goal_id, user_id)
        if goal.user_id != user_id:
            raise GoalPermissionError("update", goal_id)
        updated = self.repository.update_goal(user_id, goal_id, {"module": module})
        if not updated:
            raise GoalError("Failed to update goal module")
        return updated
