"""
Service layer for journal entry creation business logic.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional
from aws_lambda_powertools import Logger

from journal_common import (
    JournalEntry, CreateJournalEntryRequest, JournalStats,
    JournalRepository
)

logger = Logger()

# Maximum number of journal entries per user
MAX_JOURNAL_ENTRIES = 10000


class CreateJournalEntryService:
    """Handles journal entry creation business logic."""
    
    def __init__(self):
        self.repository = JournalRepository()
    
    def create_entry(self, user_id: str, request: CreateJournalEntryRequest) -> JournalEntry:
        """
        Create a new journal entry for a user.
        
        Args:
            user_id: User's unique identifier
            request: Journal entry creation request data
            
        Returns:
            Created journal entry
            
        Raises:
            ValueError: If validation fails
            Exception: For other errors
        """
        try:
            # Check user's entry quota
            self._check_entry_quota(user_id)
            
            # Generate entry ID
            entry_id = str(uuid.uuid4())
            
            # Determine word count
            if request.is_encrypted:
                # For encrypted content, use client-provided word count
                if request.word_count is None:
                    raise ValueError("Word count is required for encrypted content")
                word_count = request.word_count
            else:
                # For unencrypted content, calculate word count
                word_count = len(request.content.split()) if request.content else 0
            
            # Build journal entry object
            entry = JournalEntry(
                entry_id=entry_id,
                user_id=user_id,
                title=request.title,
                content=request.content,
                template=request.template,
                word_count=word_count,
                tags=request.tags or [],
                mood=request.mood,
                linked_goal_ids=request.linked_goal_ids or [],
                goal_progress=request.goal_progress or [],
                is_encrypted=request.is_encrypted,
                encrypted_key=request.encrypted_key,
                is_shared=request.is_shared,
                shared_with=[],  # Empty initially
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            # Validate entry
            self._validate_entry(entry)
            
            # Save to repository
            created_entry = self.repository.create_entry(entry)
            
            # Update user statistics asynchronously (in real implementation)
            # For now, we'll do it synchronously
            self._update_user_stats(user_id, entry)
            
            logger.info(f"Created journal entry {entry_id} for user {user_id}")
            
            return created_entry
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to create journal entry: {str(e)}")
            raise Exception(f"Failed to create journal entry: {str(e)}")
    
    def _check_entry_quota(self, user_id: str) -> None:
        """
        Check if user has reached their entry quota.
        
        Args:
            user_id: User's unique identifier
            
        Raises:
            ValueError: If quota exceeded
        """
        # Get count of entries (simplified - in production, maintain a counter)
        entries, _ = self.repository.list_user_entries(
            user_id, 
            limit=1
        )
        
        # Get stats for actual count
        stats = self.repository.get_user_stats(user_id)
        
        if stats.total_entries >= MAX_JOURNAL_ENTRIES:
            logger.warning(f"User {user_id} has reached entry quota: {stats.total_entries}")
            raise ValueError(f"Entry quota exceeded. Maximum {MAX_JOURNAL_ENTRIES} entries allowed.")
    
    def _validate_entry(self, entry: JournalEntry) -> None:
        """
        Validate journal entry.
        
        Args:
            entry: Journal entry to validate
            
        Raises:
            ValueError: If validation fails
        """
        errors = []
        
        # Title validation
        if not entry.title or not entry.title.strip():
            errors.append("Title is required")
        elif len(entry.title) > 200:
            errors.append("Title must not exceed 200 characters")
        
        # Content validation
        if not entry.content or not entry.content.strip():
            errors.append("Content is required")
        elif not entry.is_encrypted and len(entry.content) > 50000:  # ~10,000 words
            # Only validate length for unencrypted content
            errors.append("Content must not exceed 50,000 characters")
        
        # Tags validation
        if entry.tags and len(entry.tags) > 20:
            errors.append("Maximum 20 tags allowed")
        
        # Linked goals validation
        if entry.linked_goal_ids and len(entry.linked_goal_ids) > 10:
            errors.append("Maximum 10 linked goals allowed")
        
        if errors:
            raise ValueError("; ".join(errors))
    
    def _update_user_stats(self, user_id: str, entry: JournalEntry) -> None:
        """
        Update user statistics after creating an entry.
        
        Args:
            user_id: User's unique identifier
            entry: Created journal entry
        """
        try:
            # Get current stats
            stats = self.repository.get_user_stats(user_id)
            
            # Update counts
            stats.total_entries += 1
            stats.total_words += entry.word_count
            
            # Update average
            stats.average_words_per_entry = stats.total_words / stats.total_entries
            
            # Update last entry date
            stats.last_entry_date = entry.created_at
            
            # Update template usage
            template_found = False
            for template_usage in stats.template_usage:
                if template_usage.template == entry.template:
                    template_usage.count += 1
                    template_usage.last_used = entry.created_at
                    template_found = True
                    break
            
            if not template_found and entry.template:
                from journal_common import TemplateUsage
                stats.template_usage.append(
                    TemplateUsage(
                        template=entry.template,
                        count=1,
                        last_used=entry.created_at
                    )
                )
            
            # Sort templates by usage
            stats.template_usage.sort(key=lambda x: x.count, reverse=True)
            stats.template_usage = stats.template_usage[:5]  # Keep top 5
            
            # Update goals tracked
            if entry.linked_goal_ids:
                stats.goals_tracked = len(set(entry.linked_goal_ids))
            
            # Calculate streaks (simplified - in production, this would be more complex)
            # For now, just increment if last entry was yesterday
            if stats.last_entry_date:
                days_diff = (entry.created_at.date() - stats.last_entry_date.date()).days
                if days_diff == 1:
                    stats.current_streak += 1
                elif days_diff > 1:
                    stats.current_streak = 1
            else:
                stats.current_streak = 1
            
            # Update longest streak
            if stats.current_streak > stats.longest_streak:
                stats.longest_streak = stats.current_streak
            
            # Save updated stats
            self.repository.update_user_stats(user_id, stats)
            
        except Exception as e:
            # Don't fail entry creation if stats update fails
            logger.error(f"Failed to update user stats: {str(e)}")