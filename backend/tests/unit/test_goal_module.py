import uuid
from unittest.mock import patch

import pytest

from src.create_goal.service import CreateGoalService
from goals_common import CreateGoalRequest, GoalTarget, GoalPattern, MetricType, Direction, GoalModule


class TestGoalModuleCreation:
    @pytest.fixture
    def service(self):
        with patch('src.create_goal.service.GoalsRepository') as repo_cls:
            repo = repo_cls.return_value
            repo.list_user_goals.return_value = ([], None)
            repo.create_goal.side_effect = lambda g: g
            svc = CreateGoalService()
            return svc

    def test_create_goal_with_journal_module(self, service):
        request = CreateGoalRequest(
            title="Journal",
            category="wellness",
            goal_pattern=GoalPattern.STREAK,
            target=GoalTarget(metric=MetricType.COUNT, value=1, unit="entry", period="day", direction=Direction.INCREASE),
            module=GoalModule.JOURNAL
        )
        goal = service.create_goal(str(uuid.uuid4()), request)
        assert goal.module == GoalModule.JOURNAL
