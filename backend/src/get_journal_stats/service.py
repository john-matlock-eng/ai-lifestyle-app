"""Service to compute journal statistics."""
from datetime import datetime
from typing import Dict, Any
from aws_lambda_powertools import Logger
from goals_common import GoalsRepository, GoalModule

logger = Logger()

class GetJournalStatsService:
    """Compute journal stats for a user."""
    def __init__(self):
        self.repository = GoalsRepository()

    def get_stats(self, user_id: str) -> Dict[str, Any]:
        goals, _ = self.repository.list_user_goals(user_id, limit=100)
        journal_goals = [g for g in goals if g.module == GoalModule.JOURNAL]
        total_entries = 0
        last_entry = None
        current_streak = 0
        goal_progress = []
        for goal in journal_goals:
            if goal.progress.last_activity_date:
                if not last_entry or goal.progress.last_activity_date > last_entry:
                    last_entry = goal.progress.last_activity_date
            if goal.progress.current_streak > current_streak:
                current_streak = goal.progress.current_streak
            # Estimate total entries via period history length
            total_entries += len(goal.progress.period_history)
            goal_progress.append({
                "goalId": goal.goal_id,
                "title": goal.title,
                "percentComplete": goal.progress.percent_complete,
                "streak": goal.progress.current_streak,
            })

        return {
            "totalEntries": total_entries,
            "currentStreak": current_streak,
            "lastEntryDate": last_entry.date().isoformat() if last_entry else None,
            "goalProgress": goal_progress,
        }
