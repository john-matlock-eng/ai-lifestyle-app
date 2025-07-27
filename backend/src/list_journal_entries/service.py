"""
Service layer for listing journal entries.
"""

import os
from datetime import datetime
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import boto3
from aws_lambda_powertools import Logger

from encryption_common import ShareRepository
from journal_common import JournalEntry, JournalListResponse, JournalRepository

logger = Logger()


class ListJournalEntriesService:
    """Handles journal entry listing business logic."""

    def __init__(self):
        self.repository = JournalRepository()
        # Initialize ShareRepository
        table_name = os.environ.get("TABLE_NAME") or os.environ.get("MAIN_TABLE_NAME")
        if not table_name:
            raise ValueError("TABLE_NAME or MAIN_TABLE_NAME environment variable not set")
        self.share_repository = ShareRepository(table_name)
        self.dynamodb = boto3.resource("dynamodb")
        self.table = self.dynamodb.Table(table_name)

    def list_entries(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
        goal_id: Optional[str] = None,
        filter_type: str = "owned",
    ) -> Dict[str, Any]:
        """
        List journal entries for a user, including shared entries.

        Args:
            user_id: User's unique identifier
            page: Page number (1-based)
            limit: Maximum number of entries to return
            goal_id: Optional goal ID to filter by
            filter_type: 'owned', 'shared-with-me', 'shared-by-me', 'all'

        Returns:
            Dict with entries and metadata, including share info
        """
        try:
            # Validate pagination
            if page < 1:
                page = 1
            if limit < 1 or limit > 100:
                limit = 20

            all_entries = []

            # Handle different filter types
            if filter_type in ["owned", "all"]:
                # Get user's own entries
                owned_entries = self._get_owned_entries(user_id, goal_id)
                all_entries.extend(owned_entries)

            if filter_type in ["shared-by-me", "all"]:
                # Get entries shared by the user
                shared_by_me = self._get_shared_by_me_entries(user_id)
                all_entries.extend(shared_by_me)

            if filter_type in ["shared-with-me", "all"]:
                # Get entries shared with the user
                shared_with_me = self._get_shared_with_me_entries(user_id)
                all_entries.extend(shared_with_me)

            # Remove duplicates (in case of 'all' filter)
            seen = set()
            unique_entries = []
            for entry in all_entries:
                entry_id = (
                    entry.get("entry", entry).get("entryId")
                    if isinstance(entry, dict) and "entry" in entry
                    else entry.get("entryId")
                )
                if entry_id not in seen:
                    seen.add(entry_id)
                    unique_entries.append(entry)

            # Sort by creation date (newest first)
            unique_entries.sort(key=lambda x: x.get("entry", x).get("createdAt", ""), reverse=True)

            # Apply pagination
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            paginated_entries = unique_entries[start_idx:end_idx]

            # Determine if there are more entries
            has_more = len(unique_entries) > end_idx

            # Build response
            response = {
                "entries": paginated_entries,
                "total": len(unique_entries),
                "page": page,
                "limit": limit,
                "hasMore": has_more,
                "filter": filter_type,
            }

            logger.info(
                f"Listed {len(paginated_entries)} journal entries for user {user_id} (page {page}, "
                f"filter: {filter_type})"
            )

            return response

        except Exception as e:
            logger.error(f"Failed to list journal entries: {str(e)}")
            raise Exception(f"Failed to list journal entries: {str(e)}")

    def _get_owned_entries(
        self, user_id: str, goal_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get entries owned by the user."""
        try:
            entries = []
            last_evaluated_key = None

            while True:
                entries_batch, next_key = self.repository.list_user_entries(
                    user_id=user_id,
                    limit=100,
                    last_evaluated_key=last_evaluated_key,
                    goal_id=goal_id,
                )

                # Convert to dict format
                for entry in entries_batch:
                    entries.append(entry.model_dump(by_alias=True, mode="json"))

                if not next_key:
                    break
                last_evaluated_key = next_key

            return entries

        except Exception as e:
            logger.error(f"Failed to get owned entries: {str(e)}")
            return []

    def _get_shared_by_me_entries(self, user_id: str) -> List[Dict[str, Any]]:
        """Get entries shared by the user with share info."""
        try:
            # Get all shares created by the user
            shares = self.share_repository.get_shares_by_owner(
                owner_id=user_id, item_type="journal", active_only=True
            )

            shared_entries = []

            for share in shares:
                # Get the journal entry
                entry = self.repository.get_entry(user_id, share.item_id)
                if entry:
                    # Get recipient info
                    recipient_info = self._get_user_info(share.recipient_id)

                    shared_entries.append(
                        {
                            "entry": entry.model_dump(by_alias=True, mode="json"),
                            "shareInfo": {
                                "shareId": share.share_id,
                                "sharedAt": share.created_at.isoformat(),
                                "sharedWith": recipient_info.get("email", share.recipient_id),
                                "permissions": share.permissions,
                                "expiresAt": (
                                    share.expires_at.isoformat() if share.expires_at else None
                                ),
                            },
                            "isIncoming": False,
                        }
                    )

            return shared_entries

        except Exception as e:
            logger.error(f"Failed to get shared by me entries: {str(e)}")
            return []

    def _get_shared_with_me_entries(self, user_id: str) -> List[Dict[str, Any]]:
        """Get entries shared with the user, including re-encrypted keys."""
        try:
            # Get all shares for the user
            shares = self.share_repository.get_shares_for_recipient(
                recipient_id=user_id, item_type="journal", active_only=True
            )

            shared_entries = []

            for share in shares:
                # Get the journal entry using owner's ID
                entry = self.repository.get_entry(share.owner_id, share.item_id)
                if entry:
                    # Get owner info
                    owner_info = self._get_user_info(share.owner_id)

                    # Convert entry to dict
                    entry_dict = entry.model_dump(by_alias=True, mode="json")

                    # CRITICAL: Override the encrypted key with the re-encrypted one
                    if share.encrypted_key:
                        entry_dict["encryptedKey"] = share.encrypted_key

                    shared_entries.append(
                        {
                            "entry": entry_dict,
                            "shareInfo": {
                                "shareId": share.share_id,
                                "sharedAt": share.created_at.isoformat(),
                                "sharedBy": owner_info.get("email", share.owner_id),
                                "permissions": share.permissions,
                                "expiresAt": (
                                    share.expires_at.isoformat() if share.expires_at else None
                                ),
                            },
                            "isIncoming": True,
                        }
                    )

            return shared_entries

        except Exception as e:
            logger.error(f"Failed to get shared with me entries: {str(e)}")
            return []

    def _get_user_info(self, user_id: str) -> Dict[str, Any]:
        """Get basic user info for display."""
        try:
            response = self.table.get_item(Key={"pk": f"USER#{user_id}", "sk": f"USER#{user_id}"})

            if "Item" in response:
                return {
                    "email": response["Item"].get("email"),
                    "username": response["Item"].get("username"),
                }

            return {}

        except Exception as e:
            logger.warning(f"Error getting user info: {str(e)}")
            return {}
