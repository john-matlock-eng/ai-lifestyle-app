"""
Custom exceptions for user registration.
"""


class RegistrationError(Exception):
    """Base exception for registration errors"""
    def __init__(self, message: str, error_code: str = "REGISTRATION_ERROR", details: dict = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class UserAlreadyExistsError(RegistrationError):
    """Raised when trying to register with an existing email"""
    def __init__(self, email: str):
        super().__init__(
            message=f"User with email {email} already exists",
            error_code="USER_ALREADY_EXISTS",
            details={"email": email}
        )


class CognitoError(RegistrationError):
    """Raised when Cognito operations fail"""
    def __init__(self, message: str, original_error: Exception = None):
        details = {"cognito_error": str(original_error)} if original_error else {}
        super().__init__(
            message=message,
            error_code="COGNITO_ERROR",
            details=details
        )


class DynamoDBError(RegistrationError):
    """Raised when DynamoDB operations fail"""
    def __init__(self, message: str, original_error: Exception = None):
        details = {"dynamodb_error": str(original_error)} if original_error else {}
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            details=details
        )


class ValidationError(RegistrationError):
    """Raised when input validation fails"""
    def __init__(self, validation_errors: list[dict]):
        super().__init__(
            message="Validation failed",
            error_code="VALIDATION_ERROR",
            details={"validation_errors": validation_errors}
        )
