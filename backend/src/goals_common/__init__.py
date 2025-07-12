"""
Common components for the Enhanced Goal System.

This module provides shared models, repository patterns, and utilities
for all goal-related Lambda functions.
"""

from .models import (
    # Enums
    GoalPattern,
    MetricType,
    Period,
    Direction,
    TargetType,
    Frequency,
    GoalStatus,
    Visibility,
    TrendDirection,
    ActivityType,
    TimeOfDay,
    LocationType,
    SocialContext,
    
    # Target and Schedule Models
    GoalTarget,
    GoalSchedule,
    
    # Progress Models
    PeriodHistory,
    GoalProgress,
    
    # Context Models
    GoalContext,
    MilestoneReward,
    GoalRewards,
    
    # Main Models
    Goal,
    
    # Activity Models
    WeatherCondition,
    ActivityLocation,
    ActivityContext,
    ActivityAttachment,
    GoalActivity,
    
    # Request/Response Models
    CreateGoalRequest,
    UpdateGoalRequest,
    GoalListResponse,
    ActivityAttachmentRequest,
    LogActivityRequest,
)

from .repository import GoalsRepository

from .utils import (
    ProgressCalculator,
    DateHelper,
    GoalValidator,
)

from .errors import (
    GoalError,
    GoalNotFoundError,
    GoalValidationError,
    GoalQuotaExceededError,
    GoalPermissionError,
    ActivityNotFoundError,
    ActivityValidationError,
    InvalidGoalPatternError,
    GoalAlreadyCompletedError,
    InvalidDateRangeError,
    GoalArchivedException,
    AttachmentUploadError,
    GoalSyncError,
)

__all__ = [
    # Enums
    'GoalPattern',
    'MetricType',
    'Period',
    'Direction',
    'TargetType',
    'Frequency',
    'GoalStatus',
    'Visibility',
    'TrendDirection',
    'GoalModule',
    'ActivityType',
    'TimeOfDay',
    'LocationType',
    'SocialContext',
    
    # Models
    'GoalTarget',
    'GoalSchedule',
    'PeriodHistory',
    'GoalProgress',
    'GoalContext',
    'MilestoneReward',
    'GoalRewards',
    'Goal',
    'WeatherCondition',
    'ActivityLocation',
    'ActivityContext',
    'ActivityAttachment',
    'GoalActivity',
    
    # Request/Response
    'CreateGoalRequest',
    'UpdateGoalRequest',
    'GoalListResponse',
    'ActivityAttachmentRequest',
    'LogActivityRequest',
    
    # Repository
    'GoalsRepository',
    
    # Utilities
    'ProgressCalculator',
    'DateHelper',
    'GoalValidator',
    
    # Errors
    'GoalError',
    'GoalNotFoundError',
    'GoalValidationError',
    'GoalQuotaExceededError',
    'GoalPermissionError',
    'ActivityNotFoundError',
    'ActivityValidationError',
    'InvalidGoalPatternError',
    'GoalAlreadyCompletedError',
    'InvalidDateRangeError',
    'GoalArchivedException',
    'AttachmentUploadError',
    'GoalSyncError',
]
