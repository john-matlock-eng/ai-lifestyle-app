"""
Service layer for goal listing business logic.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from aws_lambda_powertools import Logger

from goals_common import (
    Goal, GoalStatus, GoalPattern, GoalsRepository,
    GoalError
)

logger = Logger()


class ListGoalsService:
    """Handles goal listing business logic."""
    
    def __init__(self):
        self.repository = GoalsRepository()
    
    def list_goals(
        self,
        user_id: str,
        status_filter: Optional[List[GoalStatus]] = None,
        pattern_filter: Optional[List[GoalPattern]] = None,
        category_filter: Optional[List[str]] = None,
        page: int = 1,
        limit: int = 20,
        sort: str = 'updated_desc'
    ) -> Dict[str, Any]:
        """
        List user's goals with filtering and pagination.
        
        Args:
            user_id: User's unique identifier
            status_filter: Filter by goal status
            pattern_filter: Filter by goal pattern
            category_filter: Filter by category
            page: Page number (1-based)
            limit: Items per page
            sort: Sort order
            
        Returns:
            Dictionary with goals and pagination info
        """
        try:
            # For now, we'll fetch all goals and filter in memory
            # In production, this would be optimized with proper DynamoDB queries
            all_goals = []
            last_evaluated_key = None
            
            # Fetch all goals for the user
            while True:
                goals_batch, next_key = self.repository.list_user_goals(
                    user_id,
                    limit=100,
                    last_evaluated_key=last_evaluated_key
                )
                all_goals.extend(goals_batch)
                
                if not next_key:
                    break
                last_evaluated_key = next_key
            
            # Apply filters
            filtered_goals = self._apply_filters(
                all_goals,
                status_filter,
                pattern_filter,
                category_filter
            )
            
            # Apply sorting
            sorted_goals = self._apply_sorting(filtered_goals, sort)
            
            # Calculate pagination
            total = len(sorted_goals)
            total_pages = (total + limit - 1) // limit  # Ceiling division
            
            # Ensure page is within bounds
            if page > total_pages and total_pages > 0:
                page = total_pages
            
            # Get the page slice
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            page_goals = sorted_goals[start_idx:end_idx]
            
            logger.info(f"Returning {len(page_goals)} goals for user {user_id} (page {page}/{total_pages})")
            
            # Convert to response format
            return {
                'goals': [goal.model_dump(by_alias=True) for goal in page_goals],
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'pages': total_pages
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to list goals: {str(e)}")
            raise GoalError(f"Failed to list goals: {str(e)}")
    
    def _apply_filters(
        self,
        goals: List[Goal],
        status_filter: Optional[List[GoalStatus]],
        pattern_filter: Optional[List[GoalPattern]],
        category_filter: Optional[List[str]]
    ) -> List[Goal]:
        """Apply filters to goal list."""
        filtered = goals
        
        # Filter by status
        if status_filter:
            filtered = [g for g in filtered if g.status in status_filter]
        
        # Filter by pattern
        if pattern_filter:
            filtered = [g for g in filtered if g.goal_pattern in pattern_filter]
        
        # Filter by category
        if category_filter:
            # Case-insensitive category matching
            lower_categories = [c.lower() for c in category_filter]
            filtered = [g for g in filtered if g.category.lower() in lower_categories]
        
        return filtered
    
    def _apply_sorting(self, goals: List[Goal], sort: str) -> List[Goal]:
        """Apply sorting to goal list."""
        def make_tz_aware(dt: datetime) -> datetime:
            """Ensure datetime is timezone-aware for comparison."""
            if dt and dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt
        
        if sort == 'created_asc':
            return sorted(goals, key=lambda g: make_tz_aware(g.created_at))
        elif sort == 'created_desc':
            return sorted(goals, key=lambda g: make_tz_aware(g.created_at), reverse=True)
        elif sort == 'updated_asc':
            return sorted(goals, key=lambda g: make_tz_aware(g.updated_at))
        elif sort == 'updated_desc':
            return sorted(goals, key=lambda g: make_tz_aware(g.updated_at), reverse=True)
        elif sort == 'title_asc':
            return sorted(goals, key=lambda g: g.title.lower())
        elif sort == 'title_desc':
            return sorted(goals, key=lambda g: g.title.lower(), reverse=True)
        else:
            # Default to updated desc
            return sorted(goals, key=lambda g: make_tz_aware(g.updated_at), reverse=True)
