"""
Pydantic models for user registration endpoint.
Matches the OpenAPI contract exactly.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    """Request model for user registration"""
    email: EmailStr = Field(..., description="User's email address", example="user@example.com")
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Strong password with at least 8 characters",
        example="SecureP@ss123"
    )
    firstName: str = Field(
        ...,
        min_length=1,
        max_length=50,
        pattern=r'^[a-zA-Z\s-]+$',
        description="User's first name",
        example="Jane"
    )
    lastName: str = Field(
        ...,
        min_length=1,
        max_length=50,
        pattern=r'^[a-zA-Z\s-]+$',
        description="User's last name",
        example="Doe"
    )

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Ensure password meets complexity requirements"""
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in v):
            raise ValueError("Password must contain at least one special character")
        return v


class RegisterResponse(BaseModel):
    """Response model for successful registration"""
    userId: UUID = Field(..., description="Newly created user ID")
    email: EmailStr = Field(..., description="Registered email address")
    message: str = Field(
        ...,
        description="Success message",
        example="Registration successful. Please check your email to verify your account."
    )


class ErrorResponse(BaseModel):
    """Standard error response model"""
    error: str = Field(..., description="Error type/code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[dict] = Field(None, description="Additional error details")
    request_id: Optional[str] = Field(None, description="Unique request identifier for debugging")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ValidationError(BaseModel):
    """Individual validation error"""
    field: str = Field(..., description="Field that failed validation")
    message: str = Field(..., description="Validation error message")


class ValidationErrorResponse(BaseModel):
    """Validation error response model"""
    error: str = Field(default="VALIDATION_ERROR")
    message: str = Field(default="Validation failed")
    validation_errors: list[ValidationError] = Field(..., description="List of validation errors")
    request_id: Optional[str] = Field(None, description="Unique request identifier")
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class CognitoUser(BaseModel):
    """Internal model for Cognito user data"""
    user_id: UUID
    email: EmailStr
    email_verified: bool = False
    enabled: bool = True
    status: str = "UNCONFIRMED"
    created_at: datetime
    updated_at: datetime


class DynamoDBUser(BaseModel):
    """Internal model for DynamoDB user record"""
    pk: str  # USER#{user_id}
    sk: str  # USER#{user_id}
    user_id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    email_verified: bool = False
    mfa_enabled: bool = False
    created_at: datetime
    updated_at: datetime
    entity_type: str = "USER"
    
    # GSI attributes
    gsi1_pk: Optional[str] = None  # EMAIL#{email}
    gsi1_sk: Optional[str] = None  # EMAIL#{email}
    
    def to_dict(self) -> dict:
        """Convert to DynamoDB item format"""
        data = self.model_dump(mode='json')
        # Convert datetime to ISO format strings
        data['created_at'] = self.created_at.isoformat()
        data['updated_at'] = self.updated_at.isoformat()
        # Convert UUID to string
        data['user_id'] = str(self.user_id)
        # Set GSI values
        data['gsi1_pk'] = f"EMAIL#{self.email}"
        data['gsi1_sk'] = f"EMAIL#{self.email}"
        return data
