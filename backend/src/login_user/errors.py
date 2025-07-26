"""
Custom exceptions for login operations.
"""

from typing import Any, Dict, Optional


class LoginError(Exception):
    """Base exception for login operations"""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class InvalidCredentialsError(LoginError):
    """Raised when login credentials are invalid"""

    def __init__(self, message: str = "Invalid email or password"):
        super().__init__(message, {"error_code": "INVALID_CREDENTIALS"})


class UserNotFoundError(LoginError):
    """Raised when user doesn't exist"""

    def __init__(self, email: str):
        super().__init__("User not found", {"error_code": "USER_NOT_FOUND", "email": email})


class AccountNotVerifiedError(LoginError):
    """Raised when user account is not verified"""

    def __init__(self, email: str):
        super().__init__(
            "Account not verified. Please check your email for verification link.",
            {"error_code": "ACCOUNT_NOT_VERIFIED", "email": email},
        )


class AccountLockedError(LoginError):
    """Raised when account is locked due to too many failed attempts"""

    def __init__(self, email: str, locked_until: Optional[str] = None):
        details = {"error_code": "ACCOUNT_LOCKED", "email": email}
        if locked_until:
            details["locked_until"] = locked_until
        super().__init__(
            "Account temporarily locked due to too many failed login attempts", details
        )


class RateLimitExceededError(LoginError):
    """Raised when rate limit is exceeded"""

    def __init__(self, retry_after: Optional[int] = None):
        details = {"error_code": "RATE_LIMIT_EXCEEDED"}
        if retry_after:
            details["retry_after_seconds"] = retry_after
        super().__init__("Too many login attempts. Please try again later.", details)


class MfaRequiredError(LoginError):
    """Raised when MFA is required to complete login"""

    def __init__(self, session_token: str, challenge_name: str):
        super().__init__(
            "Multi-factor authentication required",
            {
                "error_code": "MFA_REQUIRED",
                "session_token": session_token,
                "challenge_name": challenge_name,
            },
        )


class CognitoError(LoginError):
    """Raised when Cognito returns an error"""

    def __init__(
        self, message: str, cognito_error_code: str, details: Optional[Dict[str, Any]] = None
    ):
        error_details = {"error_code": "COGNITO_ERROR", "cognito_error_code": cognito_error_code}
        if details:
            error_details.update(details)
        super().__init__(message, error_details)
