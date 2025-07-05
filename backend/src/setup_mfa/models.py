"""
Pydantic models for MFA setup endpoint.
Matches OpenAPI contract exactly.
"""

from typing import Optional
from pydantic import BaseModel, Field


class MfaSetupResponse(BaseModel):
    """Response model for MFA setup."""
    
    secret: str = Field(
        ...,
        description="TOTP secret for manual entry"
    )
    qrCode: str = Field(
        ...,
        description="Base64 encoded QR code image"
    )


class ErrorResponse(BaseModel):
    """Standard error response model."""
    
    error: str = Field(..., description="Error type/code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[dict] = Field(None, description="Additional error details")
    request_id: Optional[str] = Field(None, description="Unique request identifier for debugging")
    timestamp: str = Field(..., description="ISO format timestamp")
