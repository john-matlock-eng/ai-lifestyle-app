from aws_lambda_powertools import Logger
from goals_common import GoalsRepository, GoalModule

logger = Logger()

class GetJournalStatsService:
    """Service to calculate journal statistics."""

    def __init__(self):
        self.repository = GoalsRepository()

    def get_stats(self, user_id: str):
        goals, _ = self.repository.list_user_goals(user_id)
        journal_goals = [g for g in goals if g.module == GoalModule.JOURNAL]
        goal_progress = []
        for g in journal_goals:
            goal_progress.append({
                'goalId': g.goal_id,
                'title': g.title,
                'percentComplete': g.calculate_progress(),
                'streak': g.progress.current_streak
            })
        return {
            'totalEntries': 0,
            'currentStreak': 0,
            'lastEntryDate': None,
            'goalProgress': goal_progress
        }
