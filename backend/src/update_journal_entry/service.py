"""
Service layer for updating journal entries.
"""

from datetime import datetime, timezone
from typing import Dict, Any
from aws_lambda_powertools import Logger

from journal_common import (
    JournalEntry, UpdateJournalEntryRequest,
    JournalRepository
)

logger = Logger()


class UpdateJournalEntryService:
    """Handles journal entry update business logic."""
    
    def __init__(self):
        self.repository = JournalRepository()
    
    def update_entry(
        self,
        user_id: str,
        entry_id: str,
        request: UpdateJournalEntryRequest
    ) -> JournalEntry:
        """
        Update a journal entry.
        
        Args:
            user_id: User's unique identifier
            entry_id: Journal entry ID
            request: Update request data
            
        Returns:
            Updated journal entry
            
        Raises:
            ValueError: If validation fails or entry not found
            Exception: For other errors
        """
        try:
            # First verify the entry exists and belongs to the user
            existing_entry = self.repository.get_entry(user_id, entry_id)
            
            if not existing_entry:
                logger.warning(f"Journal entry {entry_id} not found for user {user_id}")
                raise ValueError("Journal entry not found")
            
            # Prepare updates dictionary
            updates = {}
            
            if request.title is not None:
                if not request.title.strip():
                    raise ValueError("Title cannot be empty")
                if len(request.title) > 200:
                    raise ValueError("Title must not exceed 200 characters")
                updates['title'] = request.title
            
            if request.content is not None:
                if not request.content.strip():
                    raise ValueError("Content cannot be empty")
                if not existing_entry.is_encrypted and len(request.content) > 50000:
                    raise ValueError("Content must not exceed 50,000 characters")
                updates['content'] = request.content
                
                # Handle word count for content updates
                if request.is_encrypted or existing_entry.is_encrypted:
                    # For encrypted content, use client-provided word count
                    if request.word_count is None:
                        raise ValueError("Word count is required when updating encrypted content")
                    updates['word_count'] = request.word_count
                else:
                    # For unencrypted content, calculate word count
                    updates['word_count'] = len(request.content.split())
            
            if request.template is not None:
                updates['template'] = request.template
            
            if request.tags is not None:
                if len(request.tags) > 20:
                    raise ValueError("Maximum 20 tags allowed")
                updates['tags'] = request.tags
            
            if request.mood is not None:
                updates['mood'] = request.mood
            
            if request.linked_goal_ids is not None:
                if len(request.linked_goal_ids) > 10:
                    raise ValueError("Maximum 10 linked goals allowed")
                updates['linked_goal_ids'] = request.linked_goal_ids
            
            if request.goal_progress is not None:
                updates['goal_progress'] = [gp.model_dump() for gp in request.goal_progress]
            
            if request.is_shared is not None:
                updates['is_shared'] = request.is_shared
            
            if request.is_encrypted is not None:
                updates['is_encrypted'] = request.is_encrypted
            
            if request.encrypted_key is not None:
                updates['encrypted_key'] = request.encrypted_key
            
            if request.encryption_iv is not None:
                updates['encryption_iv'] = request.encryption_iv
            
            # If no updates provided, return existing entry
            if not updates:
                logger.info(f"No updates provided for journal entry {entry_id}")
                return existing_entry
            
            # Update the entry
            updated_entry = self.repository.update_entry(user_id, entry_id, updates)
            
            # Update user statistics if word count changed
            if 'word_count' in updates:
                self._update_word_count_stats(user_id, existing_entry.word_count, updates['word_count'])
            
            logger.info(f"Updated journal entry {entry_id} for user {user_id}")
            
            return updated_entry
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to update journal entry: {str(e)}")
            raise Exception(f"Failed to update journal entry: {str(e)}")
    
    def _update_word_count_stats(self, user_id: str, old_count: int, new_count: int) -> None:
        """
        Update user statistics when word count changes.
        
        Args:
            user_id: User's unique identifier
            old_count: Previous word count
            new_count: New word count
        """
        try:
            # Get current stats
            stats = self.repository.get_user_stats(user_id)
            
            # Update total words
            stats.total_words = stats.total_words - old_count + new_count
            
            # Update average
            if stats.total_entries > 0:
                stats.average_words_per_entry = stats.total_words / stats.total_entries
            
            # Save updated stats
            self.repository.update_user_stats(user_id, stats)
            
        except Exception as e:
            # Don't fail entry update if stats update fails
            logger.error(f"Failed to update word count stats: {str(e)}")