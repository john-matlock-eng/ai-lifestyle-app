"""
Custom exceptions for token refresh service.
"""

from typing import Optional, Dict, Any


class RefreshError(Exception):
    """Base exception for token refresh errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class InvalidTokenError(RefreshError):
    """Raised when the refresh token is invalid."""
    
    def __init__(self, message: str = "Invalid refresh token", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, details)


class ExpiredTokenError(RefreshError):
    """Raised when the refresh token has expired."""
    
    def __init__(self, message: str = "Refresh token has expired", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, details)


class RevokedTokenError(RefreshError):
    """Raised when the refresh token has been revoked."""
    
    def __init__(self, message: str = "Refresh token has been revoked", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, details)


class CognitoError(RefreshError):
    """Raised when Cognito returns an error."""
    
    def __init__(self, message: str = "Cognito service error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, details)


class ConfigurationError(RefreshError):
    """Raised when there's a configuration issue."""
    
    def __init__(self, message: str = "Service configuration error", details: Optional[Dict[str, Any]] = None):
        super().__init__(message, details)
