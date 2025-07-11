"""
Pydantic models for user login endpoint.
Matches OpenAPI contract specifications exactly.
"""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator
from uuid import UUID


class LoginRequest(BaseModel):
    """Login request matching OpenAPI schema"""
    email: EmailStr = Field(
        ...,
        description="User's email address",
        example="user@example.com"
    )
    password: str = Field(
        ...,
        description="User's password",
        min_length=1,  # Just ensure it's not empty
        max_length=128,
        repr=False  # Exclude from string representation
    )
    
    class Config:
        # Hide password in any JSON serialization for logging
        json_encoders = {
            str: lambda v: "<redacted>" if "password" in str(v).lower() else v
        }


class UserProfile(BaseModel):
    """User profile data returned in login response"""
    userId: str = Field(..., description="Unique user identifier")
    email: EmailStr = Field(..., description="User's email address")
    firstName: str = Field(..., description="User's first name")
    lastName: str = Field(..., description="User's last name")
    emailVerified: bool = Field(..., description="Whether email is verified")
    mfaEnabled: bool = Field(default=False, description="Whether 2FA is enabled")
    phoneNumber: Optional[str] = Field(None, description="User's phone number (E.164 format)")
    dateOfBirth: Optional[str] = Field(None, description="User's date of birth")
    timezone: Optional[str] = Field(None, description="User's timezone (IANA format)")
    preferences: Optional[Dict[str, Any]] = Field(None, description="User preferences")
    createdAt: datetime = Field(..., description="Account creation timestamp")
    updatedAt: datetime = Field(..., description="Last update timestamp")


class LoginResponse(BaseModel):
    """Successful login response when MFA is not required"""
    accessToken: str = Field(..., description="JWT access token for API calls")
    refreshToken: str = Field(..., description="JWT refresh token for getting new access tokens")
    tokenType: str = Field(default="Bearer", description="Token type for Authorization header")
    expiresIn: int = Field(..., description="Access token expiration time in seconds", example=3600)
    user: UserProfile = Field(..., description="Authenticated user's profile")


class MfaLoginResponse(BaseModel):
    """Login response when MFA is required"""
    sessionToken: str = Field(..., description="Temporary session token for MFA verification")
    mfaRequired: bool = Field(default=True, description="Indicates MFA is required")
    tokenType: str = Field(default="Bearer", description="Token type")


class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str = Field(..., description="Error type/code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    request_id: Optional[str] = Field(None, description="Unique request identifier for debugging")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ValidationErrorResponse(BaseModel):
    """Validation error response"""
    error: str = Field(default="VALIDATION_ERROR", description="Error type")
    message: str = Field(default="Validation failed", description="Error message")
    validation_errors: list[Dict[str, str]] = Field(..., description="List of validation errors")
    request_id: Optional[str] = Field(None, description="Request ID for debugging")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# Cognito-specific models
class CognitoAuthResponse(BaseModel):
    """Response from Cognito authentication"""
    accessToken: Optional[str] = None
    refreshToken: Optional[str] = None
    idToken: Optional[str] = None
    expiresIn: Optional[int] = None
    tokenType: Optional[str] = None
    session: Optional[str] = None  # For MFA
    challengeName: Optional[str] = None  # e.g., "SMS_MFA", "SOFTWARE_TOKEN_MFA"
