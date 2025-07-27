"""
Pydantic models for email verification endpoint.
Matches OpenAPI contract exactly.
"""

from typing import Optional
from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class EmailVerificationRequest(BaseModel):
    """Request model for email verification."""

    token: str = Field(
        ..., description="Verification token from email", min_length=1, max_length=500
    )

    @field_validator("token")
    @classmethod
    def validate_token(cls, v: str) -> str:
        """Ensure token is not empty or just whitespace."""
        if not v or not v.strip():
            raise ValueError("Token cannot be empty")
        return v.strip()


class MessageResponse(BaseModel):
    """Response model for operations that return a simple message."""

    message: str = Field(..., description="Success or informational message")


class ErrorResponse(BaseModel):
    """Standard error response model."""

    error: str = Field(..., description="Error type/code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[dict] = Field(None, description="Additional error details")
    request_id: Optional[str] = Field(None, description="Unique request identifier for debugging")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
