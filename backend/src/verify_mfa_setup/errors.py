"""
Custom exceptions for MFA setup verification operations.
"""


class MFAVerificationError(Exception):
    """Base exception for MFA verification errors."""
    
    def __init__(self, message: str, error_code: str = "MFA_VERIFICATION_ERROR", details: dict = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(message)


class InvalidCodeError(MFAVerificationError):
    """Raised when TOTP code is invalid."""
    
    def __init__(self, message: str = "Invalid verification code"):
        super().__init__(message, "INVALID_CODE")


class MFANotInitializedError(MFAVerificationError):
    """Raised when MFA setup hasn't been initiated."""
    
    def __init__(self, message: str = "MFA setup not initiated. Please start setup first"):
        super().__init__(message, "MFA_NOT_INITIALIZED")


class MFAAlreadyVerifiedError(MFAVerificationError):
    """Raised when MFA is already verified and enabled."""
    
    def __init__(self, message: str = "MFA is already verified and enabled"):
        super().__init__(message, "MFA_ALREADY_VERIFIED")


class DatabaseError(MFAVerificationError):
    """Raised when database operation fails."""
    
    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, "DATABASE_ERROR")


class CognitoError(MFAVerificationError):
    """Raised when Cognito operation fails."""
    
    def __init__(self, message: str = "Cognito operation failed"):
        super().__init__(message, "COGNITO_ERROR")
