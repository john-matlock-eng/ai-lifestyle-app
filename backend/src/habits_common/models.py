"""Habit tracking models for request/response validation."""
from datetime import datetime, date
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, validator
from uuid import uuid4


class HabitPattern(str):
    """Enum for habit tracking patterns."""
    DAILY = "daily"
    WEEKLY = "weekly"
    CUSTOM = "custom"


class HabitCategory(str):
    """Common habit categories."""
    HEALTH = "health"
    FITNESS = "fitness"
    PRODUCTIVITY = "productivity"
    MINDFULNESS = "mindfulness"
    LEARNING = "learning"
    SOCIAL = "social"
    CREATIVE = "creative"
    FINANCIAL = "financial"
    OTHER = "other"


class HabitBase(BaseModel):
    """Base habit model with common fields."""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: str = Field(default=HabitCategory.OTHER)
    icon: str = Field(default="📌")
    color: str = Field(default="#3B82F6", regex="^#[0-9A-Fa-f]{6}$")
    pattern: Literal["daily", "weekly", "custom"] = Field(default=HabitPattern.DAILY)
    target_days: int = Field(default=30, ge=1, le=365)
    motivational_text: Optional[str] = Field(None, max_length=200)
    reminder_time: Optional[str] = Field(None, regex="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    
    class Config:
        schema_extra = {
            "example": {
                "title": "Morning Meditation",
                "description": "10 minutes of mindfulness meditation",
                "category": "mindfulness",
                "icon": "🧘",
                "color": "#8B5CF6",
                "pattern": "daily",
                "target_days": 30,
                "motivational_text": "A calm mind is a powerful mind",
                "reminder_time": "07:00"
            }
        }


class CreateHabitRequest(HabitBase):
    """Request model for creating a new habit."""
    goal_id: Optional[str] = Field(None, description="Link to existing goal")
    show_on_dashboard: bool = Field(default=True)


class UpdateHabitRequest(BaseModel):
    """Request model for updating a habit."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = Field(None, regex="^#[0-9A-Fa-f]{6}$")
    target_days: Optional[int] = Field(None, ge=1, le=365)
    motivational_text: Optional[str] = Field(None, max_length=200)
    reminder_time: Optional[str] = Field(None, regex="^([01]?[0-9]|2[0-3]):[0-5][0-9]$")
    show_on_dashboard: Optional[bool] = None
    display_order: Optional[int] = None


class HabitCheckInRequest(BaseModel):
    """Request model for checking in a habit."""
    completed: bool
    note: Optional[str] = Field(None, max_length=500)
    value: Optional[float] = Field(None, description="For habits with measurable values")


class HabitResponse(HabitBase):
    """Response model for a single habit."""
    id: str
    user_id: str
    goal_id: Optional[str]
    current_streak: int = 0
    longest_streak: int = 0
    last_completed: Optional[datetime] = None
    completed_today: bool = False
    skipped_today: bool = False
    week_progress: List[bool] = Field(default_factory=lambda: [False] * 7)
    points: int = 0
    bonus_multiplier: float = 1.0
    display_order: int = 0
    show_on_dashboard: bool = True
    created_at: datetime
    updated_at: datetime
    
    @validator('week_progress', pre=True)
    def ensure_week_progress_list(cls, v):
        if isinstance(v, list):
            # Ensure it's exactly 7 elements
            return (v + [False] * 7)[:7]
        return [False] * 7


class HabitCheckInResponse(BaseModel):
    """Response model for habit check-in."""
    habit_id: str
    date: date
    completed: bool
    skipped: bool
    value: Optional[float]
    note: Optional[str]
    points: int
    streak_continued: bool
    current_streak: int
    milestone_reached: Optional[int] = None
    bonus_earned: bool = False


class UserStatsResponse(BaseModel):
    """Response model for user gamification stats."""
    total_points: int = 0
    current_level: int = 1
    next_level_progress: float = 0.0
    weekly_streak: int = 0
    perfect_days: int = 0
    total_check_ins: int = 0
    habits_completed_today: int = 0
    total_habits: int = 0
    
    @validator('next_level_progress')
    def validate_progress(cls, v):
        return max(0.0, min(100.0, v))


class HabitListResponse(BaseModel):
    """Response model for list of habits."""
    habits: List[HabitResponse]
    stats: UserStatsResponse


class HabitAnalyticsResponse(BaseModel):
    """Response model for habit analytics."""
    habit_id: str
    period: Literal["week", "month", "year"]
    completion_rate: float
    average_streak: float
    best_time_of_day: Optional[str]
    total_completions: int
    missed_days: int
    current_trend: Literal["improving", "declining", "stable"]
    correlations: List[dict] = Field(default_factory=list)
    
    class Config:
        schema_extra = {
            "example": {
                "habit_id": "123e4567-e89b-12d3-a456-426614174000",
                "period": "month",
                "completion_rate": 85.7,
                "average_streak": 5.3,
                "best_time_of_day": "morning",
                "total_completions": 24,
                "missed_days": 4,
                "current_trend": "improving",
                "correlations": [
                    {"habit_id": "abc123", "habit_title": "Exercise", "correlation": 0.73}
                ]
            }
        }
