"""
Service layer for deleting journal entries.
"""

from datetime import datetime
from datetime import datetime, timezone

from aws_lambda_powertools import Logger

from journal_common import JournalRepository

logger = Logger()


class DeleteJournalEntryService:
    """Handles journal entry deletion business logic."""

    def __init__(self):
        self.repository = JournalRepository()

    def delete_entry(self, user_id: str, entry_id: str) -> bool:
        """
        Delete a journal entry.

        Args:
            user_id: User's unique identifier
            entry_id: Journal entry ID

        Returns:
            True if deleted, False if not found

        Raises:
            Exception: For database errors
        """
        try:
            # First get the entry to verify ownership and get word count
            existing_entry = self.repository.get_entry(user_id, entry_id)

            if not existing_entry:
                logger.warning(f"Journal entry {entry_id} not found for user {user_id}")
                return False

            # Delete the entry
            success = self.repository.delete_entry(user_id, entry_id)

            if success:
                # Update user statistics
                self._update_stats_after_deletion(user_id, existing_entry.word_count)
                logger.info(f"Deleted journal entry {entry_id} for user {user_id}")

            return success

        except Exception as e:
            logger.error(f"Failed to delete journal entry: {str(e)}")
            raise Exception(f"Failed to delete journal entry: {str(e)}")

    def _update_stats_after_deletion(self, user_id: str, deleted_word_count: int) -> None:
        """
        Update user statistics after deleting an entry.

        Args:
            user_id: User's unique identifier
            deleted_word_count: Word count of the deleted entry
        """
        try:
            # Get current stats
            stats = self.repository.get_user_stats(user_id)

            # Update counts
            if stats.total_entries > 0:
                stats.total_entries -= 1
                stats.total_words -= deleted_word_count

                # Update average
                if stats.total_entries > 0:
                    stats.average_words_per_entry = stats.total_words / stats.total_entries
                else:
                    stats.average_words_per_entry = 0.0

            # Note: We don't update streaks here as that requires more complex logic
            # to determine if the deleted entry was part of the current streak

            # Save updated stats
            self.repository.update_user_stats(user_id, stats)

        except Exception as e:
            # Don't fail entry deletion if stats update fails
            logger.error(f"Failed to update stats after deletion: {str(e)}")
