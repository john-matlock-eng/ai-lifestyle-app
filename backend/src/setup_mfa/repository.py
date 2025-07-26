"""
Repository layer for MFA data storage in DynamoDB.
"""

import os
from datetime import datetime
from typing import Any, Dict, Optional

import boto3
from aws_lambda_powertools import Logger
from botocore.exceptions import ClientError

from .errors import DatabaseError

logger = Logger()


class MFARepository:
    """Handles MFA data storage in DynamoDB."""

    def __init__(self):
        self.dynamodb = boto3.resource("dynamodb")
        self.table_name = os.environ.get("USERS_TABLE_NAME", "users")
        self.table = self.dynamodb.Table(self.table_name)

    def store_mfa_secret(
        self, user_id: str, encrypted_secret: str, iv: str, backup_codes: list[str]
    ) -> None:
        """
        Store encrypted MFA secret and backup codes.

        Args:
            user_id: User's unique identifier
            encrypted_secret: Encrypted TOTP secret
            iv: Initialization vector for decryption
            backup_codes: List of backup codes

        Raises:
            DatabaseError: If storage fails
        """
        try:
            # Store MFA data as a separate item
            mfa_item = {
                "pk": f"USER#{user_id}",
                "sk": "MFA#SECRET",
                "entity_type": "MFA_SECRET",
                "encrypted_secret": encrypted_secret,
                "iv": iv,
                "backup_codes": backup_codes,
                "backup_codes_used": [],  # Track which codes have been used
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }

            self.table.put_item(Item=mfa_item)

            logger.info(f"Stored MFA secret for user {user_id}")

        except ClientError as e:
            logger.error(f"Failed to store MFA secret: {str(e)}")
            raise DatabaseError(f"Failed to store MFA secret: {str(e)}")

    def get_mfa_secret(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve MFA secret for user.

        Args:
            user_id: User's unique identifier

        Returns:
            MFA data if exists, None otherwise

        Raises:
            DatabaseError: If retrieval fails
        """
        try:
            response = self.table.get_item(Key={"pk": f"USER#{user_id}", "sk": "MFA#SECRET"})

            return response.get("Item")

        except ClientError as e:
            logger.error(f"Failed to get MFA secret: {str(e)}")
            raise DatabaseError(f"Failed to retrieve MFA secret: {str(e)}")

    def update_user_mfa_status(self, user_id: str, mfa_enabled: bool) -> None:
        """
        Update user's MFA status in the main user record.

        Args:
            user_id: User's unique identifier
            mfa_enabled: Whether MFA is enabled

        Raises:
            DatabaseError: If update fails
        """
        try:
            self.table.update_item(
                Key={"pk": f"USER#{user_id}", "sk": f"USER#{user_id}"},
                UpdateExpression="SET mfa_enabled = :mfa, updated_at = :updated",
                ExpressionAttributeValues={
                    ":mfa": mfa_enabled,
                    ":updated": datetime.utcnow().isoformat(),
                },
            )

            logger.info(f"Updated MFA status for user {user_id} to {mfa_enabled}")

        except ClientError as e:
            logger.error(f"Failed to update MFA status: {str(e)}")
            raise DatabaseError(f"Failed to update MFA status: {str(e)}")

    def delete_mfa_secret(self, user_id: str) -> None:
        """
        Delete MFA secret for user.

        Args:
            user_id: User's unique identifier

        Raises:
            DatabaseError: If deletion fails
        """
        try:
            self.table.delete_item(Key={"pk": f"USER#{user_id}", "sk": "MFA#SECRET"})

            logger.info(f"Deleted MFA secret for user {user_id}")

        except ClientError as e:
            logger.error(f"Failed to delete MFA secret: {str(e)}")
            raise DatabaseError(f"Failed to delete MFA secret: {str(e)}")

    def check_user_exists(self, user_id: str) -> bool:
        """
        Check if user exists in database.

        Args:
            user_id: User's unique identifier

        Returns:
            True if user exists, False otherwise
        """
        try:
            response = self.table.get_item(Key={"pk": f"USER#{user_id}", "sk": f"USER#{user_id}"})

            return "Item" in response

        except ClientError:
            return False
