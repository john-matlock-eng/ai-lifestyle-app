"""
Lambda handler for listing encrypted shares.
"""

import json
from datetime import datetime, timezone
from typing import Any, Dict

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

from common.response_utils import create_error_response, create_response

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")


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
    Handle list shares request.

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
            logger.info(f"List shares request from user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(
                name="UnauthorizedListSharesAttempts", unit=MetricUnit.Count, value=1
            )

            return create_error_response(
                status_code=401,
                error_code="UNAUTHORIZED",
                message="User authentication required",
                request_id=request_id,
            )

        # Parse query parameters
        query_params = event.get("queryStringParameters") or {}
        item_type = query_params.get("itemType")
        direction = query_params.get("direction", "both")  # 'sent', 'received', 'both'
        include_expired = query_params.get("includeExpired", "false").lower() == "true"

        # Validate parameters
        if direction not in ["sent", "received", "both"]:
            return create_error_response(
                status_code=400,
                error_code="VALIDATION_ERROR",
                message="Invalid direction parameter. Must be: sent, received, or both",
                request_id=request_id,
            )

        if item_type and item_type not in ["journal", "goal"]:
            return create_error_response(
                status_code=400,
                error_code="VALIDATION_ERROR",
                message="Invalid itemType parameter. Must be: journal or goal",
                request_id=request_id,
            )

        # Initialize service
        from .service import ListSharesService

        service = ListSharesService()

        # Get shares
        try:
            shares = service.list_shares(
                user_id=user_id,
                direction=direction,
                item_type=item_type,
                include_expired=include_expired,
            )

            metrics.add_metric(name="ListSharesRequests", unit=MetricUnit.Count, value=1)
            metrics.add_metric(name="SharesReturned", unit=MetricUnit.Count, value=len(shares))

            return create_response(
                status_code=200,
                body={"shares": shares, "count": len(shares)},
                request_id=request_id,
            )

        except Exception as e:
            logger.error(f"Failed to list shares: {str(e)}")
            metrics.add_metric(name="ListSharesFailures", unit=MetricUnit.Count, value=1)

            return create_error_response(
                status_code=500,
                error_code="SYSTEM_ERROR",
                message="Failed to list shares",
                request_id=request_id,
            )

    except Exception as e:
        logger.error(f"Unexpected error in list shares handler: {str(e)}", exc_info=True)
        metrics.add_metric(name="ListSharesHandlerErrors", unit=MetricUnit.Count, value=1)

        return create_error_response(
            status_code=500,
            error_code="SYSTEM_ERROR",
            message="An unexpected error occurred",
            request_id=request_id,
        )
