"""Service for patching goal module."""
from aws_lambda_powertools import Logger
from goals_common import (
    GoalsRepository,
    GoalNotFoundError,
    GoalPermissionError,
    GoalError,
    PatchGoalModuleRequest,
    GoalModule,
)

logger = Logger()

class PatchGoalModuleService:
    """Handles updating the goal module flag."""
    def __init__(self):
        self.repository = GoalsRepository()

    def patch_goal_module(self, user_id: str, goal_id: str, request: PatchGoalModuleRequest):
        goal = self.repository.get_goal(user_id, goal_id)
        if not goal:
            raise GoalNotFoundError(goal_id, user_id)
        if goal.user_id != user_id:
            raise GoalPermissionError("patch module", goal_id)

        updates = {"module": request.module.value if isinstance(request.module, GoalModule) else None}
        updated = self.repository.update_goal(user_id, goal_id, updates)
        if not updated:
            raise GoalError("Failed to update goal")
        return updated
