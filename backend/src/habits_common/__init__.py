"""Common module for habit tracking functionality."""

from .errors import (
    ConflictError,
    ForbiddenError,
    HabitError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
)
from .models import (
    CreateHabitRequest,
    HabitAnalyticsResponse,
    HabitBase,
    HabitCategory,
    HabitCheckInRequest,
    HabitCheckInResponse,
    HabitListResponse,
    HabitPattern,
    HabitResponse,
    UpdateHabitRequest,
    UserStatsResponse,
)
from .repository import HabitRepository
from .service import HabitService

__all__ = [
    # Models
    "HabitBase",
    "CreateHabitRequest",
    "UpdateHabitRequest",
    "HabitCheckInRequest",
    "HabitResponse",
    "HabitCheckInResponse",
    "UserStatsResponse",
    "HabitListResponse",
    "HabitAnalyticsResponse",
    "HabitPattern",
    "HabitCategory",
    # Repository and Service
    "HabitRepository",
    "HabitService",
    # Errors
    "HabitError",
    "ValidationError",
    "NotFoundError",
    "ConflictError",
    "UnauthorizedError",
    "ForbiddenError",
]
