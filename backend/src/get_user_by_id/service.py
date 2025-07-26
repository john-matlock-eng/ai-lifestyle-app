"""
Service layer for get user by ID functionality.
"""

import jwt
from aws_lambda_powertools import Logger

from user_profile_common import UserPublicInfo

from .cognito_client import CognitoClient
from .errors import (
    InvalidTokenError,
    TokenExpiredError,
    UnauthorizedError,
    UserNotFoundError,
    ValidationError,
)
from .repository import UserRepository

logger = Logger()


class UserService:
    """Service layer for user operations."""

    def __init__(self, repository: UserRepository, cognito_client: CognitoClient):
        """
        Initialize the user service.

        Args:
            repository: User repository instance
            cognito_client: Cognito client instance
        """
        self.repository = repository
        self.cognito_client = cognito_client

    def verify_auth_token(self, auth_header: str) -> str:
        """
        Verify the authorization token and extract user ID.

        Args:
            auth_header: Authorization header value

        Returns:
            User ID from the token

        Raises:
            UnauthorizedError: If token is invalid
            TokenExpiredError: If token is expired
        """
        # Extract bearer token
        if not auth_header.startswith("Bearer "):
            raise UnauthorizedError(
                message="Invalid authorization header format",
                details={"expected": "Bearer <token>"},
            )

        token = auth_header[7:]  # Remove 'Bearer ' prefix

        if not token:
            raise UnauthorizedError(message="Missing token in authorization header")

        try:
            # Verify token with Cognito
            token_claims = self.cognito_client.verify_token(token)
            return token_claims.get("sub")  # Return user ID

        except TokenExpiredError:
            raise
        except InvalidTokenError:
            raise
        except Exception as e:
            logger.error(f"Token verification failed: {str(e)}")
            raise UnauthorizedError(message="Token verification failed", details={"error": str(e)})

    def get_user_public_info(self, user_id: str) -> UserPublicInfo:
        """
        Get public information for a user.

        Args:
            user_id: The user ID to look up

        Returns:
            Public user information

        Raises:
            UserNotFoundError: If user doesn't exist
            ValidationError: If user_id is invalid
        """
        # Validate user ID format (Cognito IDs are UUIDs)
        if not self._is_valid_user_id(user_id):
            raise ValidationError(message="Invalid user ID format", details={"user_id": user_id})

        try:
            # Get user from database
            user_data = self.repository.get_user_by_id(user_id)

            if not user_data:
                raise UserNotFoundError(message="User not found", details={"user_id": user_id})

            # Return only public information
            return UserPublicInfo(
                userId=user_data["userId"],
                email=user_data.get("email", ""),
                firstName=user_data.get("firstName"),
                lastName=user_data.get("lastName"),
                hasEncryption=bool(user_data.get("publicKey")),
            )

        except UserNotFoundError:
            raise
        except Exception as e:
            logger.error(f"Failed to get user info: {str(e)}")
            raise

    def _is_valid_user_id(self, user_id: str) -> bool:
        """
        Validate user ID format (UUID).

        Args:
            user_id: User ID to validate

        Returns:
            True if valid, False otherwise
        """
        import re

        uuid_pattern = re.compile(
            r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.IGNORECASE
        )
        return bool(uuid_pattern.match(user_id))
