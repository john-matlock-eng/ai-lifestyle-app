"""
Custom exceptions for update user profile service.
"""

from typing import Any, Dict, Optional


class ProfileError(Exception):
    """Base exception for profile errors."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class UnauthorizedError(ProfileError):
    """Raised when authentication fails."""

    def __init__(
        self,
        message: str = "Invalid or missing authentication token",
        details: Optional[Dict[str, Any]] = None,
    ):
        super().__init__(message, details)


class TokenExpiredError(ProfileError):
    """Raised when the access token has expired."""

    def __init__(
        self, message: str = "Access token has expired", details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, details)


class InvalidTokenError(ProfileError):
    """Raised when the access token is invalid."""

    def __init__(
        self, message: str = "Invalid access token", details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, details)


class UserNotFoundError(ProfileError):
    """Raised when user is not found in the database."""

    def __init__(self, message: str = "User not found", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, details)


class DatabaseError(ProfileError):
    """Raised when database operations fail."""

    def __init__(
        self, message: str = "Database operation failed", details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, details)


class CognitoError(ProfileError):
    """Raised when Cognito operations fail."""

    def __init__(
        self, message: str = "Cognito service error", details: Optional[Dict[str, Any]] = None
    ):
        super().__init__(message, details)
