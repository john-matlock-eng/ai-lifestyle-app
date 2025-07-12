"""
Service layer for listing journal entries.
"""

from typing import List, Optional, Tuple, Dict, Any
from aws_lambda_powertools import Logger

from journal_common import (
    JournalEntry, JournalListResponse,
    JournalRepository
)

logger = Logger()


class ListJournalEntriesService:
    """Handles journal entry listing business logic."""
    
    def __init__(self):
        self.repository = JournalRepository()
    
    def list_entries(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
        goal_id: Optional[str] = None
    ) -> JournalListResponse:
        """
        List journal entries for a user.
        
        Args:
            user_id: User's unique identifier
            page: Page number (1-based)
            limit: Maximum number of entries to return
            goal_id: Optional goal ID to filter by
            
        Returns:
            Journal list response with entries and pagination
        """
        try:
            # Validate pagination
            if page < 1:
                page = 1
            if limit < 1 or limit > 100:
                limit = 20
            
            # For DynamoDB pagination, we need to implement page-based pagination
            # This is not the most efficient for DynamoDB, but matches frontend expectations
            skip_count = (page - 1) * limit
            
            # Fetch entries
            # Note: This is a simplified implementation. In production, you'd want to
            # use cursor-based pagination for better performance with DynamoDB
            all_entries = []
            last_evaluated_key = None
            
            # Keep fetching until we have enough entries
            while len(all_entries) <= skip_count + limit:
                entries, next_key = self.repository.list_user_entries(
                    user_id=user_id,
                    limit=100,  # Fetch in batches
                    last_evaluated_key=last_evaluated_key,
                    goal_id=goal_id
                )
                
                all_entries.extend(entries)
                
                # If no more entries, break
                if not next_key:
                    break
                    
                last_evaluated_key = next_key
            
            # Apply pagination
            start_idx = skip_count
            end_idx = skip_count + limit
            paginated_entries = all_entries[start_idx:end_idx]
            
            # Get user stats for total count
            stats = self.repository.get_user_stats(user_id)
            
            # Determine if there are more entries
            has_more = len(all_entries) > end_idx
            
            # Build response
            response = JournalListResponse(
                entries=paginated_entries,
                total=stats.total_entries,
                page=page,
                limit=limit,
                has_more=has_more
            )
            
            logger.info(f"Listed {len(paginated_entries)} journal entries for user {user_id} (page {page})")
            
            return response
            
        except Exception as e:
            logger.error(f"Failed to list journal entries: {str(e)}")
            raise Exception(f"Failed to list journal entries: {str(e)}")