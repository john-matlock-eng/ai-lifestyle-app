"""
Service layer for activity listing business logic.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, date
from aws_lambda_powertools import Logger

from goals_common import (
    GoalActivity, ActivityType, 
    GoalsRepository,
    GoalNotFoundError, GoalPermissionError, GoalError
)

logger = Logger()


class ListActivitiesService:
    """Handles activity listing business logic."""
    
    def __init__(self):
        self.repository = GoalsRepository()
    
    def list_activities(
        self,
        user_id: str,
        goal_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        activity_type_filter: Optional[List[ActivityType]] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        List activities for a specific goal.
        
        Args:
            user_id: User's unique identifier
            goal_id: Goal's unique identifier
            start_date: Filter activities after this date
            end_date: Filter activities before this date
            activity_type_filter: Filter by activity types
            page: Page number (1-based)
            limit: Items per page
            
        Returns:
            Dictionary with activities and pagination info
            
        Raises:
            GoalNotFoundError: If goal doesn't exist
            GoalPermissionError: If user doesn't own the goal
        """
        # Verify goal exists and user owns it
        goal = self.repository.get_goal(user_id, goal_id)
        
        if not goal:
            logger.warning(f"Goal {goal_id} not found for user {user_id}")
            raise GoalNotFoundError(goal_id, user_id)
        
        if goal.userId != user_id:
            logger.warning(f"User {user_id} attempted to list activities for goal {goal_id} owned by {goal.userId}")
            raise GoalPermissionError("list activities", goal_id)
        
        # Convert dates to datetime if provided
        start_datetime = None
        end_datetime = None
        
        if start_date:
            start_datetime = datetime.combine(start_date, datetime.min.time())
        
        if end_date:
            # Include the entire end date
            end_datetime = datetime.combine(end_date, datetime.max.time())
        
        # Get activities from repository
        # In production, this would be optimized with proper pagination
        all_activities = self.repository.get_goal_activities(
            user_id,
            goal_id,
            start_date=start_datetime,
            end_date=end_datetime,
            limit=1000  # Get more for filtering
        )
        
        # Apply activity type filter
        if activity_type_filter:
            filtered_activities = [
                a for a in all_activities 
                if a.activityType in activity_type_filter
            ]
        else:
            filtered_activities = all_activities
        
        # Calculate pagination
        total = len(filtered_activities)
        total_pages = (total + limit - 1) // limit  # Ceiling division
        
        # Ensure page is within bounds
        if page > total_pages and total_pages > 0:
            page = total_pages
        
        # Get the page slice
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        page_activities = filtered_activities[start_idx:end_idx]
        
        logger.info(f"Returning {len(page_activities)} activities for goal {goal_id} (page {page}/{total_pages})")
        
        # Convert to response format
        return {
            'activities': [activity.model_dump(by_alias=True) for activity in page_activities],
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': total_pages
            }
        }
