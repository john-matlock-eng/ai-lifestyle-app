"""
Core models for the Enhanced Goal System.

These models support all 5 goal patterns:
1. Recurring Goals - "Do X every day/week/month"
2. Milestone Goals - "Achieve X total"
3. Target Goals - "Reach X by date Y"
4. Streak Goals - "Do X for Y consecutive periods"
5. Limit Goals - "Keep X below Y"
"""

from datetime import datetime
from typing import Optional, List, Dict, Any, Literal, Union
from pydantic import BaseModel, Field, field_validator, model_validator, ConfigDict, ValidationInfo
from pydantic.alias_generators import to_camel
from decimal import Decimal
from enum import Enum


# Enums for Goal System
class GoalPattern(str, Enum):
    """The 5 supported goal patterns."""
    RECURRING = "recurring"    # Daily steps, weekly workouts
    MILESTONE = "milestone"    # Write 50k words total
    TARGET = "target"         # Lose 20 lbs by June
    STREAK = "streak"         # 100-day meditation
    LIMIT = "limit"           # Screen time < 2 hrs


class MetricType(str, Enum):
    """Types of metrics that can be tracked."""
    COUNT = "count"
    DURATION = "duration"
    AMOUNT = "amount"
    WEIGHT = "weight"
    DISTANCE = "distance"
    CALORIES = "calories"
    MONEY = "money"
    CUSTOM = "custom"


class Period(str, Enum):
    """Time periods for recurring and limit goals."""
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"


class Direction(str, Enum):
    """Goal direction."""
    INCREASE = "increase"
    DECREASE = "decrease"
    MAINTAIN = "maintain"


class TargetType(str, Enum):
    """How to evaluate the target."""
    MINIMUM = "minimum"
    MAXIMUM = "maximum"
    EXACT = "exact"
    RANGE = "range"


class Frequency(str, Enum):
    """Scheduling frequency."""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    CUSTOM = "custom"


class GoalStatus(str, Enum):
    """Goal lifecycle status."""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Visibility(str, Enum):
    """Goal visibility settings."""
    PRIVATE = "private"
    FRIENDS = "friends"
    PUBLIC = "public"


class TrendDirection(str, Enum):
    """Progress trend direction."""
    IMPROVING = "improving"
    STABLE = "stable"
    DECLINING = "declining"


# Target Definition Models
class GoalTarget(BaseModel):
    """Flexible target definition for all goal patterns."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    metric: MetricType
    value: float = Field(gt=0, description="The goal value")
    unit: str = Field(..., min_length=1, max_length=50, description="Unit of measurement")
    
    # For recurring/limit goals
    period: Optional[Period] = None
    
    # For milestone/target goals
    target_date: Optional[datetime] = None
    start_value: Optional[float] = Field(None, description="Starting point (weight, savings, etc.)")
    current_value: Optional[float] = Field(None, description="Latest measurement")
    
    # Goal direction
    direction: Direction
    target_type: TargetType = Field(default=TargetType.EXACT)
    
    # For range targets
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    
    @field_validator('period')
    @classmethod
    def validate_period(cls, v):
        """Ensure period is set for recurring and limit goals."""
        # This validator will be called from the parent model
        return v
    
    @field_validator('target_date')
    @classmethod
    def validate_target_date(cls, v):
        """Ensure target date is in the future for new goals."""
        if v and v < datetime.utcnow():
            # Allow past dates for imported/historical goals
            # But log a warning
            pass
        return v


# Schedule Models
class GoalSchedule(BaseModel):
    """Smart scheduling for goals."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    frequency: Optional[Frequency] = None
    days_of_week: Optional[List[int]] = Field(None, description="0=Monday, 6=Sunday")
    preferred_times: Optional[List[str]] = Field(None, description="HH:MM format")
    
    check_in_frequency: Frequency = Frequency.DAILY
    
    allow_skip_days: Optional[int] = Field(None, ge=0, description="Allowed skip days per period")
    catch_up_allowed: bool = Field(True, description="Can make up missed days")
    
    @field_validator('days_of_week')
    @classmethod
    def validate_days(cls, v):
        if v:
            for day in v:
                if not 0 <= day <= 6:
                    raise ValueError("Days must be 0-6 (Monday-Sunday)")
        return v
    
    @field_validator('preferred_times')
    @classmethod
    def validate_times(cls, v):
        if v:
            for time in v:
                try:
                    hours, minutes = time.split(':')
                    if not (0 <= int(hours) <= 23 and 0 <= int(minutes) <= 59):
                        raise ValueError
                except:
                    raise ValueError(f"Invalid time format: {time}. Use HH:MM")
        return v


# Progress Tracking Models
class PeriodHistory(BaseModel):
    """History entry for a specific period."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    period: str  # e.g., "2024-01-01" for daily, "2024-W01" for weekly
    achieved: bool
    value: float
    date: datetime


class GoalProgress(BaseModel):
    """Universal progress tracking for all goal patterns."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    # Universal fields
    percent_complete: float = Field(0.0, ge=0, le=100)
    last_activity_date: Optional[datetime] = None
    
    # For recurring goals
    current_period_value: Optional[float] = None
    period_history: List[PeriodHistory] = Field(default_factory=list)
    
    # For milestone goals
    total_accumulated: Optional[float] = None
    remaining_to_goal: Optional[float] = None
    
    # For streak goals
    current_streak: int = 0
    longest_streak: int = 0
    target_streak: Optional[int] = None
    
    # For limit goals
    average_value: Optional[float] = None
    days_over_limit: Optional[int] = None
    
    # Trends
    trend: TrendDirection = TrendDirection.STABLE
    projected_completion: Optional[datetime] = None
    success_rate: float = Field(0.0, ge=0, le=100)


# Context Models
class GoalContext(BaseModel):
    """AI-friendly context for personalization."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    motivation: Optional[str] = Field(None, max_length=500)
    importance_level: int = Field(3, ge=1, le=5)
    
    supporting_goals: List[str] = Field(default_factory=list, description="Goal IDs that help this one")
    conflicting_goals: List[str] = Field(default_factory=list, description="Goal IDs that compete")
    
    obstacles: List[str] = Field(default_factory=list)
    success_factors: List[str] = Field(default_factory=list)
    
    preferred_activities: List[str] = Field(default_factory=list)
    avoid_activities: List[str] = Field(default_factory=list)


# Gamification Models
class MilestoneReward(BaseModel):
    """Reward for reaching a milestone."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    value: float
    reward: str
    unlocked_at: Optional[datetime] = None


class GoalRewards(BaseModel):
    """Gamification elements."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    points_per_activity: int = Field(10, ge=0)
    milestone_rewards: List[MilestoneReward] = Field(default_factory=list)
    badges: List[str] = Field(default_factory=list)


# Main Goal Model
class Goal(BaseModel):
    """Enhanced goal model supporting all 5 patterns."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    # Identification
    goal_id: str = Field(..., description="Unique goal identifier")
    user_id: str = Field(..., description="User who owns this goal")
    
    # Basic Info
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: str = Field(..., min_length=1, max_length=50)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    
    # Goal Pattern - THE KEY FIELD
    goal_pattern: GoalPattern
    
    # Flexible Target Definition
    target: GoalTarget
    
    # Smart Scheduling
    schedule: Optional[GoalSchedule] = None
    
    # Progress Tracking
    progress: GoalProgress = Field(default_factory=GoalProgress)
    
    # AI-Friendly Context
    context: Optional[GoalContext] = Field(default_factory=GoalContext)
    
    # Gamification
    rewards: Optional[GoalRewards] = Field(default_factory=GoalRewards)
    
    # Status
    status: GoalStatus = GoalStatus.DRAFT
    visibility: Visibility = Visibility.PRIVATE
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    
    # Feature-specific extensions
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    @model_validator(mode='after')
    def validate_target_for_pattern(self):
        """Ensure target is configured correctly for the goal pattern."""
        if not self.goal_pattern or not self.target:
            return self
            
        if self.goal_pattern in [GoalPattern.RECURRING, GoalPattern.LIMIT]:
            if not self.target.period:
                raise ValueError(f"{self.goal_pattern} goals require a period")
                
        if self.goal_pattern in [GoalPattern.MILESTONE, GoalPattern.TARGET]:
            if not self.target.target_date:
                raise ValueError(f"{self.goal_pattern} goals require a target date")
                
        return self
    
    def calculate_progress(self) -> float:
        """Calculate progress percentage based on goal pattern."""
        if self.goal_pattern == GoalPattern.RECURRING:
            # Based on success rate over time
            return self.progress.success_rate
            
        elif self.goal_pattern == GoalPattern.MILESTONE:
            # Based on accumulated vs target
            if self.progress.total_accumulated and self.target.value:
                return min(100, (self.progress.total_accumulated / self.target.value) * 100)
                
        elif self.goal_pattern == GoalPattern.TARGET:
            # Based on progress from start to target
            if self.target.start_value is not None and self.target.current_value is not None:
                total_change_needed = abs(self.target.value - self.target.start_value)
                current_change = abs(self.target.current_value - self.target.start_value)
                if total_change_needed > 0:
                    return min(100, (current_change / total_change_needed) * 100)
                    
        elif self.goal_pattern == GoalPattern.STREAK:
            # Based on current streak vs target
            if self.progress.target_streak:
                return min(100, (self.progress.current_streak / self.progress.target_streak) * 100)
                
        elif self.goal_pattern == GoalPattern.LIMIT:
            # Based on days within limit
            if self.progress.days_over_limit is not None:
                # Inverse - fewer days over limit is better
                total_days = len(self.progress.period_history)
                if total_days > 0:
                    days_within_limit = total_days - self.progress.days_over_limit
                    return (days_within_limit / total_days) * 100
                    
        return 0.0


# Request/Response Models for API
class CreateGoalRequest(BaseModel):
    """Request to create a new goal."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: str = Field(..., min_length=1, max_length=50)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    
    goal_pattern: GoalPattern
    target: GoalTarget
    schedule: Optional[GoalSchedule] = None
    context: Optional[GoalContext] = None
    
    visibility: Visibility = Visibility.PRIVATE
    status: Optional[GoalStatus] = None


class UpdateGoalRequest(BaseModel):
    """Request to update an existing goal."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    
    target: Optional[GoalTarget] = None
    schedule: Optional[GoalSchedule] = None
    context: Optional[GoalContext] = None
    
    visibility: Optional[Visibility] = None
    status: Optional[GoalStatus] = None


class GoalListResponse(BaseModel):
    """Response containing a list of goals."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    goals: List[Goal]
    total: int
    page: int
    limit: int


# Goal Activity Models
class ActivityType(str, Enum):
    """Type of goal activity."""
    PROGRESS = "progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    PARTIAL = "partial"


class TimeOfDay(str, Enum):
    """Time of day categories."""
    EARLY_MORNING = "early-morning"  # 4am-7am
    MORNING = "morning"              # 7am-12pm
    AFTERNOON = "afternoon"          # 12pm-5pm
    EVENING = "evening"              # 5pm-9pm
    NIGHT = "night"                  # 9pm-4am


class LocationType(str, Enum):
    """Types of locations."""
    HOME = "home"
    WORK = "work"
    GYM = "gym"
    OUTDOORS = "outdoors"
    TRAVEL = "travel"


class SocialContext(str, Enum):
    """Social context of activity."""
    ALONE = "alone"
    PARTNER = "partner"
    FRIENDS = "friends"
    GROUP = "group"
    ONLINE = "online"


class WeatherCondition(BaseModel):
    """Weather information."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    condition: str
    temperature: float
    humidity: float


class ActivityLocation(BaseModel):
    """Location information for an activity."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    type: LocationType
    city: Optional[str] = None
    coordinates: Optional[List[float]] = Field(None, min_items=2, max_items=2)


class ActivityContext(BaseModel):
    """Rich context for AI analysis."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    # Temporal
    time_of_day: TimeOfDay
    day_of_week: str
    is_weekend: bool
    is_holiday: bool = False
    
    # Environmental
    weather: Optional[WeatherCondition] = None
    
    # Physical state
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    
    # Social context
    with_others: bool = False
    social_context: Optional[SocialContext] = None
    
    # Activity flow
    previous_activity: Optional[str] = None
    next_activity: Optional[str] = None
    duration: Optional[int] = Field(None, gt=0, description="Duration in minutes")
    
    # Subjective
    difficulty: Optional[int] = Field(None, ge=1, le=5)
    enjoyment: Optional[int] = Field(None, ge=1, le=5)
    mood: Optional[str] = Field(None, max_length=50)


class ActivityAttachment(BaseModel):
    """Attachment to an activity."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    type: Literal["image", "link", "reference"]
    url: str
    entity_id: Optional[str] = None


class GoalActivity(BaseModel):
    """Activity logged against a goal."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    activity_id: str
    goal_id: str
    user_id: str
    
    # What happened
    value: float
    unit: str
    activity_type: ActivityType
    
    # When & Where
    activity_date: datetime
    logged_at: datetime = Field(default_factory=datetime.utcnow)
    timezone: str = Field("UTC")
    location: Optional[ActivityLocation] = None
    
    # Rich Context for AI
    context: ActivityContext
    
    # Evidence
    note: Optional[str] = Field(None, max_length=1000)
    attachments: List[ActivityAttachment] = Field(default_factory=list)
    
    # Integration
    source: Literal["manual", "device", "integration", "import"] = "manual"
    device_info: Optional[Dict[str, str]] = None


class LogActivityRequest(BaseModel):
    """Request to log a goal activity."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    value: float
    unit: str
    activity_type: ActivityType = ActivityType.PROGRESS
    
    activity_date: Optional[str] = None  # Date string in YYYY-MM-DD format
    location: Optional[ActivityLocation] = None
    
    context: Optional[ActivityContext] = None
    note: Optional[str] = Field(None, max_length=500)
    attachments: Optional[List[ActivityAttachmentRequest]] = None
    
    source: Literal["manual", "device", "integration", "import"] = "manual"


class ActivityAttachmentRequest(BaseModel):
    """Request format for activity attachments."""
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    
    type: Literal["image", "link", "reference"]
    url: Optional[str] = None  # Required for link type
    entity_id: Optional[str] = None  # Required for reference type
