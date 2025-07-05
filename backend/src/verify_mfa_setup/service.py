"""
Service layer for MFA setup verification business logic.
"""

import pyotp
from typing import List
from aws_lambda_powertools import Logger

from .repository import MFAVerificationRepository
from .cognito_client import CognitoMFAClient
from .models import MfaStatusResponse
from .errors import (
    InvalidCodeError,
    MFANotInitializedError,
    MFAAlreadyVerifiedError,
    MFAVerificationError
)

# Import encryption utilities from setup_mfa module
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from setup_mfa.encryption import MFASecretEncryption

logger = Logger()


class MFAVerificationService:
    """Handles MFA setup verification business logic."""
    
    def __init__(self):
        self.repository = MFAVerificationRepository()
        self.cognito_client = CognitoMFAClient()
        self.encryption = MFASecretEncryption()
    
    def verify_mfa_setup(self, user_id: str, code: str) -> MfaStatusResponse:
        """
        Verify MFA setup with TOTP code.
        
        Args:
            user_id: User's unique identifier
            code: 6-digit TOTP code
            
        Returns:
            MFA status response with backup codes on first verification
            
        Raises:
            InvalidCodeError: If code is invalid
            MFANotInitializedError: If MFA setup not started
            MFAAlreadyVerifiedError: If already verified
            MFAVerificationError: For other errors
        """
        try:
            # Check if MFA is already verified
            if self.repository.check_mfa_verified(user_id):
                logger.warning(f"MFA already verified for user {user_id}")
                raise MFAAlreadyVerifiedError()
            
            # Get MFA secret from database
            mfa_data = self.repository.get_mfa_secret(user_id)
            if not mfa_data:
                logger.error(f"No MFA setup found for user {user_id}")
                raise MFANotInitializedError()
            
            # Decrypt the secret
            encrypted_secret = mfa_data.get('encrypted_secret')
            iv = mfa_data.get('iv')
            
            if not encrypted_secret or not iv:
                logger.error("Missing encryption data in MFA record")
                raise MFAVerificationError("Invalid MFA data")
            
            secret = self.encryption.decrypt_secret(encrypted_secret, iv)
            
            # Verify the TOTP code
            if not self._verify_totp_code(secret, code):
                logger.warning(f"Invalid TOTP code for user {user_id}")
                raise InvalidCodeError()
            
            # Mark MFA as verified and get backup codes
            backup_codes = self.repository.mark_mfa_as_verified(user_id)
            
            # Enable MFA in Cognito
            self.cognito_client.enable_mfa_preference(user_id)
            
            # Update user's MFA status
            self.repository.update_user_mfa_status(user_id, True)
            
            logger.info(f"MFA successfully verified and enabled for user {user_id}")
            
            # Return response with backup codes (only on initial verification)
            return MfaStatusResponse(
                enabled=True,
                backupCodes=backup_codes
            )
            
        except (InvalidCodeError, MFANotInitializedError, MFAAlreadyVerifiedError):
            raise
        except Exception as e:
            logger.error(f"Failed to verify MFA setup: {str(e)}")
            raise MFAVerificationError(f"Failed to verify MFA: {str(e)}")
    
    def _verify_totp_code(self, secret: str, code: str) -> bool:
        """
        Verify TOTP code against secret.
        
        Args:
            secret: TOTP secret
            code: 6-digit code to verify
            
        Returns:
            True if valid, False otherwise
        """
        try:
            # Create TOTP instance
            totp = pyotp.TOTP(secret)
            
            # Verify with a window of 1 (allows for 30 seconds before/after)
            is_valid = totp.verify(code, valid_window=1)
            
            logger.info(f"TOTP code verification result: {is_valid}")
            return is_valid
            
        except Exception as e:
            logger.error(f"Error verifying TOTP code: {str(e)}")
            return False
