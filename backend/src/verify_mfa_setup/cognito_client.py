"""
Cognito client for MFA operations.
"""

import os
import boto3
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

from .errors import CognitoError

logger = Logger()


class CognitoMFAClient:
    """Handles Cognito MFA operations."""
    
    def __init__(self):
        self.client = boto3.client('cognito-idp')
        self.user_pool_id = os.environ.get('COGNITO_USER_POOL_ID')
        
        if not self.user_pool_id:
            raise ValueError("Missing COGNITO_USER_POOL_ID environment variable")
    
    def enable_mfa_preference(self, user_id: str) -> None:
        """
        Enable MFA preference in Cognito for user.
        
        Args:
            user_id: User's Cognito ID
            
        Raises:
            CognitoError: If operation fails
        """
        try:
            # Set MFA preference to enable software token MFA
            self.client.admin_set_user_mfa_preference(
                UserPoolId=self.user_pool_id,
                Username=user_id,
                SoftwareTokenMfaSettings={
                    'Enabled': True,
                    'PreferredMfa': True
                }
            )
            
            logger.info(f"Enabled MFA preference in Cognito for user {user_id}")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(f"Failed to enable MFA preference: {error_code} - {error_message}")
            
            if error_code == 'UserNotFoundException':
                raise CognitoError("User not found")
            elif error_code == 'NotAuthorizedException':
                raise CognitoError("Not authorized to update MFA preference")
            else:
                raise CognitoError(f"Failed to enable MFA: {error_message}")
    
    def get_user_mfa_preference(self, user_id: str) -> dict:
        """
        Get user's MFA preference from Cognito.
        
        Args:
            user_id: User's Cognito ID
            
        Returns:
            MFA preference settings
            
        Raises:
            CognitoError: If operation fails
        """
        try:
            response = self.client.admin_get_user(
                UserPoolId=self.user_pool_id,
                Username=user_id
            )
            
            # Extract MFA preferences
            mfa_options = response.get('MFAOptions', [])
            user_mfa_preference = response.get('UserMFASettingList', [])
            preferred_mfa = response.get('PreferredMfaSetting')
            
            return {
                'mfa_options': mfa_options,
                'enabled_mfa': user_mfa_preference,
                'preferred_mfa': preferred_mfa
            }
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            
            logger.error(f"Failed to get MFA preference: {error_code} - {error_message}")
            raise CognitoError(f"Failed to get MFA preference: {error_message}")
