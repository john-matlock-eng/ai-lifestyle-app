import json

"""
Lambda handler for creating AI analysis shares.
"""

from datetime import datetime, timedelta
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit
from pydantic import BaseModel, Field, validator

from common.response_utils import create_error_response, create_response

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")


class CreateAIShareRequest(BaseModel):
    """Request model for creating an AI share."""

    item_type: str = Field(alias="itemType", description="Type of items being shared")
    item_ids: List[str] = Field(alias="itemIds", description="IDs of items to analyze")
    analysis_type: str = Field(alias="analysisType", description="Type of AI analysis")
    context: str = Field(default="", description="Additional context for analysis")
    expires_in_minutes: int = Field(
        alias="expiresInMinutes", default=30, description="Minutes until share expires"
    )

    @validator("item_type")
    def validate_item_type(cls, v):
        if v not in ["journal", "goal"]:
            raise ValueError("Invalid item type")
        return v

    @validator("analysis_type")
    def validate_analysis_type(cls, v):
        valid_types = ["sentiment", "themes", "patterns", "goals", "summary", "insights"]
        if v not in valid_types:
            raise ValueError(f'Invalid analysis type. Must be one of: {", ".join(valid_types)}')
        return v

    @validator("expires_in_minutes")
    def validate_expiration(cls, v):
        if v < 5 or v > 60:  # Max 1 hour for AI shares
            raise ValueError("Expiration must be between 5 and 60 minutes")
        return v

    @validator("item_ids")
    def validate_item_ids(cls, v):
        if not v or len(v) == 0:
            raise ValueError("At least one item ID required")
        if len(v) > 10:  # Limit batch size
            raise ValueError("Maximum 10 items per AI analysis")
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
    Handle AI share creation request.

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
            logger.info(f"AI share creation request from user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(
                name="UnauthorizedAIShareCreationAttempts", unit=MetricUnit.Count, value=1
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
            request = CreateAIShareRequest(**body)
        except Exception as e:
            logger.error(f"Invalid request body: {str(e)}")
            metrics.add_metric(
                name="InvalidAIShareCreationRequests", unit=MetricUnit.Count, value=1
            )

            return create_error_response(
                status_code=400,
                error_code="VALIDATION_ERROR",
                message=str(e),
                request_id=request_id,
            )

        # Initialize service
        from .service import CreateAIShareService

        service = CreateAIShareService()

        # Create the AI shares
        try:
            result = service.create_ai_shares(
                owner_id=user_id,
                item_type=request.item_type,
                item_ids=request.item_ids,
                analysis_type=request.analysis_type,
                context=request.context,
                expires_in_minutes=request.expires_in_minutes,
            )

            metrics.add_metric(
                name="AISharesCreated", unit=MetricUnit.Count, value=len(result["shareIds"])
            )
            metrics.add_metric(
                name=f"AIAnalysis_{request.analysis_type}", unit=MetricUnit.Count, value=1
            )

            return create_response(
                status_code=201,
                body={
                    "analysisRequestId": result["analysisRequestId"],
                    "shareIds": result["shareIds"],
                    "expiresAt": result["expiresAt"],
                },
                request_id=request_id,
            )

        except ValueError as e:
            logger.error(f"AI share creation failed: {str(e)}")
            metrics.add_metric(name="AIShareCreationFailures", unit=MetricUnit.Count, value=1)

            return create_error_response(
                status_code=400,
                error_code="AI_SHARE_CREATION_FAILED",
                message=str(e),
                request_id=request_id,
            )
        except Exception as e:
            logger.error(f"Unexpected error creating AI share: {str(e)}")
            metrics.add_metric(name="AIShareCreationSystemErrors", unit=MetricUnit.Count, value=1)

            return create_error_response(
                status_code=500,
                error_code="SYSTEM_ERROR",
                message="Failed to create AI share",
                request_id=request_id,
            )

    except Exception as e:
        logger.error(f"Unexpected error in AI share creation handler: {str(e)}", exc_info=True)
        metrics.add_metric(name="AIShareCreationHandlerErrors", unit=MetricUnit.Count, value=1)

        return create_error_response(
            status_code=500,
            error_code="SYSTEM_ERROR",
            message="An unexpected error occurred",
            request_id=request_id,
        )
