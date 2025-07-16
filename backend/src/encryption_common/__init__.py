"""
Common encryption models and utilities.
"""

from .models import (
    ShareType,
    SharePermission,
    RecoveryMethod,
    EncryptionKeys,
    Share,
    CreateShareRequest,
    AIShareRequest,
    RecoverySetupRequest,
    RecoveryAttemptRequest,
    EncryptionSetupRequest,
    PublicKeyResponse,
    ShareListResponse,
    AI_SERVICE_ACCOUNT
)
from .repository import EncryptionRepository

# Create a ShareRepository alias for easier use
class ShareRepository(EncryptionRepository):
    """Repository specifically for share operations."""
    pass

__all__ = [
    # Enums
    'ShareType',
    'SharePermission',
    'RecoveryMethod',
    
    # Models
    'EncryptionKeys',
    'Share',
    'CreateShareRequest',
    'AIShareRequest',
    'RecoverySetupRequest',
    'RecoveryAttemptRequest',
    'EncryptionSetupRequest',
    'PublicKeyResponse',
    'ShareListResponse',
    
    # Constants
    'AI_SERVICE_ACCOUNT',
    
    # Repository
    'EncryptionRepository',
    'ShareRepository'
]
