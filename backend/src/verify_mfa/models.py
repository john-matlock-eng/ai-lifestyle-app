"""
Pydantic models for MFA verification during login.
Matches OpenAPI contract exactly.
"""

from typing import Optional
from pydantic import BaseModel, Field, field_validator


class VerifyMfaRequest(BaseModel):
    """Request model for MFA verification during login."""
    
    sessionToken: str = Field(
        ...,
        description="Session token from login response"
    )
    code: str = Field(
        ...,
        pattern=r'^[0-9]{6}$',
        description="6-digit TOTP code"
    )
    
    @field_validator('code')
    @classmethod
    def validate_code(cls, v: str) -> str:
        """Ensure code is exactly 6 digits."""
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Code must be exactly 6 digits")
        return v


class LoginResponse(BaseModel):
    """Response model for successful MFA verification (same as login)."""
    
    accessToken: str = Field(
        ...,
        description="JWT access token for API calls"
    )
    refreshToken: str = Field(
        ...,
        description="JWT refresh token for getting new access tokens"
    )
    tokenType: str = Field(
        default="Bearer",
        description="Token type for Authorization header"
    )
    expiresIn: int = Field(
        ...,
        description="Access token expiration time in seconds",
        example=3600
    )
    user: dict = Field(
        ...,
        description="User profile information"
    )


class ErrorResponse(BaseModel):
    """Standard error response model."""
    
    error: str = Field(..., description="Error type/code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[dict] = Field(None, description="Additional error details")
    request_id: Optional[str] = Field(None, description="Unique request identifier for debugging")
    timestamp: str = Field(..., description="ISO format timestamp")
