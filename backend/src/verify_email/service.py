"""
Service layer for email verification business logic.
"""

from typing import Tuple
from aws_lambda_powertools import Logger

from .cognito_client import CognitoClient
from .repository import EmailVerificationRepository
from .errors import (
    EmailVerificationError,
    InvalidTokenError,
    UserNotFoundError,
    AlreadyVerifiedError
)

logger = Logger()


class EmailVerificationService:
    """Handles email verification business logic."""
    
    def __init__(self):
        self.cognito_client = CognitoClient()
        self.repository = EmailVerificationRepository()
    
    def verify_email_with_token(self, token: str) -> str:
        """
        Verify user's email using the verification token.
        
        Per PM decision: Implementing with 7-day grace period (not enforced for MVP).
        Users can still login even if email is not verified.
        
        Args:
            token: Verification token from email
            
        Returns:
            Success message
            
        Raises:
            InvalidTokenError: If token is invalid or expired
            AlreadyVerifiedError: If email is already verified
            EmailVerificationError: For other errors
        """
        try:
            # Parse the token to extract username and code
            # Token format: "email:code" (simple format for MVP)
            # In production, this would be a JWT or encrypted token
            parts = token.split(':', 1)
            if len(parts) != 2:
                raise InvalidTokenError("Invalid token format")
            
            email, confirmation_code = parts
            
            # Check if already verified to provide better error message
            try:
                is_verified = self.cognito_client.get_user_verification_status(email)
                if is_verified:
                    raise AlreadyVerifiedError()
            except UserNotFoundError:
                # User not found - let Cognito handle this in verify_email
                pass
            
            # Verify with Cognito
            self.cognito_client.verify_email(email, confirmation_code)
            
            # Get user from database to update verification status
            user_data = self.repository.get_user_by_email(email)
            if user_data:
                user_id = user_data.get('user_id')
                if user_id:
                    # Update verification status in database
                    self.repository.update_email_verified_status(user_id, True)
                    
                    # Record verification event for audit
                    self.repository.record_verification_event(
                        user_id,
                        'email_verified',
                        {'email': email, 'method': 'token'}
                    )
            
            logger.info(f"Email verified successfully for: {email}")
            return "Email successfully verified. You can now access all features of the app."
            
        except (InvalidTokenError, AlreadyVerifiedError):
            # Re-raise these as-is
            raise
        except Exception as e:
            logger.error(f"Error during email verification: {str(e)}")
            if isinstance(e, EmailVerificationError):
                raise
            raise EmailVerificationError(f"Failed to verify email: {str(e)}")
    
    def resend_verification_email(self, email: str) -> str:
        """
        Resend verification email to user.
        
        Args:
            email: User's email address
            
        Returns:
            Success message
            
        Raises:
            AlreadyVerifiedError: If email is already verified
            UserNotFoundError: If user doesn't exist
            EmailVerificationError: For other errors
        """
        try:
            # Check if already verified
            is_verified = self.cognito_client.get_user_verification_status(email)
            if is_verified:
                raise AlreadyVerifiedError()
            
            # Resend verification code
            self.cognito_client.resend_verification_code(email)
            
            # Get user from database for audit
            user_data = self.repository.get_user_by_email(email)
            if user_data:
                user_id = user_data.get('user_id')
                if user_id:
                    # Record resend event for rate limiting and audit
                    self.repository.record_verification_event(
                        user_id,
                        'verification_code_resent',
                        {'email': email}
                    )
            
            logger.info(f"Verification code resent to: {email}")
            return "Verification email has been resent. Please check your inbox."
            
        except (AlreadyVerifiedError, UserNotFoundError):
            # Re-raise these as-is
            raise
        except Exception as e:
            logger.error(f"Error resending verification email: {str(e)}")
            if isinstance(e, EmailVerificationError):
                raise
            raise EmailVerificationError(f"Failed to resend verification email: {str(e)}")
    
    def check_verification_status(self, email: str) -> Tuple[bool, str]:
        """
        Check if user's email is verified.
        
        Args:
            email: User's email address
            
        Returns:
            Tuple of (is_verified, message)
            
        Raises:
            UserNotFoundError: If user doesn't exist
            EmailVerificationError: For other errors
        """
        try:
            is_verified = self.cognito_client.get_user_verification_status(email)
            
            if is_verified:
                message = "Email is verified"
            else:
                message = "Email is not verified. Please check your inbox for the verification email."
            
            return is_verified, message
            
        except UserNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Error checking verification status: {str(e)}")
            if isinstance(e, EmailVerificationError):
                raise
            raise EmailVerificationError(f"Failed to check verification status: {str(e)}")
