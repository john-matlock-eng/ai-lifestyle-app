"""
Custom error types for user service.
"""

from typing import Any, Dict, Optional


class UserError(Exception):
    """Base exception for user service errors."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        """
        Initialize user error.

        Args:
            message: Error message
            details: Additional error details
        """
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(UserError):
    """Raised when input validation fails."""

    pass


class UnauthorizedError(UserError):
    """Raised when authentication fails."""

    pass


class TokenExpiredError(UserError):
    """Raised when JWT token is expired."""

    pass


class InvalidTokenError(UserError):
    """Raised when JWT token is invalid."""

    pass


class UserNotFoundError(UserError):
    """Raised when requested user doesn't exist."""

    pass


class DatabaseError(UserError):
    """Raised when database operation fails."""

    pass
