"""
Repository layer for user data access.
"""

from typing import Any, Dict, Optional

import boto3
from aws_lambda_powertools import Logger
from botocore.exceptions import ClientError

from .errors import DatabaseError, UserNotFoundError

logger = Logger()


class UserRepository:
    """Repository for user data access operations."""

    def __init__(self, table_name: str):
        """
        Initialize the user repository.

        Args:
            table_name: DynamoDB table name
        """
        self.table_name = table_name
        self.dynamodb = boto3.resource("dynamodb")
        self.table = self.dynamodb.Table(table_name)

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user by ID from DynamoDB.

        Args:
            user_id: User ID to retrieve

        Returns:
            User data if found, None otherwise

        Raises:
            DatabaseError: If database operation fails
        """
        try:
            response = self.table.get_item(Key={"PK": f"USER#{user_id}", "SK": "PROFILE"})

            item = response.get("Item")

            if not item:
                logger.info(f"User not found: {user_id}")
                return None

            # Transform DynamoDB item to user data
            user_data = {
                "userId": item.get("userId", user_id),
                "email": item.get("email"),
                "firstName": item.get("firstName"),
                "lastName": item.get("lastName"),
                "publicKey": item.get("publicKey"),
                "createdAt": item.get("createdAt"),
                "updatedAt": item.get("updatedAt"),
            }

            return user_data

        except ClientError as e:
            logger.error(
                "DynamoDB error while getting user",
                extra={
                    "error": str(e),
                    "user_id": user_id,
                    "error_code": e.response["Error"]["Code"],
                },
            )

            raise DatabaseError(
                message="Failed to retrieve user from database",
                details={
                    "error": e.response["Error"]["Code"],
                    "message": e.response["Error"]["Message"],
                },
            )
        except Exception as e:
            logger.error(
                "Unexpected error while getting user", extra={"error": str(e), "user_id": user_id}
            )

            raise DatabaseError(message="Unexpected database error", details={"error": str(e)})
