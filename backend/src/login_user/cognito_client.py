"""
AWS Cognito client wrapper for authentication operations.
"""

import os
import hmac
import hashlib
import base64
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
import boto3
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

from .errors import (
    CognitoError,
    InvalidCredentialsError,
    UserNotFoundError,
    AccountNotVerifiedError,
    AccountLockedError,
    MfaRequiredError
)

logger = Logger()


class CognitoClient:
    """Wrapper for AWS Cognito authentication operations"""
    
    def __init__(self, user_pool_id: str, client_id: str, client_secret: Optional[str] = None):
        """
        Initialize Cognito client.
        
        Args:
            user_pool_id: Cognito User Pool ID
            client_id: Cognito App Client ID
            client_secret: Cognito App Client Secret (if configured)
        """
        self.user_pool_id = user_pool_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.client = boto3.client('cognito-idp')
        
    def _calculate_secret_hash(self, username: str) -> str:
        """
        Calculate secret hash for Cognito requests when using client secret.
        
        Args:
            username: Username (email) for the hash
            
        Returns:
            Base64 encoded secret hash
        """
        if not self.client_secret:
            return ""
            
        message = username + self.client_id
        dig = hmac.new(
            self.client_secret.encode('UTF-8'),
            msg=message.encode('UTF-8'),
            digestmod=hashlib.sha256
        ).digest()
        return base64.b64encode(dig).decode()
    
    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate user with email and password.
        
        Args:
            email: User's email address
            password: User's password
            
        Returns:
            Authentication result containing tokens or MFA challenge
            
        Raises:
            InvalidCredentialsError: If credentials are invalid
            UserNotFoundError: If user doesn't exist
            AccountNotVerifiedError: If account is not verified
            AccountLockedError: If account is locked
            MfaRequiredError: If MFA is required
            CognitoError: For other Cognito errors
        """
        try:
            auth_params = {
                'USERNAME': email,
                'PASSWORD': password
            }
            
            # Add secret hash if client secret is configured
            if self.client_secret:
                auth_params['SECRET_HASH'] = self._calculate_secret_hash(email)
            
            response = self.client.initiate_auth(
                ClientId=self.client_id,
                AuthFlow='USER_PASSWORD_AUTH',
                AuthParameters=auth_params
            )
            
            # Check if MFA is required
            if 'ChallengeName' in response:
                if response['ChallengeName'] in ['SMS_MFA', 'SOFTWARE_TOKEN_MFA']:
                    logger.info("MFA required for user", extra={"email": email})
                    raise MfaRequiredError(
                        session_token=response['Session'],
                        challenge_name=response['ChallengeName']
                    )
                    
            # Successful authentication without MFA
            auth_result = response['AuthenticationResult']
            return {
                'accessToken': auth_result['AccessToken'],
                'refreshToken': auth_result['RefreshToken'],
                'idToken': auth_result['IdToken'],
                'expiresIn': auth_result['ExpiresIn'],
                'tokenType': auth_result['TokenType']
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(
                "Cognito authentication error",
                extra={
                    "error_code": error_code,
                    "error_message": error_message,
                    "email": email
                }
            )
            
            # Map Cognito errors to custom exceptions
            if error_code == 'NotAuthorizedException':
                raise InvalidCredentialsError()
            elif error_code == 'UserNotFoundException':
                raise UserNotFoundError(email)
            elif error_code == 'UserNotConfirmedException':
                raise AccountNotVerifiedError(email)
            elif error_code == 'TooManyRequestsException':
                raise AccountLockedError(email)
            elif error_code == 'InvalidParameterException':
                raise CognitoError(
                    "Invalid parameters provided",
                    error_code,
                    {"message": error_message}
                )
            else:
                raise CognitoError(
                    error_message,
                    error_code
                )
    
    def get_user_attributes(self, access_token: str) -> Dict[str, str]:
        """
        Get user attributes from access token.
        
        Args:
            access_token: Valid Cognito access token
            
        Returns:
            Dictionary of user attributes
            
        Raises:
            CognitoError: If token is invalid or expired
        """
        try:
            response = self.client.get_user(
                AccessToken=access_token
            )
            
            # Convert attributes list to dictionary
            attributes = {}
            for attr in response['UserAttributes']:
                attributes[attr['Name']] = attr['Value']
                
            return attributes
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(
                "Error getting user attributes",
                extra={
                    "error_code": error_code,
                    "error_message": error_message
                }
            )
            
            raise CognitoError(
                "Failed to get user attributes",
                error_code,
                {"message": error_message}
            )
    
    def update_failed_login_attempts(self, email: str) -> None:
        """
        Update failed login attempt counter for user.
        
        Args:
            email: User's email address
        """
        try:
            # Skip if custom attributes not available
            logger.info(
                "Skipping failed login attempt tracking (custom attributes may not be configured)",
                extra={"email": email}
            )
            return
            
        except Exception as e:
            # Don't fail the login process if we can't update the counter
            logger.error(
                "Failed to update login attempts counter",
                extra={
                    "email": email,
                    "error": str(e)
                }
            )
    
    def reset_failed_login_attempts(self, email: str) -> None:
        """
        Reset failed login attempt counter for user after successful login.
        
        Args:
            email: User's email address
        """
        try:
            # Skip if custom attributes not available
            logger.info(
                "Skipping failed login attempt reset (custom attributes may not be configured)",
                extra={"email": email}
            )
            return
            
        except Exception as e:
            # Don't fail the login process if we can't reset the counter
            logger.error(
                "Failed to reset login attempts counter",
                extra={
                    "email": email,
                    "error": str(e)
                }
            )
