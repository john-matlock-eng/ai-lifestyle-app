"""
Repository layer for user profile operations.
"""

import os
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import boto3
from aws_lambda_powertools import Logger
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

logger = Logger()


class UserProfileRepository:
    """Handles user profile data persistence."""

    def __init__(self):
        self.dynamodb = boto3.resource("dynamodb")
        self.table_name = os.environ.get("USERS_TABLE_NAME", "users-dev")
        self.table = self.dynamodb.Table(self.table_name)

    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user from DynamoDB.

        Args:
            user_id: User's unique identifier

        Returns:
            User data or None if not found
        """
        try:
            response = self.table.get_item(Key={"pk": f"USER#{user_id}", "sk": f"USER#{user_id}"})

            return response.get("Item")

        except ClientError as e:
            logger.error(f"Failed to get user: {str(e)}")
            raise

    def update_user(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update user in DynamoDB.

        Args:
            user_id: User's unique identifier
            updates: Fields to update

        Returns:
            Updated user data
        """
        try:
            # Build update expression
            update_expression_parts = []
            expression_attribute_names = {}
            expression_attribute_values = {}

            # Map API field names to DynamoDB field names
            field_mapping = {
                "firstName": "first_name",
                "lastName": "last_name",
                "phoneNumber": "phone_number",
                "dateOfBirth": "date_of_birth",
                "timezone": "timezone",
                "preferences": "preferences",
                "encryptionEnabled": "encryption_enabled",
                "encryptionSetupDate": "encryption_setup_date",
                "encryptionKeyId": "encryption_key_id",
            }

            for api_field, value in updates.items():
                if value is not None:
                    db_field = field_mapping.get(api_field, api_field)
                    # Use placeholder for reserved words or fields with special characters
                    placeholder = f"#{api_field}"
                    value_placeholder = f":{api_field}"

                    update_expression_parts.append(f"{placeholder} = {value_placeholder}")
                    expression_attribute_names[placeholder] = db_field

                    # Convert datetime to ISO string
                    if isinstance(value, datetime):
                        value = value.isoformat()

                    expression_attribute_values[value_placeholder] = value

            # Always update the updated_at timestamp
            update_expression_parts.append("#updated_at = :updated_at")
            expression_attribute_names["#updated_at"] = "updated_at"
            expression_attribute_values[":updated_at"] = datetime.now(timezone.utc).isoformat()

            # Execute update
            response = self.table.update_item(
                Key={"pk": f"USER#{user_id}", "sk": f"USER#{user_id}"},
                UpdateExpression="SET " + ", ".join(update_expression_parts),
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values,
                ReturnValues="ALL_NEW",
            )

            return response["Attributes"]

        except ClientError as e:
            logger.error(f"Failed to update user: {str(e)}")
            raise
