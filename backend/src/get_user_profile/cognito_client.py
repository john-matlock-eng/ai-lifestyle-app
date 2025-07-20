"""
AWS Cognito client wrapper for user profile operations.
"""

from typing import Any, Dict, Optional

import boto3
from aws_lambda_powertools import Logger
from botocore.exceptions import ClientError

from .errors import CognitoError, InvalidTokenError, TokenExpiredError, UnauthorizedError

logger = Logger()


class CognitoClient:
    """Client for interacting with AWS Cognito."""

    def __init__(self, user_pool_id: str, client_id: str):
        """
        Initialize Cognito client.

        Args:
            user_pool_id: Cognito User Pool ID
            client_id: Cognito App Client ID
        """
        self.user_pool_id = user_pool_id
        self.client_id = client_id
        self.client = boto3.client("cognito-idp")

        logger.info(
            "Cognito client initialized",
            extra={"user_pool_id": user_pool_id, "client_id": client_id},
        )

    def get_user_from_access_token(self, access_token: str) -> Dict[str, Any]:
        """
        Get user information from access token.

        Args:
            access_token: Valid JWT access token

        Returns:
            Dictionary containing user information and attributes

        Raises:
            InvalidTokenError: If access token is invalid
            TokenExpiredError: If access token has expired
            UnauthorizedError: If authentication fails
            CognitoError: For other Cognito errors
        """
        try:
            # Remove 'Bearer ' prefix if present
            if access_token.startswith("Bearer "):
                access_token = access_token[7:]

            # Get user information from Cognito
            response = self.client.get_user(AccessToken=access_token)

            # Extract user data
            user_data = {"username": response["Username"], "attributes": {}}

            # Convert attributes to dictionary
            for attr in response.get("UserAttributes", []):
                user_data["attributes"][attr["Name"]] = attr["Value"]

            # Add MFA status
            user_data["mfa_enabled"] = bool(response.get("UserMFASettingList", []))

            logger.info(
                "Successfully retrieved user from access token",
                extra={
                    "username": user_data["username"],
                    "has_attributes": bool(user_data["attributes"]),
                },
            )

            return user_data

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            error_message = e.response["Error"]["Message"]

            logger.error(
                "Cognito client error while getting user",
                extra={"error_code": error_code, "error_message": error_message},
            )

            # Map Cognito errors to our custom exceptions
            if error_code == "NotAuthorizedException":
                if "Access Token has expired" in error_message:
                    raise TokenExpiredError(
                        "Access token has expired", details={"cognito_error": error_code}
                    )
                else:
                    raise InvalidTokenError(
                        "Invalid access token", details={"cognito_error": error_code}
                    )

            elif error_code == "UserNotFoundException":
                raise UnauthorizedError(
                    "User not found in Cognito", details={"cognito_error": error_code}
                )

            elif error_code == "InvalidParameterException":
                raise InvalidTokenError(
                    "Invalid token format", details={"cognito_error": error_code}
                )

            elif error_code == "TooManyRequestsException":
                raise CognitoError(
                    "Too many requests. Please try again later.",
                    details={"cognito_error": error_code, "retry_after": "60"},
                )

            else:
                # Generic Cognito error
                raise CognitoError(
                    f"Cognito error: {error_message}", details={"cognito_error": error_code}
                )

        except Exception as e:
            logger.exception(
                "Unexpected error while getting user from token", extra={"error": str(e)}
            )
            raise CognitoError("An unexpected error occurred", details={"error": str(e)})

    def verify_token_and_get_user_id(self, access_token: str) -> str:
        """
        Verify access token and extract user ID.

        Args:
            access_token: JWT access token

        Returns:
            User ID (sub claim)

        Raises:
            Various authentication errors
        """
        user_data = self.get_user_from_access_token(access_token)

        # Extract user ID from sub attribute
        user_id = user_data["attributes"].get("sub")
        if not user_id:
            raise CognitoError(
                "User ID not found in token",
                details={"attributes": list(user_data["attributes"].keys())},
            )

        return user_id
