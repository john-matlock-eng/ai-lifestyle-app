
import json
"""
Lambda handler for creating shares (encrypted and non-encrypted).
"""

from datetime import datetime, timedelta
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit
from pydantic import BaseModel, Field, validator

from common.response_utils import create_error_response, create_response

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")


class CreateShareRequest(BaseModel):
    """Request model for creating a share."""

    item_type: str = Field(
        alias="itemType", description="Type of item being shared (journal, goal, etc)"
    )
    item_id: str = Field(alias="itemId", description="ID of the item being shared")
    recipient_id: str = Field(alias="recipientId", description="User ID of the recipient")
    encrypted_key: Optional[str] = Field(
        alias="encryptedKey",
        default=None,
        description="Re-encrypted content key for recipient (required for encrypted items)",
    )
    permissions: List[str] = Field(default=["read"], description="List of permissions")
    expires_in_hours: Optional[int] = Field(
        alias="expiresInHours", default=24, description="Hours until share expires"
    )

    @validator("item_type")
    def validate_item_type(cls, v):
        if v not in ["journal", "goal"]:
            raise ValueError("Invalid item type")
        return v

    @validator("permissions")
    def validate_permissions(cls, v):
        valid_permissions = ["read", "write", "share"]
        for perm in v:
            if perm not in valid_permissions:
                raise ValueError(f"Invalid permission: {perm}")
        return v

    @validator("expires_in_hours")
    def validate_expiration(cls, v):
        if v and (v < 1 or v > 720):  # Max 30 days
            raise ValueError("Expiration must be between 1 and 720 hours")
        return v


def extract_user_id(event: Dict[str, Any]) -> str:
    """Extract user ID from JWT claims."""
    authorizer = event.get("requestContext", {}).get("authorizer", {})
    claims = authorizer.get("claims", {})

    if not claims:
        # Try alternative location for HTTP API
        authorizer = (
            event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})
        )
        if authorizer:
            claims = authorizer

    user_id = claims.get("sub")
    if not user_id:
        raise ValueError("User ID not found in token")

    return user_id


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle share creation request.

    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context object

    Returns:
        API Gateway Lambda proxy response
    """

    request_id = context.aws_request_id

    try:
        # Extract user ID from JWT
        try:
            user_id = extract_user_id(event)
            logger.info(f"Share creation request from user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(
                name="UnauthorizedShareCreationAttempts", unit=MetricUnit.Count, value=1
            )

            return create_error_response(
                status_code=401,
                error_code="UNAUTHORIZED",
                message="User authentication required",
                request_id=request_id,
            )

        # Parse and validate request body
        try:
            body = json.loads(event.get("body", "{}"))
            request = CreateShareRequest(**body)
        except Exception as e:
            logger.error(f"Invalid request body: {str(e)}")
            metrics.add_metric(name="InvalidShareCreationRequests", unit=MetricUnit.Count, value=1)

            return create_error_response(
                status_code=400,
                error_code="VALIDATION_ERROR",
                message=str(e),
                request_id=request_id,
            )

        # Initialize service
        from .service import CreateShareService

        service = CreateShareService()

        # Create the share
        try:
            share_data = service.create_share(
                owner_id=user_id,
                item_type=request.item_type,
                item_id=request.item_id,
                recipient_id=request.recipient_id,
                encrypted_key=request.encrypted_key,
                permissions=request.permissions,
                expires_in_hours=request.expires_in_hours,
            )

            metrics.add_metric(name="SharesCreated", unit=MetricUnit.Count, value=1)
            metrics.add_metric(
                name=f"SharesCreated_{request.item_type}", unit=MetricUnit.Count, value=1
            )

            return create_response(
                status_code=201,
                body={
                    "shareId": share_data["shareId"],
                    "expiresAt": share_data["expiresAt"],
                    "createdAt": share_data["createdAt"],
                    "isEncrypted": share_data["isEncrypted"],
                },
                request_id=request_id,
            )

        except ValueError as e:
            logger.error(f"Share creation failed: {str(e)}")
            metrics.add_metric(name="ShareCreationFailures", unit=MetricUnit.Count, value=1)

            return create_error_response(
                status_code=400,
                error_code="SHARE_CREATION_FAILED",
                message=str(e),
                request_id=request_id,
            )
        except Exception as e:
            logger.error(f"Unexpected error creating share: {str(e)}")
            metrics.add_metric(name="ShareCreationSystemErrors", unit=MetricUnit.Count, value=1)

            return create_error_response(
                status_code=500,
                error_code="SYSTEM_ERROR",
                message="Failed to create share",
                request_id=request_id,
            )

    except Exception as e:
        logger.error(f"Unexpected error in share creation handler: {str(e)}", exc_info=True)
        metrics.add_metric(name="ShareCreationHandlerErrors", unit=MetricUnit.Count, value=1)

        return create_error_response(
            status_code=500,
            error_code="SYSTEM_ERROR",
            message="An unexpected error occurred",
            request_id=request_id,
        )
