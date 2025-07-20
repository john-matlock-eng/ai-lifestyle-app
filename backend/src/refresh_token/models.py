"""
Pydantic models for token refresh endpoint.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator
from pydantic.types import SecretStr


class RefreshTokenRequest(BaseModel):
    """Request model for token refresh."""

    refreshToken: str = Field(..., description="Valid refresh token", min_length=1)

    class Config:
        json_schema_extra = {"example": {"refreshToken": "eyJhbGciOiJIUzI1NiIsInR..."}}


class RefreshTokenResponse(BaseModel):
    """Response model for successful token refresh."""

    accessToken: str = Field(..., description="New JWT access token")
    tokenType: str = Field(default="Bearer", description="Token type for Authorization header")
    expiresIn: int = Field(..., description="Access token expiration time in seconds", example=3600)

    class Config:
        json_schema_extra = {
            "example": {
                "accessToken": "eyJhbGciOiJIUzI1NiIsInR...",
                "tokenType": "Bearer",
                "expiresIn": 3600,
            }
        }


class ErrorResponse(BaseModel):
    """Standard error response."""

    error: str = Field(..., description="Error type/code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Additional error details")
    request_id: Optional[str] = Field(
        default=None, description="Unique request identifier for debugging"
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "error": "INVALID_TOKEN",
                "message": "The provided refresh token is invalid",
                "request_id": "req_123456",
                "timestamp": "2025-01-02T10:00:00Z",
            }
        }


class ValidationErrorResponse(BaseModel):
    """Validation error response."""

    error: str = Field(default="VALIDATION_ERROR", description="Error type")
    message: str = Field(default="Validation failed", description="Error message")
    validation_errors: List[Dict[str, str]] = Field(..., description="List of validation errors")
    request_id: Optional[str] = Field(default=None, description="Request ID for debugging")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "error": "VALIDATION_ERROR",
                "message": "Validation failed",
                "validation_errors": [{"field": "refreshToken", "message": "Field required"}],
                "request_id": "req_123456",
                "timestamp": "2025-01-02T10:00:00Z",
            }
        }


# Internal models for Cognito responses
class CognitoTokenResponse(BaseModel):
    """Internal model for Cognito token response."""

    AccessToken: str
    IdToken: Optional[str] = None
    TokenType: str = "Bearer"
    ExpiresIn: int = 3600

    def to_refresh_response(self) -> RefreshTokenResponse:
        """Convert Cognito response to API response model."""
        return RefreshTokenResponse(
            accessToken=self.AccessToken, tokenType=self.TokenType, expiresIn=self.ExpiresIn
        )
