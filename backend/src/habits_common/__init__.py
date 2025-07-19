"""Common module for habit tracking functionality."""
from .models import (
    HabitBase,
    CreateHabitRequest,
    UpdateHabitRequest,
    HabitCheckInRequest,
    HabitResponse,
    HabitCheckInResponse,
    UserStatsResponse,
    HabitListResponse,
    HabitAnalyticsResponse,
    HabitPattern,
    HabitCategory
)
from .repository import HabitRepository
from .service import HabitService
from .errors import (
    HabitError,
    ValidationError,
    NotFoundError,
    ConflictError,
    UnauthorizedError,
    ForbiddenError
)

__all__ = [
    # Models
    'HabitBase',
    'CreateHabitRequest',
    'UpdateHabitRequest',
    'HabitCheckInRequest',
    'HabitResponse',
    'HabitCheckInResponse',
    'UserStatsResponse',
    'HabitListResponse',
    'HabitAnalyticsResponse',
    'HabitPattern',
    'HabitCategory',
    # Repository and Service
    'HabitRepository',
    'HabitService',
    # Errors
    'HabitError',
    'ValidationError',
    'NotFoundError',
    'ConflictError',
    'UnauthorizedError',
    'ForbiddenError'
]
