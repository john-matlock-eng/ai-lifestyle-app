"""
Service layer for MFA verification during login.
"""

from typing import Any, Dict

from aws_lambda_powertools import Logger

from .cognito_client import CognitoMFAAuthClient
from .errors import InvalidMFACodeError, InvalidSessionError, MFALoginError, TooManyAttemptsError
from .models import LoginResponse
from .repository import MFALoginRepository

logger = Logger()

# Maximum failed MFA attempts before lockout
MAX_FAILED_ATTEMPTS = 5


class MFALoginService:
    """Handles MFA verification during login."""

    def __init__(self):
        self.repository = MFALoginRepository()
        self.cognito_client = CognitoMFAAuthClient()

    def verify_mfa_login(self, session_token: str, mfa_code: str) -> LoginResponse:
        """
        Verify MFA code and complete login.

        Args:
            session_token: Session token from initial login
            mfa_code: 6-digit TOTP code

        Returns:
            Login response with tokens and user data

        Raises:
            InvalidSessionError: If session is invalid/expired
            InvalidMFACodeError: If code is incorrect
            TooManyAttemptsError: If too many failed attempts
            MFALoginError: For other errors
        """
        try:
            # Respond to MFA challenge
            auth_result = self.cognito_client.respond_to_mfa_challenge(
                session_token=session_token, mfa_code=mfa_code
            )

            # Extract tokens
            access_token = auth_result.get("AccessToken")
            refresh_token = auth_result.get("RefreshToken")
            id_token = auth_result.get("IdToken")
            expires_in = auth_result.get("ExpiresIn", 3600)

            if not access_token or not refresh_token:
                logger.error("Missing tokens in auth result")
                raise MFALoginError("Authentication failed - missing tokens")

            # Extract user ID from tokens
            # In a real implementation, you would decode the JWT to get the 'sub' claim
            # For now, we'll use a placeholder
            user_id = self._extract_user_id_from_token(id_token or access_token)

            # Get user data from database
            user_data = self.repository.get_user_by_cognito_id(user_id)
            if not user_data:
                logger.error(f"User data not found for ID: {user_id}")
                # Create minimal user object
                user_data = {
                    "user_id": user_id,
                    "email": "unknown",
                    "first_name": "Unknown",
                    "last_name": "User",
                    "mfa_enabled": True,
                }

            # Reset failed attempts on success
            self.repository.reset_failed_mfa_attempts(user_id)

            # Record successful login
            self.repository.record_mfa_login(user_id, True)

            # Build user profile for response
            user_profile = self._build_user_profile(user_data)

            logger.info(f"MFA login successful for user {user_id}")

            return LoginResponse(
                accessToken=access_token,
                refreshToken=refresh_token,
                tokenType="Bearer",
                expiresIn=expires_in,
                user=user_profile,
            )

        except (InvalidSessionError, InvalidMFACodeError, TooManyAttemptsError):
            # Handle failed attempt tracking for known user errors
            # Note: We can't get user_id without valid session, so skip tracking
            raise

        except Exception as e:
            logger.error(f"Failed to verify MFA login: {str(e)}")
            if isinstance(e, MFALoginError):
                raise
            raise MFALoginError(f"MFA verification failed: {str(e)}")

    def _extract_user_id_from_token(self, token: str) -> str:
        """
        Extract user ID from JWT token.

        In production, this would decode the JWT and extract the 'sub' claim.
        For now, returns a placeholder.

        Args:
            token: JWT token

        Returns:
            User ID
        """
        # TODO: Implement JWT decoding
        # For now, this is a placeholder
        # In reality, you would:
        # 1. Decode the JWT (without verification since we trust Cognito)
        # 2. Extract the 'sub' claim which is the user ID

        import base64
        import json

        try:
            # JWT format: header.payload.signature
            parts = token.split(".")
            if len(parts) != 3:
                raise ValueError("Invalid JWT format")

            # Decode payload (add padding if needed)
            payload = parts[1]
            payload += "=" * (4 - len(payload) % 4)  # Add padding

            decoded = base64.urlsafe_b64decode(payload)
            claims = json.loads(decoded)

            user_id = claims.get("sub")
            if not user_id:
                raise ValueError("No sub claim in token")

            return user_id

        except Exception as e:
            logger.error(f"Failed to extract user ID from token: {str(e)}")
            # Return a placeholder for now
            return "unknown-user-id"

    def _build_user_profile(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Build user profile for response.

        Args:
            user_data: Raw user data from database

        Returns:
            User profile dictionary
        """
        return {
            "userId": user_data.get("user_id", "unknown"),
            "email": user_data.get("email", "unknown"),
            "firstName": user_data.get("first_name", ""),
            "lastName": user_data.get("last_name", ""),
            "emailVerified": user_data.get("email_verified", False),
            "mfaEnabled": user_data.get("mfa_enabled", True),
            "createdAt": user_data.get("created_at", ""),
            "updatedAt": user_data.get("updated_at", ""),
        }
