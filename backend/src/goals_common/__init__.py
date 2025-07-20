"""
Common components for the Enhanced Goal System.

This module provides shared models, repository patterns, and utilities
for all goal-related Lambda functions.
"""

from .errors import (
    ActivityNotFoundError,
    ActivityValidationError,
    AttachmentUploadError,
    GoalAlreadyCompletedError,
    GoalArchivedException,
    GoalError,
    GoalNotFoundError,
    GoalPermissionError,
    GoalQuotaExceededError,
    GoalSyncError,
    GoalValidationError,
    InvalidDateRangeError,
    InvalidGoalPatternError,
)
from .models import (  # Enums; Target and Schedule Models; Progress Models; Context Models; Main Models; Activity Models; Request/Response Models
    ActivityAttachment,
    ActivityAttachmentRequest,
    ActivityContext,
    ActivityLocation,
    ActivityType,
    CreateGoalRequest,
    Direction,
    Frequency,
    Goal,
    GoalActivity,
    GoalContext,
    GoalListResponse,
    GoalPattern,
    GoalProgress,
    GoalRewards,
    GoalSchedule,
    GoalStatus,
    GoalTarget,
    LocationType,
    LogActivityRequest,
    MetricType,
    MilestoneReward,
    Period,
    PeriodHistory,
    SocialContext,
    TargetType,
    TimeOfDay,
    TrendDirection,
    UpdateGoalRequest,
    Visibility,
    WeatherCondition,
)
from .repository import GoalsRepository
from .utils import (
    DateHelper,
    GoalValidator,
    ProgressCalculator,
)

__all__ = [
    # Enums
    "GoalPattern",
    "MetricType",
    "Period",
    "Direction",
    "TargetType",
    "Frequency",
    "GoalStatus",
    "Visibility",
    "TrendDirection",
    "ActivityType",
    "TimeOfDay",
    "LocationType",
    "SocialContext",
    # Models
    "GoalTarget",
    "GoalSchedule",
    "PeriodHistory",
    "GoalProgress",
    "GoalContext",
    "MilestoneReward",
    "GoalRewards",
    "Goal",
    "WeatherCondition",
    "ActivityLocation",
    "ActivityContext",
    "ActivityAttachment",
    "GoalActivity",
    # Request/Response
    "CreateGoalRequest",
    "UpdateGoalRequest",
    "GoalListResponse",
    "ActivityAttachmentRequest",
    "LogActivityRequest",
    # Repository
    "GoalsRepository",
    # Utilities
    "ProgressCalculator",
    "DateHelper",
    "GoalValidator",
    # Errors
    "GoalError",
    "GoalNotFoundError",
    "GoalValidationError",
    "GoalQuotaExceededError",
    "GoalPermissionError",
    "ActivityNotFoundError",
    "ActivityValidationError",
    "InvalidGoalPatternError",
    "GoalAlreadyCompletedError",
    "InvalidDateRangeError",
    "GoalArchivedException",
    "AttachmentUploadError",
    "GoalSyncError",
]
