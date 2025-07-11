"""
Cognito client for MFA authentication operations.
"""

import os
from typing import Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

from .errors import (
    CognitoError,
    InvalidSessionError,
    InvalidMFACodeError,
    TooManyAttemptsError
)

logger = Logger()


class CognitoMFAAuthClient:
    """Handles Cognito MFA authentication operations."""
    
    def __init__(self):
        self.client = boto3.client('cognito-idp')
        self.client_id = os.environ.get('COGNITO_CLIENT_ID')
        
        if not self.client_id:
            raise ValueError("Missing COGNITO_CLIENT_ID environment variable")
    
    def respond_to_mfa_challenge(self, session_token: str, mfa_code: str, 
                                 username: Optional[str] = None) -> Dict[str, Any]:
        """
        Respond to MFA challenge during login.
        
        Args:
            session_token: Session token from initial login attempt
            mfa_code: 6-digit TOTP code from authenticator app
            username: Username (email) - optional, extracted from session if not provided
            
        Returns:
            Authentication result with tokens
            
        Raises:
            InvalidSessionError: If session token is invalid/expired
            InvalidMFACodeError: If MFA code is incorrect
            TooManyAttemptsError: If too many failed attempts
            CognitoError: For other Cognito errors
        """
        try:
            # Build challenge responses
            challenge_responses = {
                'SOFTWARE_TOKEN_MFA_CODE': mfa_code
            }
            
            # If username provided, include it
            if username:
                challenge_responses['USERNAME'] = username
            
            # Respond to auth challenge
            response = self.client.respond_to_auth_challenge(
                ClientId=self.client_id,
                ChallengeName='SOFTWARE_TOKEN_MFA',
                Session=session_token,
                ChallengeResponses=challenge_responses
            )
            
            # Check if we got authentication result
            auth_result = response.get('AuthenticationResult')
            if not auth_result:
                logger.error("No authentication result in MFA response")
                raise CognitoError("MFA verification failed")
            
            logger.info("MFA challenge completed successfully")
            return auth_result
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(f"Cognito error during MFA verification: {error_code} - {error_message}")
            
            if error_code == 'NotAuthorizedException':
                if 'Invalid session' in error_message or 'Session expired' in error_message:
                    raise InvalidSessionError("Session has expired. Please login again.")
                elif 'Invalid code' in error_message:
                    raise InvalidMFACodeError("Invalid MFA code. Please try again.")
                else:
                    raise CognitoError(f"Authentication failed: {error_message}")
                    
            elif error_code == 'CodeMismatchException':
                raise InvalidMFACodeError("Invalid MFA code. Please check your authenticator app.")
                
            elif error_code == 'TooManyRequestsException':
                raise TooManyAttemptsError("Too many failed attempts. Please try again later.")
                
            elif error_code == 'InvalidParameterException':
                if 'Session' in error_message:
                    raise InvalidSessionError("Invalid session format")
                else:
                    raise CognitoError(f"Invalid request: {error_message}")
                    
            else:
                raise CognitoError(f"MFA verification failed: {error_message}")
    
    def extract_username_from_session(self, session_token: str) -> Optional[str]:
        """
        Try to extract username from session token.
        Note: This is a placeholder - Cognito sessions are opaque.
        
        Args:
            session_token: Session token from login
            
        Returns:
            Username if found, None otherwise
        """
        # Cognito session tokens are opaque, so we can't extract info directly
        # In a real implementation, you might store session info in a cache
        # or require the username to be passed from the login response
        return None
