"""
Service layer for creating AI analysis shares.
"""

import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import boto3
from aws_lambda_powertools import Logger, Tracer
from boto3.dynamodb.conditions import Attr, Key
from botocore.exceptions import ClientError

logger = Logger()
tracer = Tracer()


class CreateAIShareService:
    """Service for creating AI analysis shares."""

    def __init__(self):
        """Initialize the service with DynamoDB client."""
        self.dynamodb = boto3.resource("dynamodb")
        self.table_name = os.environ.get("TABLE_NAME", "ai-lifestyle-dev")
        self.table = self.dynamodb.Table(self.table_name)
        logger.info(f"Initialized CreateAIShareService with table {self.table_name}")

    @tracer.capture_method
    def create_ai_shares(
        self,
        owner_id: str,
        item_type: str,
        item_ids: List[str],
        analysis_type: str,
        context: str = "",
        expires_in_minutes: int = 30,
    ) -> Dict[str, Any]:
        """
        Create AI analysis shares for specified items.

        Args:
            owner_id: ID of the user who owns the items
            item_type: Type of items (journal/goal)
            item_ids: List of item IDs to analyze
            analysis_type: Type of AI analysis to perform
            context: Additional context for analysis
            expires_in_minutes: Minutes until share expires

        Returns:
            Dict containing analysis request ID, share IDs, and expiration

        Raises:
            ValueError: If validation fails
            Exception: If DynamoDB operation fails
        """
        # First verify that all items exist and belong to the user
        self._verify_item_ownership(owner_id, item_type, item_ids)

        # Generate unique IDs
        analysis_request_id = str(uuid.uuid4())
        share_ids = []
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_in_minutes)

        # Create a share for each item
        batch_items = []

        for item_id in item_ids:
            share_id = str(uuid.uuid4())
            share_ids.append(share_id)

            # Create share record
            share_item = {
                "pk": f"SHARE#{share_id}",
                "sk": "METADATA",
                "shareId": share_id,
                "analysisRequestId": analysis_request_id,
                "ownerId": owner_id,
                "sharedWithId": "AI_ANALYSIS",  # Special ID for AI shares
                "itemType": item_type,
                "itemId": item_id,
                "analysisType": analysis_type,
                "context": context,
                "shareType": "ai_analysis",
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "expiresAt": expires_at.isoformat(),
                "status": "pending",  # Will be updated to 'analyzed' when complete
                "gsi1_pk": f"USER#{owner_id}",
                "gsi1_sk": f"AI_SHARE#{share_id}",
            }

            batch_items.append({"PutRequest": {"Item": share_item}})

        # Create analysis request record
        analysis_item = {
            "pk": f"AI_ANALYSIS#{analysis_request_id}",
            "sk": "REQUEST",
            "analysisRequestId": analysis_request_id,
            "ownerId": owner_id,
            "itemType": item_type,
            "itemIds": item_ids,
            "shareIds": share_ids,
            "analysisType": analysis_type,
            "context": context,
            "status": "pending",
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "expiresAt": expires_at.isoformat(),
        }

        batch_items.append({"PutRequest": {"Item": analysis_item}})

        # Write all items in batch
        try:
            # DynamoDB batch write supports max 25 items
            for i in range(0, len(batch_items), 25):
                batch = batch_items[i : i + 25]
                response = self.dynamodb.batch_write_item(RequestItems={self.table_name: batch})

                # Check for unprocessed items
                if response.get("UnprocessedItems"):
                    logger.warning(
                        f"Unprocessed items in batch write: {response['UnprocessedItems']}"
                    )
                    # In production, implement retry logic here

            logger.info(
                f"Created AI analysis request {analysis_request_id} with {len(share_ids)} shares"
            )

            # TODO: Trigger AI analysis Lambda/SQS here
            # This would send a message to process the analysis asynchronously

            return {
                "analysisRequestId": analysis_request_id,
                "shareIds": share_ids,
                "expiresAt": expires_at.isoformat(),
            }

        except ClientError as e:
            logger.error(f"Failed to create AI shares: {str(e)}")
            raise Exception("Failed to create AI analysis shares")

    def _verify_item_ownership(self, owner_id: str, item_type: str, item_ids: List[str]) -> None:
        """
        Verify that all items exist and belong to the specified user.

        Args:
            owner_id: ID of the user
            item_type: Type of items to verify
            item_ids: List of item IDs to check

        Raises:
            ValueError: If any item doesn't exist or doesn't belong to user
        """
        for item_id in item_ids:
            try:
                if item_type == "journal":
                    response = self.table.get_item(
                        Key={"pk": f"USER#{owner_id}", "sk": f"JOURNAL#{item_id}"}
                    )
                elif item_type == "goal":
                    response = self.table.get_item(
                        Key={"pk": f"USER#{owner_id}", "sk": f"GOAL#{item_id}"}
                    )
                else:
                    raise ValueError(f"Invalid item type: {item_type}")

                if "Item" not in response:
                    raise ValueError(
                        f"{item_type.capitalize()} {item_id} not found or access denied"
                    )

            except ClientError as e:
                logger.error(f"Error verifying item ownership: {str(e)}")
                raise ValueError(f"Failed to verify ownership of {item_type} {item_id}")
