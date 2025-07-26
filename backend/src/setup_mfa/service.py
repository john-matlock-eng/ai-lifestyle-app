"""
Service layer for MFA setup business logic.
"""

import base64
import io
from typing import Tuple

import pyotp
import qrcode
from aws_lambda_powertools import Logger

from .encryption import MFASecretEncryption, generate_backup_codes
from .errors import MFAAlreadyEnabledError, MFAError, QRCodeGenerationError, SecretGenerationError
from .models import MfaSetupResponse
from .repository import MFARepository

logger = Logger()


class MFASetupService:
    """Handles MFA setup business logic."""

    def __init__(self):
        self.repository = MFARepository()
        self.encryption = MFASecretEncryption()

    def setup_mfa(self, user_id: str, user_email: str) -> MfaSetupResponse:
        """
        Set up MFA for a user.

        Args:
            user_id: User's unique identifier
            user_email: User's email address

        Returns:
            MFA setup response with secret and QR code

        Raises:
            MFAAlreadyEnabledError: If MFA is already enabled
            MFAError: For other MFA setup errors
        """
        try:
            # Check if MFA is already set up
            existing_mfa = self.repository.get_mfa_secret(user_id)
            if existing_mfa:
                logger.warning(f"MFA already enabled for user {user_id}")
                raise MFAAlreadyEnabledError()

            # Generate TOTP secret
            secret = self._generate_totp_secret()

            # Generate QR code
            qr_code_base64 = self._generate_qr_code(secret, user_email)

            # Generate backup codes
            backup_codes = generate_backup_codes(8)

            # Encrypt and store secret
            encrypted_secret, iv = self.encryption.encrypt_secret(secret)
            self.repository.store_mfa_secret(
                user_id=user_id, encrypted_secret=encrypted_secret, iv=iv, backup_codes=backup_codes
            )

            logger.info(f"MFA setup initiated for user {user_id}")

            # Return response with secret for manual entry and QR code
            # Note: We don't return backup codes here - they should be shown
            # only after successful verification in the verify-setup endpoint
            return MfaSetupResponse(secret=secret, qrCode=qr_code_base64)

        except MFAAlreadyEnabledError:
            raise
        except Exception as e:
            logger.error(f"Failed to setup MFA: {str(e)}")
            raise MFAError(f"Failed to setup MFA: {str(e)}")

    def _generate_totp_secret(self) -> str:
        """
        Generate a TOTP secret.

        Returns:
            Base32 encoded secret

        Raises:
            SecretGenerationError: If generation fails
        """
        try:
            # Generate random base32 secret
            secret = pyotp.random_base32()
            logger.info("Generated TOTP secret")
            return secret
        except Exception as e:
            logger.error(f"Failed to generate TOTP secret: {str(e)}")
            raise SecretGenerationError(f"Failed to generate secret: {str(e)}")

    def _generate_qr_code(self, secret: str, user_email: str) -> str:
        """
        Generate QR code for TOTP setup.

        Args:
            secret: TOTP secret
            user_email: User's email for display

        Returns:
            Base64 encoded PNG image

        Raises:
            QRCodeGenerationError: If generation fails
        """
        try:
            # Create TOTP instance
            totp = pyotp.TOTP(secret)

            # Generate provisioning URI
            provisioning_uri = totp.provisioning_uri(
                name=user_email, issuer_name="AI Lifestyle App"
            )

            # Create QR code
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            qr.add_data(provisioning_uri)
            qr.make(fit=True)

            # Create image
            img = qr.make_image(fill_color="black", back_color="white")

            # Convert to base64
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)

            img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

            # Return as data URI
            data_uri = f"data:image/png;base64,{img_base64}"

            logger.info("Generated QR code for MFA setup")
            return data_uri

        except Exception as e:
            logger.error(f"Failed to generate QR code: {str(e)}")
            raise QRCodeGenerationError(f"Failed to generate QR code: {str(e)}")
