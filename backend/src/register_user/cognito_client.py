"""
AWS Cognito client wrapper for user registration.
Updated to use SignUp flow for proper email verification.
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
        
        # Get required environment variables
        self.user_pool_id = os.environ.get('COGNITO_USER_POOL_ID')
        self.client_id = os.environ.get('COGNITO_CLIENT_ID')
        
        if not self.user_pool_id or not self.client_id:
            raise ValueError(
                "Missing required environment variables: "
                f"COGNITO_USER_POOL_ID={self.user_pool_id}, "
                f"COGNITO_CLIENT_ID={self.client_id}"
            )
        
    def create_user(
        self,
        email: str,
        password: str,
        first_name: str,
        last_name: str
    ) -> CognitoUser:
        """
        Create a new user in Cognito using SignUp flow.
        This will automatically send a verification email.
        
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
            # Use sign_up for self-registration with automatic email verification
            response = self.client.sign_up(
                ClientId=self.client_id,
                Username=email,
                Password=password,
                UserAttributes=[
                    {'Name': 'email', 'Value': email},
                    {'Name': 'given_name', 'Value': first_name},
                    {'Name': 'family_name', 'Value': last_name},
                ]
            )
            
            user_id = response['UserSub']  # This is the unique user ID
            
            # Get additional user details
            # Note: We can't get full details until email is verified
            # But we have enough info to create the user in our database
            
            # For the registration flow, we'll use current time for timestamps
            # since sign_up doesn't return them
            from datetime import datetime
            now = datetime.utcnow()
            
            return CognitoUser(
                user_id=UUID(user_id),
                email=email,
                email_verified=False,  # Will be false until user verifies
                enabled=True,
                status='UNCONFIRMED',  # User needs to verify email
                created_at=now,
                updated_at=now
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
            elif error_code == 'InvalidParameterException':
                raise CognitoError(
                    f"Invalid parameter: {e.response['Error']['Message']}",
                    original_error=e
                )
            else:
                raise CognitoError(
                    f"Failed to create user in Cognito: {error_code}",
                    original_error=e
                )
    
    def resend_verification_email(self, email: str) -> None:
        """
        Resend verification email to user.
        
        Args:
            email: User's email address
            
        Raises:
            CognitoError: If sending email fails
        """
        try:
            self.client.resend_confirmation_code(
                ClientId=self.client_id,
                Username=email
            )
        except ClientError as e:
            error_code = e.response['Error']['Code']
            
            if error_code == 'UserNotFoundException':
                raise CognitoError("User not found")
            elif error_code == 'InvalidParameterException':
                # User is already confirmed
                raise CognitoError("User is already verified")
            else:
                raise CognitoError(
                    f"Failed to resend verification email: {error_code}",
                    original_error=e
                )
    
    def delete_user(self, user_id: str) -> None:
        """
        Delete a user from Cognito (used for rollback on registration failure).
        Note: This requires admin permissions and the user must be confirmed.
        For unconfirmed users, they will auto-expire.
        
        Args:
            user_id: Cognito user ID
        """
        try:
            # Try to delete as admin
            self.client.admin_delete_user(
                UserPoolId=self.user_pool_id,
                Username=user_id
            )
        except ClientError as e:
            # If user is unconfirmed, they can't be deleted but will expire
            if e.response['Error']['Code'] != 'UserNotFoundException':
                # Log but don't raise - this is cleanup
                pass
    
    def get_user_by_email(self, email: str) -> Optional[dict]:
        """
        Get user details by email (admin operation).
        
        Args:
            email: User's email address
            
        Returns:
            User details dict or None if not found
        """
        try:
            response = self.client.admin_get_user(
                UserPoolId=self.user_pool_id,
                Username=email
            )
            
            # Extract attributes into a dict
            attributes = {}
            for attr in response.get('UserAttributes', []):
                attributes[attr['Name']] = attr['Value']
            
            return {
                'username': response['Username'],
                'attributes': attributes,
                'status': response.get('UserStatus'),
                'enabled': response.get('Enabled', True),
                'created_date': response.get('UserCreateDate'),
                'modified_date': response.get('UserLastModifiedDate')
            }
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'UserNotFoundException':
                return None
            raise CognitoError(
                f"Failed to get user: {e.response['Error']['Message']}",
                original_error=e
            )
