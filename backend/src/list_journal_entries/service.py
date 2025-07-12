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
        limit: int = 20,
        page_token: Optional[str] = None,
        goal_id: Optional[str] = None
    ) -> JournalListResponse:
        """
        List journal entries for a user.
        
        Args:
            user_id: User's unique identifier
            limit: Maximum number of entries to return
            page_token: Pagination token
            goal_id: Optional goal ID to filter by
            
        Returns:
            Journal list response with entries and pagination
        """
        try:
            # Validate limit
            if limit < 1 or limit > 100:
                limit = 20
            
            # Convert page token to last evaluated key
            last_evaluated_key = None
            if page_token:
                try:
                    import base64
                    import json
                    decoded = base64.b64decode(page_token).decode('utf-8')
                    last_evaluated_key = json.loads(decoded)
                except Exception as e:
                    logger.warning(f"Invalid page token: {str(e)}")
                    # Invalid page token, start from beginning
                    last_evaluated_key = None
            
            # Get entries from repository
            entries, next_key = self.repository.list_user_entries(
                user_id=user_id,
                limit=limit,
                last_evaluated_key=last_evaluated_key,
                goal_id=goal_id
            )
            
            # Convert next key to page token
            next_page_token = None
            if next_key:
                try:
                    import base64
                    import json
                    encoded = base64.b64encode(
                        json.dumps(next_key).encode('utf-8')
                    ).decode('utf-8')
                    next_page_token = encoded
                except Exception as e:
                    logger.error(f"Failed to encode page token: {str(e)}")
            
            # Get user stats for the response
            stats = self.repository.get_user_stats(user_id)
            
            # Build response
            response = JournalListResponse(
                entries=entries,
                next_page_token=next_page_token,
                total_count=stats.total_entries,
                has_more=next_page_token is not None
            )
            
            logger.info(f"Listed {len(entries)} journal entries for user {user_id}")
            
            return response
            
        except Exception as e:
            logger.error(f"Failed to list journal entries: {str(e)}")
            raise Exception(f"Failed to list journal entries: {str(e)}")