"""
Custom exceptions for MFA verification during login.
"""


class MFALoginError(Exception):
    """Base exception for MFA login errors."""

    def __init__(self, message: str, error_code: str = "MFA_LOGIN_ERROR", details: dict = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(message)


class InvalidSessionError(MFALoginError):
    """Raised when session token is invalid or expired."""

    def __init__(self, message: str = "Invalid or expired session token"):
        super().__init__(message, "INVALID_SESSION")


class InvalidMFACodeError(MFALoginError):
    """Raised when MFA code is invalid."""

    def __init__(self, message: str = "Invalid MFA code"):
        super().__init__(message, "INVALID_MFA_CODE")


class MFARequiredError(MFALoginError):
    """Raised when MFA is required but not provided."""

    def __init__(self, message: str = "MFA verification required"):
        super().__init__(message, "MFA_REQUIRED")


class TooManyAttemptsError(MFALoginError):
    """Raised when too many failed MFA attempts."""

    def __init__(self, message: str = "Too many failed MFA attempts"):
        super().__init__(message, "TOO_MANY_ATTEMPTS")


class CognitoError(MFALoginError):
    """Raised when Cognito operation fails."""

    def __init__(self, message: str = "Authentication service error"):
        super().__init__(message, "COGNITO_ERROR")


class DatabaseError(MFALoginError):
    """Raised when database operation fails."""

    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, "DATABASE_ERROR")
