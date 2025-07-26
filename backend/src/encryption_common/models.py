"""
Core models for the Encryption System.

These models support zero-knowledge encryption with key management,
sharing capabilities, and recovery mechanisms.
"""

from datetime import datetime, timedelta
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from pydantic.alias_generators import to_camel


class ShareType(str, Enum):
    """Types of shares that can be created."""

    USER = "user"
    AI = "ai"
    SERVICE = "service"


class SharePermission(str, Enum):
    """Permissions that can be granted on shares."""

    READ = "read"
    COMMENT = "comment"
    RESHARE = "reshare"


class RecoveryMethod(str, Enum):
    """Available recovery methods."""

    MNEMONIC = "mnemonic"  # BIP39 24-word phrase
    SOCIAL = "social"  # M-of-N social recovery
    SECURITY_QUESTIONS = "questions"  # Security questions


class EncryptionKeys(BaseModel):
    """User's encryption keys stored on server."""

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    user_id: str = Field(..., description="User ID")
    salt: str = Field(..., description="PBKDF2 salt (base64)")
    encrypted_private_key: str = Field(..., description="Encrypted private key (base64)")
    public_key: str = Field(..., description="Public key (base64)")
    public_key_id: str = Field(..., description="Unique public key identifier")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Recovery
    recovery_enabled: bool = Field(False, description="Whether recovery is set up")
    recovery_methods: List[RecoveryMethod] = Field(default_factory=list)
    recovery_data: Optional[Dict[str, Any]] = Field(None, description="Encrypted recovery data")


class Share(BaseModel):
    """Represents a shared encrypted item."""

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    share_id: str = Field(..., description="Unique share identifier")
    owner_id: str = Field(..., description="User who created the share")
    recipient_id: str = Field(..., description="User/service receiving the share")

    # Share details
    item_type: str = Field(..., description="Type of shared item (journal, goal, etc)")
    item_id: str = Field(..., description="ID of the shared item")
    encrypted_key: str = Field(..., description="Content key encrypted for recipient")

    # Share configuration
    share_type: ShareType = Field(..., description="Type of share")
    permissions: List[SharePermission] = Field(default_factory=lambda: [SharePermission.READ])

    # Time limits
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = Field(None, description="When share expires")
    accessed_at: Optional[datetime] = Field(None, description="Last access time")
    access_count: int = Field(0, description="Number of times accessed")
    max_accesses: Optional[int] = Field(None, description="Maximum allowed accesses")

    # Status
    is_active: bool = Field(True, description="Whether share is active")
    revoked_at: Optional[datetime] = Field(None, description="When share was revoked")

    @model_validator(mode="after")
    def validate_ai_share_limits(self):
        """Ensure AI shares have proper time and access limits."""
        if self.share_type == ShareType.AI:
            # AI shares must have time limit (default 30 minutes)
            if not self.expires_at:
                self.expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

            # AI shares should be single-use by default
            if self.max_accesses is None:
                self.max_accesses = 1

        return self


class CreateShareRequest(BaseModel):
    """Request to create a new share."""

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    item_type: str = Field(..., description="Type of item to share")
    item_id: str = Field(..., description="ID of item to share")
    recipient_id: str = Field(..., description="User/service to share with")
    encrypted_key: str = Field(..., description="Content key encrypted for recipient")

    share_type: ShareType = Field(ShareType.USER, description="Type of share")
    permissions: Optional[List[SharePermission]] = None

    # Time limits
    expires_in_hours: Optional[int] = Field(
        None, ge=1, le=720, description="Hours until expiration"
    )
    max_accesses: Optional[int] = Field(None, ge=1, description="Maximum allowed accesses")


class AIShareRequest(BaseModel):
    """Request to create an AI analysis share."""

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    item_type: str = Field(..., description="Type of item to share")
    item_ids: List[str] = Field(..., description="IDs of items to analyze")
    analysis_type: str = Field(..., description="Type of AI analysis requested")

    # Optional parameters
    context: Optional[str] = Field(None, description="Additional context for AI")
    expires_in_minutes: int = Field(30, ge=5, le=60, description="Minutes until expiration")


class RecoverySetupRequest(BaseModel):
    """Request to set up account recovery."""

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    method: RecoveryMethod = Field(..., description="Recovery method to set up")

    # Method-specific data
    mnemonic_phrase: Optional[str] = Field(None, description="24-word recovery phrase")
    social_guardians: Optional[List[str]] = Field(None, description="Guardian user IDs")
    social_threshold: Optional[int] = Field(
        None, ge=1, description="Required guardians for recovery"
    )
    security_questions: Optional[List[Dict[str, str]]] = Field(None, description="Q&A pairs")

    # Encrypted recovery key
    encrypted_recovery_key: str = Field(
        ..., description="Master key encrypted with recovery method"
    )

    @model_validator(mode="after")
    def validate_method_data(self):
        """Ensure required data is provided for each method."""
        if self.method == RecoveryMethod.MNEMONIC:
            if not self.mnemonic_phrase:
                raise ValueError("Mnemonic phrase required for mnemonic recovery")

        elif self.method == RecoveryMethod.SOCIAL:
            if not self.social_guardians or not self.social_threshold:
                raise ValueError("Guardians and threshold required for social recovery")
            if self.social_threshold > len(self.social_guardians):
                raise ValueError("Threshold cannot exceed number of guardians")

        elif self.method == RecoveryMethod.SECURITY_QUESTIONS:
            if not self.security_questions or len(self.security_questions) < 3:
                raise ValueError("At least 3 security questions required")

        return self


class RecoveryAttemptRequest(BaseModel):
    """Request to recover account access."""

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    user_id: str = Field(..., description="User ID to recover")
    method: RecoveryMethod = Field(..., description="Recovery method to use")

    # Method-specific recovery data
    mnemonic_phrase: Optional[str] = Field(None, description="24-word recovery phrase")
    guardian_signatures: Optional[Dict[str, str]] = Field(None, description="Guardian signatures")
    security_answers: Optional[List[str]] = Field(None, description="Answers to security questions")

    # New password
    new_password: str = Field(..., description="New password to set")


class EncryptionSetupRequest(BaseModel):
    """Request to set up encryption for a user."""

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    salt: str = Field(..., description="PBKDF2 salt (base64)")
    encrypted_private_key: str = Field(..., description="Private key encrypted with master key")
    public_key: str = Field(..., description="User's public key (base64)")
    public_key_id: str = Field(..., description="Unique public key identifier")


class PublicKeyResponse(BaseModel):
    """Response containing a user's public key."""

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    user_id: str
    public_key: str
    public_key_id: str
    has_encryption: bool = True


class ShareListResponse(BaseModel):
    """Response containing list of shares."""

    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    shares: List[Share]
    total: int
    has_more: bool = False
    next_token: Optional[str] = None


# Service account for AI
AI_SERVICE_ACCOUNT = {
    "user_id": "service:ai-analyzer",
    "name": "AI Analysis Service",
    "public_key_id": "ai-service-key-001",
}
