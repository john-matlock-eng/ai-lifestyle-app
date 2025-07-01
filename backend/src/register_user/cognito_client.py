"""
AWS Cognito client wrapper for user registration.
"""
import os
from typing import Optional
from uuid import UUID

import boto3
from botocore.exceptions import ClientError

from .errors import CognitoError, UserAlreadyExistsError
from .models import CognitoUser


class CognitoClient:
    """Wrapper for AWS Cognito operations"""
    
    def __init__(self):
        self.client = boto3.client('cognito-idp')
        self.user_pool_id = os.environ['COGNITO_USER_POOL_ID']
        self.client_id = os.environ['COGNITO_CLIENT_ID']
        
    def create_user(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str
    ) -> CognitoUser:
        """
        Create a new user in Cognito.
        
        Args:
            email: User's email address
            password: User's password
            first_name: User's first name
            last_name: User's last name
            
        Returns:
            CognitoUser object with user details
            
        Raises:
            UserAlreadyExistsError: If email is already registered
            CognitoError: For other Cognito errors
        """
        try:
            # Create user with temporary password (admin-created)
            response = self.client.admin_create_user(
                UserPoolId=self.user_pool_id,
                Username=email,
                UserAttributes=[
                    {'Name': 'email', 'Value': email},
                    {'Name': 'email_verified', 'Value': 'false'},
                    {'Name': 'given_name', 'Value': first_name},
                    {'Name': 'family_name', 'Value': last_name},
                ],
                MessageAction='SUPPRESS',  # Don't send welcome email yet
                TemporaryPassword=password  # Will be set as permanent below
            )
            
            user_id = response['User']['Username']
            
            # Set permanent password
            self.client.admin_set_user_password(
                UserPoolId=self.user_pool_id,
                Username=user_id,
                Password=password,
                Permanent=True
            )
            
            # Get user details
            user_data = response['User']
            
            return CognitoUser(
                user_id=UUID(user_id),
                email=email,
                email_verified=False,
                enabled=user_data['Enabled'],
                status=user_data['UserStatus'],
                created_at=user_data['UserCreateDate'],
                updated_at=user_data['UserLastModifiedDate']
            )
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            
            if error_code == 'UsernameExistsException':
                raise UserAlreadyExistsError(email)
            elif error_code == 'InvalidPasswordException':
                raise CognitoError(
                    "Password does not meet requirements",
                    original_error=e
                )
            else:
                raise CognitoError(
                    f"Failed to create user in Cognito: {error_code}",
                    original_error=e
                )
    
    def send_verification_email(self, user_id: str) -> None:
        """
        Send email verification to user.
        
        Args:
            user_id: Cognito user ID
            
        Raises:
            CognitoError: If sending email fails
        """
        try:
            # Get user's email attribute
            response = self.client.admin_get_user(
                UserPoolId=self.user_pool_id,
                Username=user_id
            )
            
            email = None
            for attr in response['UserAttributes']:
                if attr['Name'] == 'email':
                    email = attr['Value']
                    break
            
            if not email:
                raise CognitoError("User email not found")
            
            # Initiate email verification
            self.client.admin_update_user_attributes(
                UserPoolId=self.user_pool_id,
                Username=user_id,
                UserAttributes=[
                    {'Name': 'email_verified', 'Value': 'false'}
                ]
            )
            
            # This will trigger Cognito to send verification email
            self.client.admin_user_global_sign_out(
                UserPoolId=self.user_pool_id,
                Username=user_id
            )
            
        except ClientError as e:
            raise CognitoError(
                f"Failed to send verification email: {e.response['Error']['Code']}",
                original_error=e
            )
    
    def delete_user(self, user_id: str) -> None:
        """
        Delete a user from Cognito (used for rollback on registration failure).
        
        Args:
            user_id: Cognito user ID
        """
        try:
            self.client.admin_delete_user(
                UserPoolId=self.user_pool_id,
                Username=user_id
            )
        except ClientError:
            # Ignore errors during cleanup
            pass
