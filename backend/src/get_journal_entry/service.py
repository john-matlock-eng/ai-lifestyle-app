"""
Service layer for retrieving a journal entry.
"""

from typing import Optional
from aws_lambda_powertools import Logger

from journal_common import JournalEntry, JournalRepository

logger = Logger()


class GetJournalEntryService:
    """Handles journal entry retrieval business logic."""
    
    def __init__(self):
        self.repository = JournalRepository()
    
    def get_entry(self, user_id: str, entry_id: str) -> JournalEntry:
        """
        Get a journal entry by ID.
        
        Args:
            user_id: User's unique identifier
            entry_id: Journal entry ID
            
        Returns:
            Journal entry
            
        Raises:
            ValueError: If entry not found
            Exception: For other errors
        """
        try:
            # Get entry from repository
            entry = self.repository.get_entry(user_id, entry_id)
            
            if not entry:
                logger.warning(f"Journal entry {entry_id} not found for user {user_id}")
                raise ValueError("Journal entry not found")
            
            # Verify the entry belongs to the user
            if entry.user_id != user_id:
                logger.error(f"User {user_id} attempted to access entry {entry_id} owned by {entry.user_id}")
                raise ValueError("Journal entry not found")
            
            logger.info(f"Retrieved journal entry {entry_id} for user {user_id}")
            
            return entry
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to get journal entry: {str(e)}")
            raise Exception(f"Failed to get journal entry: {str(e)}")