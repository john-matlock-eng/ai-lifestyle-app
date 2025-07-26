"""
Custom exceptions for MFA setup operations.
"""


class MFAError(Exception):
    """Base exception for MFA errors."""

    def __init__(self, message: str, error_code: str = "MFA_ERROR", details: dict = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(message)


class MFAAlreadyEnabledError(MFAError):
    """Raised when MFA is already enabled for user."""

    def __init__(self, message: str = "MFA is already enabled for this account"):
        super().__init__(message, "MFA_ALREADY_ENABLED")


class SecretGenerationError(MFAError):
    """Raised when TOTP secret generation fails."""

    def __init__(self, message: str = "Failed to generate TOTP secret"):
        super().__init__(message, "SECRET_GENERATION_ERROR")


class QRCodeGenerationError(MFAError):
    """Raised when QR code generation fails."""

    def __init__(self, message: str = "Failed to generate QR code"):
        super().__init__(message, "QR_CODE_ERROR")


class DatabaseError(MFAError):
    """Raised when database operation fails."""

    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, "DATABASE_ERROR")


class EncryptionError(MFAError):
    """Raised when encryption/decryption fails."""

    def __init__(self, message: str = "Encryption operation failed"):
        super().__init__(message, "ENCRYPTION_ERROR")
