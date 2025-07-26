"""
Service layer for retrieving journal statistics.
"""

from aws_lambda_powertools import Logger

from journal_common import JournalRepository, JournalStats

logger = Logger()


class GetJournalStatsService:
    """Handles journal statistics retrieval business logic."""

    def __init__(self):
        self.repository = JournalRepository()

    def get_stats(self, user_id: str) -> JournalStats:
        """
        Get journal statistics for a user.

        Args:
            user_id: User's unique identifier

        Returns:
            Journal statistics

        Raises:
            Exception: For database errors
        """
        try:
            # Get stats from repository
            stats = self.repository.get_user_stats(user_id)

            # If stats are all zeros, try to calculate from actual entries
            if stats.total_entries == 0:
                logger.info(f"No stats found for user {user_id}, calculating from entries")

                # Get all user entries to calculate stats
                all_entries = []
                last_key = None

                while True:
                    entries, next_key = self.repository.list_user_entries(
                        user_id=user_id, limit=100, last_evaluated_key=last_key
                    )
                    all_entries.extend(entries)

                    if not next_key:
                        break
                    last_key = next_key

                if all_entries:
                    # Calculate stats from entries
                    from datetime import datetime, timedelta
                    from datetime import datetime, timedelta, timezone

                    now = datetime.now(timezone.utc)

                    stats.total_entries = len(all_entries)
                    stats.total_words = sum(entry.word_count for entry in all_entries)
                    stats.average_words_per_entry = (
                        stats.total_words / stats.total_entries if stats.total_entries > 0 else 0
                    )

                    # Sort by date to find last entry
                    all_entries.sort(key=lambda e: e.created_at, reverse=True)
                    stats.last_entry_date = all_entries[0].created_at

                    # Count entries this week and month
                    week_ago = now - timedelta(days=7)
                    month_ago = now - timedelta(days=30)

                    stats.entries_this_week = sum(
                        1 for e in all_entries if e.created_at >= week_ago
                    )
                    stats.entries_this_month = sum(
                        1 for e in all_entries if e.created_at >= month_ago
                    )

                    # Calculate template usage
                    from collections import Counter

                    template_counts = Counter(e.template for e in all_entries)

                    from journal_common import TemplateUsage

                    stats.template_usage = []
                    for template, count in template_counts.most_common(5):
                        last_used = max(
                            (e.created_at for e in all_entries if e.template == template),
                            default=None,
                        )
                        if last_used:
                            stats.template_usage.append(
                                TemplateUsage(template=template, count=count, last_used=last_used)
                            )

                    # Simple streak calculation
                    stats.current_streak = 1  # At least one entry
                    stats.longest_streak = 1

                    # Save the calculated stats
                    try:
                        self.repository.update_user_stats(user_id, stats)
                    except Exception:
                        pass  # Don't fail if save fails

            logger.info(
                f"Retrieved journal stats for user {user_id}: entries={stats.total_entries}"
            )

            return stats

        except Exception as e:
            logger.error(f"Failed to get journal stats: {str(e)}")
            raise Exception(f"Failed to get journal stats: {str(e)}")
