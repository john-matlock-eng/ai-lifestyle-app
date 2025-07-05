"""
Custom exceptions for email verification operations.
"""


class EmailVerificationError(Exception):
    """Base exception for email verification errors."""
    
    def __init__(self, message: str, error_code: str = "EMAIL_VERIFICATION_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class InvalidTokenError(EmailVerificationError):
    """Raised when verification token is invalid."""
    
    def __init__(self, message: str = "Invalid or expired verification token"):
        super().__init__(message, "INVALID_TOKEN")


class TokenExpiredError(EmailVerificationError):
    """Raised when verification token has expired."""
    
    def __init__(self, message: str = "Verification token has expired"):
        super().__init__(message, "TOKEN_EXPIRED")


class AlreadyVerifiedError(EmailVerificationError):
    """Raised when email is already verified."""
    
    def __init__(self, message: str = "Email address is already verified"):
        super().__init__(message, "ALREADY_VERIFIED")


class UserNotFoundError(EmailVerificationError):
    """Raised when user associated with token is not found."""
    
    def __init__(self, message: str = "User not found"):
        super().__init__(message, "USER_NOT_FOUND")


class CognitoError(EmailVerificationError):
    """Raised when Cognito operation fails."""
    
    def __init__(self, message: str = "Cognito operation failed"):
        super().__init__(message, "COGNITO_ERROR")


class DatabaseError(EmailVerificationError):
    """Raised when database operation fails."""
    
    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, "DATABASE_ERROR")
