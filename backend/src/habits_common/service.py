"""Service layer for habit tracking - contains business logic."""

import logging
from datetime import date, datetime
from typing import List, Optional
from uuid import uuid4

from .errors import HabitNotFoundError, ValidationError
from .models import (
    CreateHabitRequest,
    HabitAnalyticsResponse,
    HabitCheckInRequest,
    HabitCheckInResponse,
    HabitListResponse,
    HabitResponse,
    UpdateHabitRequest,
    UserStatsResponse,
)
from .repository import HabitRepository

logger = logging.getLogger(__name__)


class HabitService:
    """Service class for habit-related business logic."""

    def __init__(self, table_name: str):
        self.repository = HabitRepository(table_name)

    def create_habit(self, user_id: str, request: CreateHabitRequest) -> HabitResponse:
        """Create a new habit for a user."""
        # Validate request
        if not request.title or not request.title.strip():
            raise ValidationError("Habit title is required")

        # Generate habit ID
        habit_id = str(uuid4())

        # Convert request to dict for repository
        habit_data = request.dict(exclude_unset=True)

        logger.info(f"Creating habit {habit_id} for user {user_id}")

        return self.repository.create_habit(user_id, habit_id, habit_data)

    def get_habit(self, user_id: str, habit_id: str) -> HabitResponse:
        """Get a specific habit."""
        return self.repository.get_habit(user_id, habit_id)

    def list_habits(self, user_id: str) -> List[HabitResponse]:
        """List all habits for a user."""
        return self.repository.list_habits(user_id)

    def get_today_habits(self, user_id: str) -> HabitListResponse:
        """Get today's habits with stats."""
        habits = self.repository.get_today_habits(user_id)
        stats = self.repository.get_user_stats(user_id)

        return HabitListResponse(habits=habits, stats=stats)

    def update_habit(
        self, user_id: str, habit_id: str, request: UpdateHabitRequest
    ) -> HabitResponse:
        """Update a habit."""
        # Get the habit first to ensure it exists
        self.repository.get_habit(user_id, habit_id)

        # Convert request to dict, excluding None values
        updates = request.dict(exclude_unset=True, exclude_none=True)

        if not updates:
            raise ValidationError("No updates provided")

        logger.info(f"Updating habit {habit_id} for user {user_id}")

        return self.repository.update_habit(user_id, habit_id, updates)

    def delete_habit(self, user_id: str, habit_id: str) -> None:
        """Delete a habit."""
        logger.info(f"Deleting habit {habit_id} for user {user_id}")
        self.repository.delete_habit(user_id, habit_id)

    def check_in_habit(
        self, user_id: str, habit_id: str, request: HabitCheckInRequest
    ) -> HabitCheckInResponse:
        """Check in a habit for today."""
        today = date.today()

        # Validate the habit exists
        habit = self.repository.get_habit(user_id, habit_id)

        # Check if already checked in today
        existing_checkin = self.repository.get_habit_checkin(user_id, habit_id, today)
        if existing_checkin and existing_checkin.completed:
            raise ValidationError("Habit already completed today")

        logger.info(
            f"Checking in habit {habit_id} for user {user_id} - completed: {request.completed}"
        )

        return self.repository.check_in_habit(
            user_id=user_id,
            habit_id=habit_id,
            check_date=today,
            completed=request.completed,
            note=request.note,
            value=request.value,
        )

    def skip_habit(self, user_id: str, habit_id: str) -> None:
        """Mark a habit as skipped for today."""
        today = date.today()

        # Validate the habit exists
        self.repository.get_habit(user_id, habit_id)

        logger.info(f"Skipping habit {habit_id} for user {user_id}")

        self.repository.skip_habit(user_id, habit_id, today)

    def get_user_stats(self, user_id: str) -> UserStatsResponse:
        """Get user's gamification stats."""
        return self.repository.get_user_stats(user_id)

    def get_habit_analytics(
        self, user_id: str, habit_id: str, period: str = "month"
    ) -> HabitAnalyticsResponse:
        """Get analytics for a specific habit."""
        # Validate period
        if period not in ["week", "month", "year"]:
            raise ValidationError("Period must be 'week', 'month', or 'year'")

        # Validate the habit exists
        self.repository.get_habit(user_id, habit_id)

        return self.repository.get_habit_analytics(user_id, habit_id, period)

    def check_and_update_streaks(self, user_id: str) -> None:
        """Check and update all habit streaks for a user.

        This method should be called daily to update streaks that may have been broken.
        """
        habits = self.repository.list_habits(user_id)
        today = date.today()

        for habit in habits:
            if habit.current_streak > 0 and habit.last_completed:
                # Check if streak is broken
                last_completed_date = datetime.fromisoformat(habit.last_completed).date()
                days_since_last = (today - last_completed_date).days

                if days_since_last > 1:
                    # Streak is broken, reset to 0
                    logger.info(f"Resetting broken streak for habit {habit.id} (user {user_id})")
                    self.repository.update_habit(user_id, habit.id, {"current_streak": 0})

    def get_habit_suggestions(self, user_id: str) -> List[dict]:
        """Get AI-powered habit suggestions based on user's existing habits and goals.

        This is a placeholder for future AI integration.
        """
        # For now, return some common habit suggestions
        suggestions = [
            {
                "title": "Drink 8 glasses of water",
                "category": "health",
                "icon": "💧",
                "color": "#3B82F6",
                "motivational_text": "Stay hydrated for better health",
            },
            {
                "title": "10-minute morning meditation",
                "category": "mindfulness",
                "icon": "🧘",
                "color": "#8B5CF6",
                "motivational_text": "Start your day with clarity",
            },
            {
                "title": "Read for 30 minutes",
                "category": "learning",
                "icon": "📚",
                "color": "#10B981",
                "motivational_text": "Feed your mind daily",
            },
            {
                "title": "30-minute workout",
                "category": "fitness",
                "icon": "💪",
                "color": "#F59E0B",
                "motivational_text": "Strong body, strong mind",
            },
            {
                "title": "Write in journal",
                "category": "mindfulness",
                "icon": "📝",
                "color": "#EC4899",
                "motivational_text": "Reflect on your journey",
            },
        ]

        # Filter out suggestions for habits the user already has
        existing_habits = self.repository.list_habits(user_id)
        existing_titles = {h.title.lower() for h in existing_habits}

        return [s for s in suggestions if s["title"].lower() not in existing_titles]
