"""
Pydantic models for MFA verification setup endpoint.
Matches OpenAPI contract exactly.
"""

from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class VerifyMfaSetupRequest(BaseModel):
    """Request model for MFA setup verification."""

    code: str = Field(..., pattern=r"^[0-9]{6}$", description="6-digit TOTP code")

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        """Ensure code is exactly 6 digits."""
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Code must be exactly 6 digits")
        return v


class MfaStatusResponse(BaseModel):
    """Response model for MFA status."""

    enabled: bool = Field(..., description="Whether MFA is enabled")
    backupCodes: Optional[List[str]] = Field(
        None, description="Backup codes (only returned on initial setup)"
    )


class ErrorResponse(BaseModel):
    """Standard error response model."""

    error: str = Field(..., description="Error type/code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[dict] = Field(None, description="Additional error details")
    request_id: Optional[str] = Field(None, description="Unique request identifier for debugging")
    timestamp: str = Field(..., description="ISO format timestamp")
