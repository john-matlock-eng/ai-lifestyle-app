"""
Service layer for retrieving a journal entry.
"""

import os
from datetime import datetime
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from aws_lambda_powertools import Logger

from encryption_common import Share, ShareRepository
from journal_common import JournalEntry, JournalRepository

logger = Logger()


class GetJournalEntryService:
    """Handles journal entry retrieval business logic."""

    def __init__(self):
        self.repository = JournalRepository()
        # Initialize ShareRepository with the same table
        table_name = os.environ.get("TABLE_NAME") or os.environ.get("MAIN_TABLE_NAME")
        if not table_name:
            raise ValueError("TABLE_NAME or MAIN_TABLE_NAME environment variable not set")
        self.share_repository = ShareRepository(table_name)

    def get_entry(self, user_id: str, entry_id: str) -> Dict[str, Any]:
        """
        Get a journal entry by ID. Handles both owner and shared access.

        Args:
            user_id: User's unique identifier (from JWT)
            entry_id: Journal entry ID

        Returns:
            Dict containing journal entry and optional share access info

        Raises:
            ValueError: If entry not found or access denied
            Exception: For other errors
        """
        try:
            # First try to get as owner
            entry = self.repository.get_entry(user_id, entry_id)

            if entry:
                # User is the owner
                logger.info(f"Owner {user_id} accessing journal entry {entry_id}")
                return entry.model_dump(by_alias=True, mode="json")

            # Not the owner, check for shared access
            # Find active share for this user
            share = self.share_repository.find_active_share(
                item_type="journal", item_id=entry_id, recipient_id=user_id
            )

            if not share:
                logger.warning(
                    f"User {user_id} attempted to access journal {entry_id} - not found or not shared"
                )
                raise ValueError("Journal entry not found")

            # Check permissions
            if "read" not in share.permissions:
                logger.warning(f"User {user_id} lacks read permission for journal {entry_id}")
                raise ValueError("Insufficient permissions")

            # Now get the actual entry using the owner's ID
            entry = self.repository.get_entry(share.owner_id, entry_id)

            if not entry:
                logger.error(f"Share {share.share_id} references non-existent journal {entry_id}")
                raise ValueError("Journal entry not found")

            logger.info(
                f"User {user_id} accessing shared journal {entry_id} via share {share.share_id}"
            )

            # Update share access tracking
            self.share_repository.update_share_access(share.share_id, user_id)

            # Build response with share information
            response = entry.model_dump(by_alias=True, mode="json")

            # Add share access information
            response["shareAccess"] = {
                "shareId": share.share_id,
                "permissions": share.permissions,
                "expiresAt": share.expires_at.isoformat() if share.expires_at else None,
            }

            # CRITICAL: Override the encrypted key with the one from the share
            # This is the key re-encrypted for the recipient
            if share.encrypted_key:
                response["encryptedKey"] = share.encrypted_key

            return response

        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to get journal entry: {str(e)}")
            raise Exception(f"Failed to get journal entry: {str(e)}")
