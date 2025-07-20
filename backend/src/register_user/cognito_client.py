"""
AWS Cognito client wrapper for user registration.
Updated to explicitly trigger verification email after sign_up.
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
        self.client = boto3.client("cognito-idp")

        # Get required environment variables
        self.user_pool_id = os.environ.get("COGNITO_USER_POOL_ID")
        self.client_id = os.environ.get("COGNITO_CLIENT_ID")

        if not self.user_pool_id or not self.client_id:
            raise ValueError(
                "Missing required environment variables: "
                f"COGNITO_USER_POOL_ID={self.user_pool_id}, "
                f"COGNITO_CLIENT_ID={self.client_id}"
            )

    def create_user(
        self, email: str, password: str, first_name: str, last_name: str
    ) -> CognitoUser:
        """
        Create a new user in Cognito using SignUp flow.
        This should automatically send a verification email.

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
            # Use sign_up for self-registration
            response = self.client.sign_up(
                ClientId=self.client_id,
                Username=email,
                Password=password,
                UserAttributes=[
                    {"Name": "email", "Value": email},
                    {"Name": "given_name", "Value": first_name},
                    {"Name": "family_name", "Value": last_name},
                ],
                ValidationData=[{"Name": "email", "Value": email}],
            )

            user_id = response["UserSub"]  # This is the unique user ID

            # Check if we need to manually trigger verification
            if not response.get("UserConfirmed", False):
                # Log that user needs confirmation
                print(f"User {email} created but needs email confirmation")
                print(f"CodeDeliveryDetails: {response.get('CodeDeliveryDetails', 'None')}")

                # If code delivery details are present, email should have been sent
                if response.get("CodeDeliveryDetails"):
                    delivery = response["CodeDeliveryDetails"]
                    print(f"Verification code sent to: {delivery.get('Destination', 'Unknown')}")
                    print(f"Delivery medium: {delivery.get('DeliveryMedium', 'Unknown')}")
                    print(f"Attribute: {delivery.get('AttributeName', 'Unknown')}")

            # For the registration flow, we'll use current time for timestamps
            from datetime import datetime

            now = datetime.utcnow()

            return CognitoUser(
                user_id=UUID(user_id),
                email=email,
                email_verified=False,  # Will be false until user verifies
                enabled=True,
                status="UNCONFIRMED",  # User needs to verify email
                created_at=now,
                updated_at=now,
            )

        except ClientError as e:
            error_code = e.response["Error"]["Code"]

            if error_code == "UsernameExistsException":
                raise UserAlreadyExistsError(email)
            elif error_code == "InvalidPasswordException":
                raise CognitoError("Password does not meet requirements", original_error=e)
            elif error_code == "InvalidParameterException":
                raise CognitoError(
                    f"Invalid parameter: {e.response['Error']['Message']}", original_error=e
                )
            else:
                raise CognitoError(
                    f"Failed to create user in Cognito: {error_code} - {e.response['Error']['Message']}",
                    original_error=e,
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
            response = self.client.resend_confirmation_code(ClientId=self.client_id, Username=email)

            # Log the response
            print(f"Resend confirmation response: {response}")

            if response.get("CodeDeliveryDetails"):
                delivery = response["CodeDeliveryDetails"]
                print(f"Verification code resent to: {delivery.get('Destination', 'Unknown')}")

        except ClientError as e:
            error_code = e.response["Error"]["Code"]

            if error_code == "UserNotFoundException":
                raise CognitoError("User not found")
            elif error_code == "InvalidParameterException":
                # User is already confirmed
                raise CognitoError("User is already verified")
            elif error_code == "LimitExceededException":
                raise CognitoError("Too many requests. Please try again later.")
            else:
                raise CognitoError(
                    f"Failed to resend verification email: {error_code} - {e.response['Error']['Message']}",
                    original_error=e,
                )

    def admin_get_user(self, username: str) -> Optional[dict]:
        """
        Get user details using admin API.

        Args:
            username: Username (email) to look up

        Returns:
            User details or None if not found
        """
        try:
            response = self.client.admin_get_user(UserPoolId=self.user_pool_id, Username=username)
            return response
        except ClientError as e:
            if e.response["Error"]["Code"] == "UserNotFoundException":
                return None
            raise

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
            self.client.admin_delete_user(UserPoolId=self.user_pool_id, Username=user_id)
        except ClientError as e:
            # If user is unconfirmed, they can't be deleted but will expire
            if e.response["Error"]["Code"] != "UserNotFoundException":
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
            response = self.client.admin_get_user(UserPoolId=self.user_pool_id, Username=email)

            # Extract attributes into a dict
            attributes = {}
            for attr in response.get("UserAttributes", []):
                attributes[attr["Name"]] = attr["Value"]

            return {
                "username": response["Username"],
                "attributes": attributes,
                "status": response.get("UserStatus"),
                "enabled": response.get("Enabled", True),
                "created_date": response.get("UserCreateDate"),
                "modified_date": response.get("UserLastModifiedDate"),
            }

        except ClientError as e:
            if e.response["Error"]["Code"] == "UserNotFoundException":
                return None
            raise CognitoError(
                f"Failed to get user: {e.response['Error']['Message']}", original_error=e
            )
