"""
Cognito client for authentication operations.
"""

import boto3
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger
from typing import Dict, Any
import jwt
from jwt import PyJWKClient
import time

from .errors import (
    InvalidTokenError,
    TokenExpiredError,
    UnauthorizedError
)

logger = Logger()


class CognitoClient:
    """Client for AWS Cognito operations."""
    
    def __init__(self, user_pool_id: str, client_id: str):
        """
        Initialize Cognito client.
        
        Args:
            user_pool_id: Cognito user pool ID
            client_id: Cognito app client ID
        """
        self.user_pool_id = user_pool_id
        self.client_id = client_id
        self.cognito = boto3.client('cognito-idp')
        
        # Set up JWKS client for token verification
        region = boto3.Session().region_name
        self.jwks_url = f'https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json'
        self.jwks_client = PyJWKClient(self.jwks_url)
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """
        Verify a JWT token from Cognito.
        
        Args:
            token: JWT token to verify
            
        Returns:
            Token claims if valid
            
        Raises:
            InvalidTokenError: If token is invalid
            TokenExpiredError: If token is expired
        """
        try:
            # Get the signing key from JWKS
            signing_key = self.jwks_client.get_signing_key_from_jwt(token)
            
            # Verify and decode the token
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=['RS256'],
                audience=self.client_id,
                options={"verify_exp": True}
            )
            
            # Verify token use (should be 'access' for API calls)
            if claims.get('token_use') != 'access':
                raise InvalidTokenError(
                    message="Invalid token use",
                    details={"token_use": claims.get('token_use')}
                )
            
            # Verify client ID
            if claims.get('client_id') != self.client_id:
                raise InvalidTokenError(
                    message="Token not issued for this client",
                    details={"client_id": claims.get('client_id')}
                )
            
            return claims
            
        except jwt.ExpiredSignatureError:
            raise TokenExpiredError(
                message="Access token has expired"
            )
        except jwt.InvalidTokenError as e:
            logger.error(f"Invalid token: {str(e)}")
            raise InvalidTokenError(
                message="Invalid access token",
                details={"error": str(e)}
            )
        except Exception as e:
            logger.error(f"Token verification error: {str(e)}")
            raise InvalidTokenError(
                message="Failed to verify token",
                details={"error": str(e)}
            )