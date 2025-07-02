"""
Service layer for user login operations.
"""

import os
from typing import Dict, Any, Optional, Union
from datetime import datetime
from aws_lambda_powertools import Logger

from .models import (
    LoginRequest,
    LoginResponse,
    MfaLoginResponse,
    UserProfile,
    CognitoAuthResponse
)
from .repository import UserRepository
from .cognito_client import CognitoClient
from .errors import (
    LoginError,
    InvalidCredentialsError,
    UserNotFoundError,
    MfaRequiredError
)

logger = Logger()


class LoginService:
    """Service for handling user login operations"""
    
    def __init__(
        self,
        user_repository: UserRepository,
        cognito_client: CognitoClient
    ):
        """
        Initialize login service.
        
        Args:
            user_repository: Repository for user data operations
            cognito_client: Client for Cognito operations
        """
        self.user_repository = user_repository
        self.cognito_client = cognito_client
    
    def login_user(
        self,
        request: LoginRequest,
        ip_address: Optional[str] = None
    ) -> Union[LoginResponse, MfaLoginResponse]:
        """
        Authenticate user and return tokens.
        
        Args:
            request: Login request with email and password
            ip_address: Client IP address for audit logging
            
        Returns:
            LoginResponse with tokens or MfaLoginResponse if MFA required
            
        Raises:
            InvalidCredentialsError: If credentials are invalid
            UserNotFoundError: If user doesn't exist
            MfaRequiredError: If MFA is required (caught and handled)
            LoginError: For other login errors
        """
        try:
            # Record login attempt
            self.user_repository.record_login_attempt(
                email=request.email,
                success=False,  # Will update if successful
                ip_address=ip_address
            )
            
            # Authenticate with Cognito
            try:
                auth_result = self.cognito_client.authenticate_user(
                    email=request.email,
                    password=request.password
                )
            except MfaRequiredError as e:
                # MFA is required, return session token
                logger.info(
                    "MFA required for login",
                    extra={"email": request.email}
                )
                return MfaLoginResponse(
                    sessionToken=e.details['session_token'],
                    mfaRequired=True,
                    tokenType="Bearer"
                )
            except InvalidCredentialsError:
                # Update failed login attempts
                self.cognito_client.update_failed_login_attempts(request.email)
                raise
            
            # Get user profile from database
            user_data = self.user_repository.get_user_by_email(request.email)
            if not user_data:
                logger.error(
                    "User authenticated but not found in database",
                    extra={"email": request.email}
                )
                raise UserNotFoundError(request.email)
            
            # Update successful login
            self.user_repository.record_login_attempt(
                email=request.email,
                success=True,
                ip_address=ip_address
            )
            
            # Update last login timestamp
            self.user_repository.update_last_login(
                user_id=user_data['userId'],
                login_timestamp=datetime.utcnow()
            )
            
            # Reset failed login attempts on successful login
            self.cognito_client.reset_failed_login_attempts(request.email)
            
            # Get additional user attributes from Cognito if needed
            try:
                cognito_attributes = self.cognito_client.get_user_attributes(
                    auth_result['accessToken']
                )
                
                # Update user data with Cognito attributes
                email_verified = cognito_attributes.get('email_verified', 'false') == 'true'
                phone_verified = cognito_attributes.get('phone_number_verified', 'false') == 'true'
                
            except Exception as e:
                logger.warning(
                    "Failed to get Cognito attributes, using database values",
                    extra={"error": str(e)}
                )
                email_verified = user_data.get('emailVerified', False)
                phone_verified = user_data.get('phoneVerified', False)
            
            # Build user profile
            # Handle timestamp parsing gracefully
            created_at = user_data.get('createdAt')
            updated_at = user_data.get('updatedAt')
            
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            elif not isinstance(created_at, datetime):
                created_at = datetime.utcnow()
                
            if isinstance(updated_at, str):
                updated_at = datetime.fromisoformat(updated_at.replace('Z', '+00:00'))
            elif not isinstance(updated_at, datetime):
                updated_at = datetime.utcnow()
            
            user_profile = UserProfile(
                userId=user_data['userId'],
                email=user_data['email'],
                firstName=user_data['firstName'],
                lastName=user_data['lastName'],
                emailVerified=email_verified,
                mfaEnabled=user_data.get('mfaEnabled', False),
                phoneNumber=user_data.get('phoneNumber'),
                dateOfBirth=user_data.get('dateOfBirth'),
                timezone=user_data.get('timezone'),
                preferences=user_data.get('preferences'),
                createdAt=created_at,
                updatedAt=updated_at
            )
            
            # Build login response
            login_response = LoginResponse(
                accessToken=auth_result['accessToken'],
                refreshToken=auth_result['refreshToken'],
                tokenType=auth_result['tokenType'],
                expiresIn=auth_result['expiresIn'],
                user=user_profile
            )
            
            logger.info(
                "User login successful",
                extra={
                    "userId": user_data['userId'],
                    "email": request.email,
                    "mfaEnabled": user_profile.mfaEnabled
                }
            )
            
            return login_response
            
        except (InvalidCredentialsError, UserNotFoundError, MfaRequiredError):
            # Re-raise known errors
            raise
        except Exception as e:
            logger.error(
                "Unexpected error during login",
                extra={
                    "email": request.email,
                    "error": str(e),
                    "error_type": type(e).__name__
                }
            )
            raise LoginError(
                "An error occurred during login. Please try again.",
                {"original_error": str(e)}
            )
