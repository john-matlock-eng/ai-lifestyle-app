"""
Repository layer for MFA login data operations.
"""

import os
from datetime import datetime
from typing import Any, Dict, Optional

import boto3
from aws_lambda_powertools import Logger
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

from .errors import DatabaseError

logger = Logger()


class MFALoginRepository:
    """Handles data operations for MFA login."""

    def __init__(self):
        self.dynamodb = boto3.resource("dynamodb")
        self.table_name = os.environ.get("USERS_TABLE_NAME", "users")
        self.table = self.dynamodb.Table(self.table_name)

    def get_user_by_cognito_id(self, cognito_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user data by Cognito ID.

        Args:
            cognito_id: User's Cognito ID (sub)

        Returns:
            User data if found, None otherwise

        Raises:
            DatabaseError: If retrieval fails
        """
        try:
            response = self.table.get_item(
                Key={"pk": f"USER#{cognito_id}", "sk": f"USER#{cognito_id}"}
            )

            item = response.get("Item")
            if item:
                # Update last login
                self._update_last_login(cognito_id)

            return item

        except ClientError as e:
            logger.error(f"Failed to get user data: {str(e)}")
            raise DatabaseError(f"Failed to retrieve user data: {str(e)}")

    def _update_last_login(self, user_id: str) -> None:
        """
        Update user's last login timestamp.

        Args:
            user_id: User's ID
        """
        try:
            self.table.update_item(
                Key={"pk": f"USER#{user_id}", "sk": f"USER#{user_id}"},
                UpdateExpression="SET last_login = :now, updated_at = :now",
                ExpressionAttributeValues={":now": datetime.utcnow().isoformat()},
            )
        except Exception as e:
            # Don't fail login if update fails
            logger.warning(f"Failed to update last login: {str(e)}")

    def record_mfa_login(self, user_id: str, success: bool) -> None:
        """
        Record MFA login attempt for audit.

        Args:
            user_id: User's ID
            success: Whether login was successful
        """
        try:
            event_type = "mfa_login_success" if success else "mfa_login_failed"

            self.table.put_item(
                Item={
                    "pk": f"USER#{user_id}",
                    "sk": f"EVENT#{event_type}#{datetime.utcnow().isoformat()}",
                    "entity_type": "LOGIN_EVENT",
                    "event_type": event_type,
                    "timestamp": datetime.utcnow().isoformat(),
                    "mfa_used": True,
                }
            )
        except Exception as e:
            # Don't fail login if audit fails
            logger.warning(f"Failed to record MFA login event: {str(e)}")

    def increment_failed_mfa_attempts(self, user_id: str) -> int:
        """
        Increment failed MFA attempts counter.

        Args:
            user_id: User's ID

        Returns:
            New count of failed attempts
        """
        try:
            response = self.table.update_item(
                Key={"pk": f"USER#{user_id}", "sk": f"USER#{user_id}"},
                UpdateExpression="SET failed_mfa_attempts = if_not_exists(failed_mfa_attempts, :zero) + :one",
                ExpressionAttributeValues={":zero": 0, ":one": 1},
                ReturnValues="ALL_NEW",
            )

            return response["Attributes"].get("failed_mfa_attempts", 0)

        except Exception as e:
            logger.warning(f"Failed to increment MFA attempts: {str(e)}")
            return 0

    def reset_failed_mfa_attempts(self, user_id: str) -> None:
        """
        Reset failed MFA attempts counter.

        Args:
            user_id: User's ID
        """
        try:
            self.table.update_item(
                Key={"pk": f"USER#{user_id}", "sk": f"USER#{user_id}"},
                UpdateExpression="SET failed_mfa_attempts = :zero",
                ExpressionAttributeValues={":zero": 0},
            )
        except Exception as e:
            logger.warning(f"Failed to reset MFA attempts: {str(e)}")
