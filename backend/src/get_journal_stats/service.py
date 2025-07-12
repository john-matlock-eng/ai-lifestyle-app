"""
Service layer for retrieving journal statistics.
"""

from aws_lambda_powertools import Logger

from journal_common import JournalStats, JournalRepository

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
            
            logger.info(f"Retrieved journal stats for user {user_id}")
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get journal stats: {str(e)}")
            raise Exception(f"Failed to get journal stats: {str(e)}")