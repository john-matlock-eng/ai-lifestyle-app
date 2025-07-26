"""
Repository layer for user data access in DynamoDB.
"""

from typing import Optional
import os
from datetime import datetime
from uuid import UUID

import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

from .errors import DynamoDBError
from .models import DynamoDBUser


class UserRepository:
    """Repository for user data in DynamoDB"""

    def __init__(self):
        self.dynamodb = boto3.resource("dynamodb")
        self.table_name = os.environ["USERS_TABLE_NAME"]
        self.table = self.dynamodb.Table(self.table_name)

    def create_user(self, user: DynamoDBUser) -> DynamoDBUser:
        """
        Create a new user record in DynamoDB.

        Args:
            user: User data to store

        Returns:
            Created user record

        Raises:
            DynamoDBError: If creation fails
        """
        try:
            # Convert to DynamoDB item format
            item = user.to_dict()

            # Put item with condition that it doesn't already exist
            self.table.put_item(Item=item, ConditionExpression="attribute_not_exists(pk)")

            return user

        except ClientError as e:
            if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
                raise DynamoDBError(
                    f"User {user.user_id} already exists in database", original_error=e
                )
            else:
                raise DynamoDBError(
                    f"Failed to create user in DynamoDB: {e.response['Error']['Code']}",
                    original_error=e,
                )

    def get_user_by_email(self, email: str) -> Optional[DynamoDBUser]:
        """
        Find a user by email address using GSI.

        Args:
            email: Email address to search for

        Returns:
            User record if found, None otherwise

        Raises:
            DynamoDBError: If query fails
        """
        try:
            response = self.table.query(
                IndexName="EmailIndex", KeyConditionExpression=Key("gsi1_pk").eq(f"EMAIL#{email}")
            )

            items = response.get("Items", [])
            if not items:
                return None

            # Convert DynamoDB item to model
            item = items[0]
            return DynamoDBUser(
                pk=item["pk"],
                sk=item["sk"],
                user_id=UUID(item["user_id"]),
                email=item["email"],
                first_name=item["first_name"],
                last_name=item["last_name"],
                email_verified=item.get("email_verified", False),
                mfa_enabled=item.get("mfa_enabled", False),
                created_at=datetime.fromisoformat(item["created_at"]),
                updated_at=datetime.fromisoformat(item["updated_at"]),
                entity_type=item.get("entity_type", "USER"),
                gsi1_pk=item.get("gsi1_pk"),
                gsi1_sk=item.get("gsi1_sk"),
            )

        except ClientError as e:
            raise DynamoDBError(
                f"Failed to query user by email: {e.response['Error']['Code']}", original_error=e
            )

    def delete_user(self, user_id: UUID) -> None:
        """
        Delete a user from DynamoDB (used for rollback).

        Args:
            user_id: User ID to delete
        """
        try:
            self.table.delete_item(Key={"pk": f"USER#{str(user_id)}",
                "sk": f"USER#{str(user_id)}"})
        except ClientError:
            # Ignore errors during cleanup
            pass
