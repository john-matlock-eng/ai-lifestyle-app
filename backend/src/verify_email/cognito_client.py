"""
Cognito client wrapper for email verification operations.
"""

import os
from typing import Optional

import boto3
from aws_lambda_powertools import Logger
from botocore.exceptions import ClientError

from .errors import (
    AlreadyVerifiedError,
    CognitoError,
    InvalidTokenError,
    TokenExpiredError,
    UserNotFoundError,
)

logger = Logger()


class CognitoClient:
    """Wrapper for AWS Cognito operations related to email verification."""

    def __init__(self):
        self.client = boto3.client("cognito-idp")
        self.user_pool_id = os.environ.get("COGNITO_USER_POOL_ID")
        self.client_id = os.environ.get("COGNITO_CLIENT_ID")

        if not self.user_pool_id or not self.client_id:
            raise ValueError("Missing required Cognito configuration")

    def verify_email(self, username: str, confirmation_code: str) -> None:
        """
        Verify user's email address using confirmation code.

        Args:
            username: User's email address (username in Cognito)
            confirmation_code: Verification code from email

        Raises:
            InvalidTokenError: If code is invalid
            TokenExpiredError: If code has expired
            AlreadyVerifiedError: If email is already verified
            UserNotFoundError: If user doesn't exist
            CognitoError: For other Cognito errors
        """
        try:
            # Confirm the signup with the verification code
            self.client.confirm_sign_up(
                ClientId=self.client_id, Username=username, ConfirmationCode=confirmation_code
            )

            logger.info(f"Email verified successfully for user: {username}")

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            error_message = e.response["Error"]["Message"]

            logger.error(f"Cognito error during email verification: {error_code} - {error_message}")

            if error_code == "CodeMismatchException":
                raise InvalidTokenError("Invalid verification code")
            elif error_code == "ExpiredCodeException":
                raise TokenExpiredError("Verification code has expired. Please request a new one.")
            elif error_code == "NotAuthorizedException":
                # This usually means the user is already confirmed
                raise AlreadyVerifiedError()
            elif error_code == "UserNotFoundException":
                raise UserNotFoundError()
            elif error_code == "AliasExistsException":
                # Email already exists and is verified
                raise AlreadyVerifiedError()
            else:
                raise CognitoError(f"Failed to verify email: {error_message}")

    def resend_verification_code(self, username: str) -> None:
        """
        Resend verification code to user's email.

        Args:
            username: User's email address (username in Cognito)

        Raises:
            AlreadyVerifiedError: If email is already verified
            UserNotFoundError: If user doesn't exist
            CognitoError: For other Cognito errors
        """
        try:
            self.client.resend_confirmation_code(ClientId=self.client_id, Username=username)

            logger.info(f"Verification code resent to user: {username}")

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            error_message = e.response["Error"]["Message"]

            logger.error(f"Cognito error during code resend: {error_code} - {error_message}")

            if error_code == "UserNotFoundException":
                raise UserNotFoundError()
            elif (
                error_code == "InvalidParameterException"
                and "already confirmed" in error_message.lower()
            ):
                raise AlreadyVerifiedError()
            else:
                raise CognitoError(f"Failed to resend verification code: {error_message}")

    def get_user_verification_status(self, username: str) -> bool:
        """
        Check if user's email is already verified.

        Args:
            username: User's email address

        Returns:
            True if email is verified, False otherwise

        Raises:
            UserNotFoundError: If user doesn't exist
            CognitoError: For other Cognito errors
        """
        try:
            response = self.client.admin_get_user(UserPoolId=self.user_pool_id, Username=username)

            # Check UserStatus - CONFIRMED means email is verified
            user_status = response.get("UserStatus", "")

            # Also check email_verified attribute
            for attr in response.get("UserAttributes", []):
                if attr["Name"] == "email_verified":
                    return attr["Value"].lower() == "true"

            # If no email_verified attribute, check UserStatus
            return user_status == "CONFIRMED"

        except ClientError as e:
            error_code = e.response["Error"]["Code"]

            if error_code == "UserNotFoundException":
                raise UserNotFoundError()
            else:
                raise CognitoError(f"Failed to get user status: {e.response['Error']['Message']}")
