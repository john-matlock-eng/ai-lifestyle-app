"""Common errors for habit tracking."""



class HabitError(Exception):
    """Base exception for habit-related errors."""

    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class ValidationError(HabitError):
    """Raised when validation fails."""

    def __init__(self, message: str):
        super().__init__(message, 400)


class NotFoundError(HabitError):
    """Raised when a resource is not found."""

    def __init__(self, message: str):
        super().__init__(message, 404)


class ConflictError(HabitError):
    """Raised when there's a conflict (e.g., duplicate check-in)."""

    def __init__(self, message: str):
        super().__init__(message, 409)


class UnauthorizedError(HabitError):
    """Raised when user is not authorized."""

    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, 401)


class ForbiddenError(HabitError):
    """Raised when user is forbidden from accessing a resource."""

    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, 403)


# Specific habit errors for clarity
class HabitNotFoundError(NotFoundError):
    """Raised when a habit is not found."""

    pass


class HabitConflictError(ConflictError):
    """Raised when there's a conflict with habit operations."""

    pass
