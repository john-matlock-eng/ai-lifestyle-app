"""
Email verification module for AI Lifestyle App.
"""

from .handler import lambda_handler
from .models import EmailVerificationRequest, ErrorResponse, MessageResponse
from .service import EmailVerificationService

__all__ = [
    "lambda_handler",
    "EmailVerificationRequest",
    "MessageResponse",
    "ErrorResponse",
    "EmailVerificationService",
]
