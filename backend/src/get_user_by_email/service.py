"""
Service for retrieving users by email address.
"""

import os
from typing import Any, Dict, Optional

import boto3
from boto3.dynamodb.conditions import Key
from aws_lambda_powertools import Logger, Tracer

logger = Logger()
tracer = Tracer()


class GetUserByEmailService:
    """Service for getting user information by email."""

    def __init__(self):
        """Initialize the service with DynamoDB client."""
        self.dynamodb = boto3.resource("dynamodb")
        self.table_name = os.environ.get(
            "TABLE_NAME", os.environ.get("MAIN_TABLE_NAME", "ai-lifestyle-dev")
        )
        self.table = self.dynamodb.Table(self.table_name)

    @tracer.capture_method
    def get_user_by_email(self, email: str) -> Dict[str, Any]:
        """
        Get user information by email address.

        Args:
            email: User's email address (case-insensitive)

        Returns:
            Dict containing user information

        Raises:
            ValueError: If user not found
        """
        # Normalize email to lowercase
        email = email.lower().strip()

        # Query using the EmailIndex GSI
        # The GSI uses gsi1_pk = 'EMAIL#{email}' and gsi1_sk = 'EMAIL#{email}'
        try:
            response = self.table.query(
                IndexName="EmailIndex",
                KeyConditionExpression=Key("gsi1_pk").eq(f"EMAIL#{email}")
                & Key("gsi1_sk").eq(f"EMAIL#{email}"),
                Limit=1,
            )

            if not response.get("Items"):
                raise ValueError(f"User with email {email} not found")

            user_item = response["Items"][0]

            # Extract user ID from pk (format: USER#<userId>)
            user_id = user_item["pk"].split("#")[1]

            # Check if user has encryption set up
            has_encryption = self._check_encryption_status(user_id)

            # Return user data needed for sharing
            # Build display name from first/last name or email
            first_name = user_item.get("first_name", "")
            last_name = user_item.get("last_name", "")
            display_name = (
                f"{first_name} {last_name}".strip()
                if (first_name or last_name)
                else email.split("@")[0]
            )

            return {
                "userId": user_id,
                "email": email,
                "displayName": display_name,
                "firstName": first_name,
                "lastName": last_name,
                "hasEncryption": has_encryption,
                "createdAt": user_item.get("created_at"),
            }

        except Exception as e:
            logger.error(f"Error querying user by email: {str(e)}")
            raise

    @tracer.capture_method
    def _check_encryption_status(self, user_id: str) -> bool:
        """
        Check if user has encryption set up.

        Args:
            user_id: User's ID

        Returns:
            True if user has encryption set up, False otherwise
        """
        try:
            # Check for encryption setup in the user's record
            response = self.table.get_item(Key={"pk": f"USER#{user_id}", "sk": "ENCRYPTION"})

            return "Item" in response

        except Exception as e:
            logger.warning(f"Error checking encryption status: {str(e)}")
            return False


# Lambda handler initialization
service = GetUserByEmailService()
