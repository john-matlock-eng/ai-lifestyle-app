"""
Pydantic models for user profile endpoints.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, field_validator


class MeasurementUnit(str, Enum):
    """Measurement unit options."""

    METRIC = "metric"
    IMPERIAL = "imperial"


class DietaryRestriction(str, Enum):
    """Dietary restriction options."""

    VEGAN = "vegan"
    VEGETARIAN = "vegetarian"
    GLUTEN_FREE = "gluten-free"
    DAIRY_FREE = "dairy-free"
    NUT_FREE = "nut-free"
    HALAL = "halal"
    KOSHER = "kosher"


class FitnessGoal(str, Enum):
    """Fitness goal options."""

    WEIGHT_LOSS = "weight-loss"
    MUSCLE_GAIN = "muscle-gain"
    ENDURANCE = "endurance"
    FLEXIBILITY = "flexibility"
    GENERAL_HEALTH = "general-health"


class NotificationPreferences(BaseModel):
    """User notification preferences."""

    email: bool = Field(default=True, description="Email notifications enabled")
    push: bool = Field(default=True, description="Push notifications enabled")
    sms: bool = Field(default=False, description="SMS notifications enabled")


class UserPreferences(BaseModel):
    """User preferences model."""

    units: MeasurementUnit = Field(
        default=MeasurementUnit.METRIC, description="Measurement unit preference"
    )
    language: str = Field(
        default="en-US",
        description="Language preference (ISO 639-1)",
        pattern=r"^[a-z]{2}(-[A-Z]{2})?$",
    )
    notifications: NotificationPreferences = Field(
        default_factory=NotificationPreferences, description="Notification preferences"
    )
    dietaryRestrictions: List[DietaryRestriction] = Field(
        default_factory=list, description="List of dietary restrictions"
    )
    fitnessGoals: List[FitnessGoal] = Field(
        default_factory=list, description="List of fitness goals"
    )


class UserProfileResponse(BaseModel):
    """User profile response model."""

    userId: str = Field(
        ...,
        description="Unique user identifier",
        pattern=r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    )
    email: str = Field(..., description="User's email address")
    firstName: str = Field(..., description="User's first name")
    lastName: str = Field(..., description="User's last name")
    emailVerified: bool = Field(..., description="Whether email is verified")
    mfaEnabled: bool = Field(default=False, description="Whether 2FA is enabled")
    phoneNumber: Optional[str] = Field(
        default=None,
        description="User's phone number (E.164 format)",
        pattern=r"^\+?[1-9]\d{1,14}$",
    )
    dateOfBirth: Optional[str] = Field(default=None, description="User's date of birth")
    timezone: Optional[str] = Field(
        default=None, description="User's timezone (IANA format)", example="America/New_York"
    )
    preferences: Optional[UserPreferences] = Field(default=None, description="User preferences")
    encryptionEnabled: bool = Field(
        default=False, description="Whether encryption is enabled for this user"
    )
    encryptionSetupDate: Optional[datetime] = Field(
        default=None, description="When encryption was first set up"
    )
    encryptionKeyId: Optional[str] = Field(
        default=None, description="Public key ID for user's encryption key"
    )
    createdAt: datetime = Field(..., description="Account creation timestamp")
    updatedAt: datetime = Field(..., description="Last update timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "firstName": "Jane",
                "lastName": "Doe",
                "emailVerified": True,
                "mfaEnabled": False,
                "phoneNumber": "+1234567890",
                "dateOfBirth": "1990-01-01",
                "timezone": "America/New_York",
                "preferences": {
                    "units": "metric",
                    "language": "en-US",
                    "notifications": {"email": True, "push": True, "sms": False},
                    "dietaryRestrictions": ["vegetarian", "gluten-free"],
                    "fitnessGoals": ["weight-loss", "endurance"],
                },
                "createdAt": "2025-01-01T10:00:00Z",
                "updatedAt": "2025-01-01T12:00:00Z",
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
                "error": "UNAUTHORIZED",
                "message": "Invalid or missing authentication token",
                "request_id": "req_123456",
                "timestamp": "2025-01-01T10:00:00Z",
            }
        }


# Internal models for data transformation
class DynamoDBUser(BaseModel):
    """Internal model for DynamoDB user data."""

    pk: str
    sk: str
    user_id: str
    email: str
    first_name: str
    last_name: str
    email_verified: bool = False
    mfa_enabled: bool = False
    phone_number: Optional[str] = None
    date_of_birth: Optional[str] = None
    timezone: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    encryption_enabled: bool = False
    encryption_setup_date: Optional[str] = None
    encryption_key_id: Optional[str] = None
    created_at: str
    updated_at: str

    def to_user_profile(self) -> "UserProfile":
        """Convert DynamoDB data to API response model."""
        # Parse preferences if they exist
        prefs = None
        if self.preferences:
            prefs = UserPreferences(**self.preferences)

        # Parse encryption setup date if it exists
        enc_setup_date = None
        if self.encryption_setup_date:
            enc_setup_date = datetime.fromisoformat(
                self.encryption_setup_date.replace("Z", "+00:00")
            )

        return UserProfile(
            userId=self.user_id,
            email=self.email,
            firstName=self.first_name,
            lastName=self.last_name,
            emailVerified=self.email_verified,
            mfaEnabled=self.mfa_enabled,
            phoneNumber=self.phone_number,
            dateOfBirth=self.date_of_birth,
            timezone=self.timezone,
            preferences=prefs,
            encryptionEnabled=self.encryption_enabled,
            encryptionSetupDate=enc_setup_date,
            encryptionKeyId=self.encryption_key_id,
            createdAt=datetime.fromisoformat(self.created_at.replace("Z", "+00:00")),
            updatedAt=datetime.fromisoformat(self.updated_at.replace("Z", "+00:00")),
        )


class UpdateUserProfileRequest(BaseModel):
    """Request model for updating user profile."""

    firstName: Optional[str] = Field(default=None, description="User's first name")
    lastName: Optional[str] = Field(default=None, description="User's last name")
    phoneNumber: Optional[str] = Field(
        default=None,
        description="User's phone number (E.164 format)",
        pattern=r"^\+?[1-9]\d{1,14}$",
    )
    dateOfBirth: Optional[str] = Field(default=None, description="User's date of birth")
    timezone: Optional[str] = Field(
        default=None, description="User's timezone (IANA format)", example="America/New_York"
    )
    preferences: Optional[UserPreferences] = Field(default=None, description="User preferences")
    encryptionEnabled: Optional[bool] = Field(
        default=None, description="Whether encryption is enabled for this user"
    )
    encryptionSetupDate: Optional[datetime] = Field(
        default=None, description="When encryption was first set up"
    )
    encryptionKeyId: Optional[str] = Field(
        default=None, description="Public key ID for user's encryption key"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "firstName": "Jane",
                "lastName": "Doe",
                "phoneNumber": "+1234567890",
                "timezone": "America/New_York",
                "encryptionEnabled": True,
                "encryptionKeyId": "abc123def456",
            }
        }


class UserProfile(BaseModel):
    """User profile response model."""

    userId: str = Field(
        ...,
        description="Unique user identifier",
        pattern=r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    )
    email: str = Field(..., description="User's email address")
    firstName: str = Field(..., description="User's first name")
    lastName: str = Field(..., description="User's last name")
    emailVerified: bool = Field(..., description="Whether email is verified")
    mfaEnabled: bool = Field(default=False, description="Whether 2FA is enabled")
    phoneNumber: Optional[str] = Field(
        default=None,
        description="User's phone number (E.164 format)",
        pattern=r"^\+?[1-9]\d{1,14}$",
    )
    dateOfBirth: Optional[str] = Field(default=None, description="User's date of birth")
    timezone: Optional[str] = Field(
        default=None, description="User's timezone (IANA format)", example="America/New_York"
    )
    preferences: Optional[UserPreferences] = Field(default=None, description="User preferences")
    encryptionEnabled: bool = Field(
        default=False, description="Whether encryption is enabled for this user"
    )
    encryptionSetupDate: Optional[datetime] = Field(
        default=None, description="When encryption was first set up"
    )
    encryptionKeyId: Optional[str] = Field(
        default=None, description="Public key ID for user's encryption key"
    )
    createdAt: datetime = Field(..., description="Account creation timestamp")
    updatedAt: datetime = Field(..., description="Last update timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "userId": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "firstName": "Jane",
                "lastName": "Doe",
                "emailVerified": True,
                "mfaEnabled": False,
                "phoneNumber": "+1234567890",
                "dateOfBirth": "1990-01-01",
                "timezone": "America/New_York",
                "preferences": {
                    "units": "metric",
                    "language": "en-US",
                    "notifications": {"email": True, "push": True, "sms": False},
                    "dietaryRestrictions": ["vegetarian", "gluten-free"],
                    "fitnessGoals": ["weight-loss", "endurance"],
                },
                "createdAt": "2025-01-01T10:00:00Z",
                "updatedAt": "2025-01-01T12:00:00Z",
            }
        }
