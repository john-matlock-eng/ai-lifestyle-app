"""
Business logic service for token refresh operations.
"""

from typing import Optional
from aws_lambda_powertools import Logger, Tracer

from .models import RefreshTokenRequest, RefreshTokenResponse
from .cognito_client import CognitoClient
from .errors import RefreshError

logger = Logger()
tracer = Tracer()


class TokenRefreshService:
    """Service for handling token refresh operations."""
    
    def __init__(self, cognito_client: CognitoClient):
        """
        Initialize token refresh service.
        
        Args:
            cognito_client: Cognito client instance
        """
        self.cognito_client = cognito_client
        logger.info("Token refresh service initialized")
    
    @tracer.capture_method
    def refresh_token(self, request: RefreshTokenRequest) -> RefreshTokenResponse:
        """
        Refresh access token using refresh token.
        
        Args:
            request: Token refresh request containing refresh token
            
        Returns:
            Response with new access token
            
        Raises:
            InvalidTokenError: If refresh token is invalid
            ExpiredTokenError: If refresh token has expired
            RevokedTokenError: If refresh token has been revoked
            RefreshError: For other refresh errors
        """
        logger.info(
            "Processing token refresh request",
            extra={
                "has_refresh_token": bool(request.refreshToken)
            }
        )
        
        try:
            # Refresh the token using Cognito
            cognito_response = self.cognito_client.refresh_access_token(
                refresh_token=request.refreshToken
            )
            
            # Convert Cognito response to API response
            response = cognito_response.to_refresh_response()
            
            logger.info(
                "Token refresh completed successfully",
                extra={
                    "expires_in": response.expiresIn,
                    "token_type": response.tokenType
                }
            )
            
            return response
            
        except RefreshError:
            # Re-raise refresh errors as-is
            raise
        except Exception as e:
            logger.exception(
                "Unexpected error during token refresh",
                extra={"error": str(e)}
            )
            raise RefreshError(
                "An unexpected error occurred during token refresh",
                details={"error": str(e)}
            )
    
    @tracer.capture_method
    def validate_new_token(self, access_token: str) -> bool:
        """
        Validate that a newly issued access token is valid.
        
        Args:
            access_token: Access token to validate
            
        Returns:
            True if token is valid, False otherwise
        """
        try:
            # Try to get user info with the new token
            user_info = self.cognito_client.get_user_from_access_token(access_token)
            
            logger.info(
                "New access token validated successfully",
                extra={
                    "username": user_info.get('username'),
                    "has_attributes": bool(user_info.get('attributes'))
                }
            )
            
            return True
            
        except Exception as e:
            logger.error(
                "Failed to validate new access token",
                extra={"error": str(e)}
            )
            return False
