"""
Business logic service for user profile operations.
"""

from typing import Optional
from aws_lambda_powertools import Logger, Tracer

from user_profile_common import UserProfile
from .repository import UserRepository
from .cognito_client import CognitoClient
from .errors import ProfileError, UnauthorizedError

logger = Logger()
tracer = Tracer()


class UserProfileService:
    """Service for handling user profile operations."""
    
    def __init__(self, repository: UserRepository, cognito_client: CognitoClient):
        """
        Initialize user profile service.
        
        Args:
            repository: User repository instance
            cognito_client: Cognito client instance
        """
        self.repository = repository
        self.cognito_client = cognito_client
        logger.info("User profile service initialized")
    
    @tracer.capture_method
    def get_user_profile(self, access_token: str) -> UserProfile:
        """
        Get user profile from access token.
        
        Args:
            access_token: JWT access token from Authorization header
            
        Returns:
            User profile data
            
        Raises:
            UnauthorizedError: If authentication fails
            UserNotFoundError: If user not found in database
            ProfileError: For other profile errors
        """
        # Validate token is present
        if not access_token:
            raise UnauthorizedError("Missing authentication token")
        
        logger.info(
            "Processing get user profile request",
            extra={"has_token": bool(access_token)}
        )
        
        try:
            # Verify token and get user ID from Cognito
            user_id = self.cognito_client.verify_token_and_get_user_id(access_token)
            
            logger.info(
                "Token validated successfully",
                extra={"user_id": user_id}
            )
            
            # Get user data from DynamoDB
            user_data = self.repository.get_user_by_id(user_id)
            
            # Convert to API response model
            user_profile = user_data.to_user_profile()
            
            logger.info(
                "User profile retrieved successfully",
                extra={
                    "user_id": user_profile.userId,
                    "email": user_profile.email,
                    "has_preferences": bool(user_profile.preferences)
                }
            )
            
            return user_profile
            
        except ProfileError:
            # Re-raise profile errors as-is
            raise
        except Exception as e:
            logger.exception(
                "Unexpected error during profile retrieval",
                extra={"error": str(e)}
            )
            raise ProfileError(
                "An unexpected error occurred while retrieving profile",
                details={"error": str(e)}
            )
    
    @tracer.capture_method
    def enrich_profile_with_cognito_data(self, profile: UserProfile, access_token: str) -> UserProfile:
        """
        Enrich profile with additional data from Cognito if needed.
        
        Args:
            profile: User profile from database
            access_token: Access token for Cognito
            
        Returns:
            Enriched user profile
        """
        try:
            # Get additional data from Cognito
            cognito_data = self.cognito_client.get_user_from_access_token(access_token)
            
            # Update MFA status from Cognito (more authoritative)
            profile.mfaEnabled = cognito_data.get('mfa_enabled', False)
            
            # Update email verified status if different
            cognito_email_verified = cognito_data['attributes'].get('email_verified', 'false') == 'true'
            if cognito_email_verified != profile.emailVerified:
                logger.warning(
                    "Email verified status mismatch",
                    extra={
                        "db_status": profile.emailVerified,
                        "cognito_status": cognito_email_verified
                    }
                )
                profile.emailVerified = cognito_email_verified
            
            return profile
            
        except Exception as e:
            logger.warning(
                "Failed to enrich profile with Cognito data",
                extra={"error": str(e)}
            )
            # Return original profile if enrichment fails
            return profile
