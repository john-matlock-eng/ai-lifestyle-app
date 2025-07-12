import uuid
from unittest.mock import Mock

from src.patch_goal_module.service import PatchGoalModuleService
from src.goals_common.models import Goal, GoalTarget, GoalSchedule, GoalContext, GoalRewards, GoalProgress, GoalStatus, GoalPattern, GoalModule, PatchGoalModuleRequest


def make_goal(module=None):
    return Goal(
        goal_id=str(uuid.uuid4()),
        user_id="user1",
        title="Test",
        category="test",
        goal_pattern=GoalPattern.STREAK,
        target=GoalTarget(metric="count", value=1, unit="times", period="day", direction="increase"),
        schedule=GoalSchedule(),
        progress=GoalProgress(),
        context=GoalContext(),
        rewards=GoalRewards(),
        status=GoalStatus.ACTIVE,
        module=module,
    )


def test_patch_goal_module_persists(monkeypatch):
    service = PatchGoalModuleService()
    repo = Mock()
    existing = make_goal()
    updated = make_goal(module=GoalModule.JOURNAL)
    repo.get_goal.return_value = existing
    repo.update_goal.return_value = updated
    service.repository = repo

    request = PatchGoalModuleRequest(module=GoalModule.JOURNAL)
    result = service.patch_goal_module("user1", existing.goal_id, request)

    repo.update_goal.assert_called_once_with("user1", existing.goal_id, {"module": "journal"})
    assert result.module == GoalModule.JOURNAL
