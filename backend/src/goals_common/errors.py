"""
Custom exceptions for the Enhanced Goal System.
"""

from typing import Any, Dict, Optional


class GoalError(Exception):
    """Base exception for all goal-related errors."""

    def __init__(
        self, message: str, error_code: str = "GOAL_ERROR", details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.details = details or {}


class GoalNotFoundError(GoalError):
    """Raised when a goal is not found."""

    def __init__(self, goal_id: str, user_id: Optional[str] = None):
        message = f"Goal {goal_id} not found"
        if user_id:
            message += f" for user {user_id}"
        super().__init__(
            message=message,
            error_code="GOAL_NOT_FOUND",
            details={"goal_id": goal_id, "user_id": user_id},
        )


class GoalValidationError(GoalError):
    """Raised when goal data fails validation."""

    def __init__(self, errors: list[str]):
        super().__init__(
            message="Goal validation failed",
            error_code="GOAL_VALIDATION_ERROR",
            details={"validation_errors": errors},
        )


class GoalQuotaExceededError(GoalError):
    """Raised when user exceeds their goal quota."""

    def __init__(self, current_count: int, max_allowed: int):
        super().__init__(
            message=f"Goal quota exceeded. Current: {current_count}, Max: {max_allowed}",
            error_code="GOAL_QUOTA_EXCEEDED",
            details={"current_count": current_count, "max_allowed": max_allowed},
        )


class GoalPermissionError(GoalError):
    """Raised when user doesn't have permission to access/modify a goal."""

    def __init__(self, action: str, goal_id: str):
        super().__init__(
            message=f"Permission denied for action '{action}' on goal {goal_id}",
            error_code="GOAL_PERMISSION_DENIED",
            details={"action": action, "goal_id": goal_id},
        )


class ActivityNotFoundError(GoalError):
    """Raised when an activity is not found."""

    def __init__(self, activity_id: str):
        super().__init__(
            message=f"Activity {activity_id} not found",
            error_code="ACTIVITY_NOT_FOUND",
            details={"activity_id": activity_id},
        )


class ActivityValidationError(GoalError):
    """Raised when activity data fails validation."""

    def __init__(self, errors: list[str]):
        super().__init__(
            message="Activity validation failed",
            error_code="ACTIVITY_VALIDATION_ERROR",
            details={"validation_errors": errors},
        )


class InvalidGoalPatternError(GoalError):
    """Raised when an operation is invalid for the goal pattern."""

    def __init__(self, pattern: str, operation: str):
        super().__init__(
            message=f"Operation '{operation}' is not valid for {pattern} goals",
            error_code="INVALID_GOAL_PATTERN_OPERATION",
            details={"pattern": pattern, "operation": operation},
        )


class GoalAlreadyCompletedError(GoalError):
    """Raised when trying to modify a completed goal."""

    def __init__(self, goal_id: str):
        super().__init__(
            message=f"Goal {goal_id} is already completed and cannot be modified",
            error_code="GOAL_ALREADY_COMPLETED",
            details={"goal_id": goal_id},
        )


class InvalidDateRangeError(GoalError):
    """Raised when date range is invalid."""

    def __init__(self, start_date: str, end_date: str):
        super().__init__(
            message=f"Invalid date range: {start_date} to {end_date}",
            error_code="INVALID_DATE_RANGE",
            details={"start_date": start_date, "end_date": end_date},
        )


class GoalArchivedException(GoalError):
    """Raised when trying to access an archived goal."""

    def __init__(self, goal_id: str):
        super().__init__(
            message=f"Goal {goal_id} is archived",
            error_code="GOAL_ARCHIVED",
            details={"goal_id": goal_id},
        )


class AttachmentUploadError(GoalError):
    """Raised when attachment upload fails."""

    def __init__(self, reason: str):
        super().__init__(
            message=f"Failed to upload attachment: {reason}",
            error_code="ATTACHMENT_UPLOAD_ERROR",
            details={"reason": reason},
        )


class GoalSyncError(GoalError):
    """Raised when goal synchronization fails."""

    def __init__(self, reason: str):
        super().__init__(
            message=f"Goal synchronization failed: {reason}",
            error_code="GOAL_SYNC_ERROR",
            details={"reason": reason},
        )
