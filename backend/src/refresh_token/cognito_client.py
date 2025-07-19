"""
AWS Cognito client wrapper for token refresh operations.
"""

import hashlib
import hmac
import base64
from typing import Optional, Dict, Any
import boto3
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

from .errors import (
    InvalidTokenError,
    ExpiredTokenError,
    RevokedTokenError,
    CognitoError,
    ConfigurationError
)
from .models import CognitoTokenResponse

logger = Logger()


class CognitoClient:
    """Client for interacting with AWS Cognito."""
    
    def __init__(self, user_pool_id: str, client_id: str, client_secret: Optional[str] = None):
        """
        Initialize Cognito client.
        
        Args:
            user_pool_id: Cognito User Pool ID
            client_id: Cognito App Client ID
            client_secret: Optional App Client Secret
        """
        self.user_pool_id = user_pool_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.client = boto3.client('cognito-idp')
        
        logger.info(
            "Cognito client initialized",
            extra={
                "user_pool_id": user_pool_id,
                "client_id": client_id,
                "has_secret": bool(client_secret)
            }
        )
    
    def _calculate_secret_hash(self, username: str) -> str:
        """
        Calculate secret hash for Cognito requests.
        
        Args:
            username: Username (or refresh token for token refresh)
            
        Returns:
            Base64 encoded secret hash
        """
        if not self.client_secret:
            return ""
        
        message = bytes(username + self.client_id, 'utf-8')
        key = bytes(self.client_secret, 'utf-8')
        secret_hash = base64.b64encode(
            hmac.new(key, message, digestmod=hashlib.sha256).digest()
        ).decode()
        
        return secret_hash
    
    def refresh_access_token(self, refresh_token: str) -> CognitoTokenResponse:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            New token response from Cognito
            
        Raises:
            InvalidTokenError: If refresh token is invalid
            ExpiredTokenError: If refresh token has expired
            RevokedTokenError: If refresh token has been revoked
            CognitoError: For other Cognito errors
        """
        try:
            # Build auth parameters
            auth_params = {
                'REFRESH_TOKEN': refresh_token
            }

            # Include SECRET_HASH only when a client secret is configured. For
            # refresh token auth, Cognito expects the secret hash to be
            # calculated with the refresh token value.
            if self.client_secret:
                auth_params['SECRET_HASH'] = self._calculate_secret_hash(
                    refresh_token
                )

            
            logger.info(
                "Initiating token refresh",
                extra={
                    "has_secret": bool(self.client_secret),
                    "token_length": len(refresh_token)
                }
            )
            
            # Initiate auth flow
            response = self.client.initiate_auth(
                ClientId=self.client_id,
                AuthFlow='REFRESH_TOKEN_AUTH',
                AuthParameters=auth_params
            )
            
            # Extract authentication result
            auth_result = response.get('AuthenticationResult', {})
            
            if not auth_result.get('AccessToken'):
                logger.error(
                    "No access token in Cognito response",
                    extra={"response": response}
                )
                raise CognitoError("Failed to refresh token: No access token returned")
            
            # Create token response
            token_response = CognitoTokenResponse(
                AccessToken=auth_result['AccessToken'],
                IdToken=auth_result.get('IdToken'),
                TokenType=auth_result.get('TokenType', 'Bearer'),
                ExpiresIn=auth_result.get('ExpiresIn', 3600)
            )
            
            logger.info(
                "Token refresh successful",
                extra={
                    "expires_in": token_response.ExpiresIn,
                    "has_id_token": bool(token_response.IdToken)
                }
            )
            
            return token_response
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(
                "Cognito client error during token refresh",
                extra={
                    "error_code": error_code,
                    "error_message": error_message
                }
            )
            
            # Map Cognito errors to our custom exceptions
            if error_code == 'NotAuthorizedException':
                if 'Refresh Token has expired' in error_message:
                    raise ExpiredTokenError(
                        "The refresh token has expired. Please login again.",
                        details={"cognito_error": error_code}
                    )
                elif 'Refresh Token has been revoked' in error_message:
                    raise RevokedTokenError(
                        "The refresh token has been revoked.",
                        details={"cognito_error": error_code}
                    )
                elif 'Invalid Refresh Token' in error_message:
                    # This is the error we're seeing - provide more context
                    raise InvalidTokenError(
                        "The refresh token is invalid. This may occur if the token is malformed, "
                        "from a different user pool, or if there's a client configuration mismatch.",
                        details={
                            "cognito_error": error_code,
                            "client_id": self.client_id,
                            "hint": "Ensure the refresh token is from the same client and user pool"
                        }
                    )
                else:
                    raise InvalidTokenError(
                        f"Authentication failed: {error_message}",
                        details={"cognito_error": error_code}
                    )
            
            elif error_code == 'InvalidParameterException':
                raise InvalidTokenError(
                    "Invalid refresh token format.",
                    details={"cognito_error": error_code}
                )
            
            elif error_code == 'ResourceNotFoundException':
                raise ConfigurationError(
                    "Cognito User Pool or App Client not found.",
                    details={"cognito_error": error_code}
                )
            
            elif error_code == 'TooManyRequestsException':
                raise CognitoError(
                    "Too many requests. Please try again later.",
                    details={"cognito_error": error_code, "retry_after": "60"}
                )
            
            else:
                # Generic Cognito error
                raise CognitoError(
                    f"Cognito error: {error_message}",
                    details={"cognito_error": error_code}
                )
                
        except Exception as e:
            logger.exception(
                "Unexpected error during token refresh",
                extra={"error": str(e)}
            )
            raise CognitoError(
                "An unexpected error occurred during token refresh",
                details={"error": str(e)}
            )
    
    def get_user_from_access_token(self, access_token: str) -> Dict[str, Any]:
        """
        Get user information from access token.
        
        Args:
            access_token: Valid access token
            
        Returns:
            User attributes dictionary
            
        Raises:
            InvalidTokenError: If access token is invalid
            CognitoError: For other Cognito errors
        """
        try:
            response = self.client.get_user(
                AccessToken=access_token
            )
            
            # Convert user attributes to dictionary
            user_data = {
                'username': response['Username'],
                'attributes': {}
            }
            
            for attr in response.get('UserAttributes', []):
                user_data['attributes'][attr['Name']] = attr['Value']
            
            return user_data
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            if error_code in ['NotAuthorizedException', 'TokenExpiredException']:
                raise InvalidTokenError(
                    "Invalid or expired access token",
                    details={"cognito_error": error_code}
                )
            else:
                raise CognitoError(
                    f"Failed to get user info: {error_message}",
                    details={"cognito_error": error_code}
                )
