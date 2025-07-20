"""
Lambda handler for listing journal entries.
"""

import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

from common.response_utils import create_error_response, create_response
from journal_common import GoalProgress, JournalEntry, JournalListResponse, JournalTemplate

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")


def extract_user_id(event: Dict[str, Any]) -> str:
    """
    Extract user ID from JWT claims.

    Args:
        event: Lambda event

    Returns:
        User ID

    Raises:
        ValueError: If user ID not found
    """
    # For authenticated endpoints, user info comes from JWT claims
    authorizer = event.get("requestContext", {}).get("authorizer", {})
    claims = authorizer.get("claims", {})

    if not claims:
        # Try alternative location for HTTP API
        authorizer = (
            event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})
        )
        if authorizer:
            claims = authorizer

    user_id = claims.get("sub")  # Cognito user ID

    if not user_id:
        raise ValueError("User ID not found in token")

    return user_id


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle journal entries listing request.

    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context object

    Returns:
        API Gateway Lambda proxy response
    """

    # Extract request ID for tracking
    request_id = context.aws_request_id

    try:
        # Extract user ID from JWT
        try:
            user_id = extract_user_id(event)
            logger.info(f"Journal entries list request for user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(
                name="UnauthorizedJournalListAttempts", unit=MetricUnit.Count, value=1
            )

            return create_error_response(
                status_code=401,
                error_code="UNAUTHORIZED",
                message="User authentication required",
                request_id=request_id,
            )

        # Parse query parameters
        query_params = event.get("queryStringParameters") or {}

        # Extract pagination params
        page = int(query_params.get("page", "1"))
        limit = int(query_params.get("limit", "20"))
        goal_id = query_params.get("goalId")
        filter_type = query_params.get(
            "filter", "owned"
        )  # 'owned', 'shared-with-me', 'shared-by-me', 'all'

        # Validate pagination
        if page < 1:
            page = 1
        if limit < 1:
            limit = 1
        if limit > 100:
            limit = 100

        # Initialize journal service
        from .service import ListJournalEntriesService

        service = ListJournalEntriesService()

        # List journal entries from database
        try:
            response = service.list_entries(
                user_id=user_id, page=page, limit=limit, goal_id=goal_id, filter_type=filter_type
            )
        except Exception as e:
            logger.error(f"Failed to list journal entries: {str(e)}")
            metrics.add_metric(name="JournalEntryListFailures", unit=MetricUnit.Count, value=1)

            return create_error_response(
                status_code=500,
                error_code="SYSTEM_ERROR",
                message="Failed to list journal entries",
                request_id=request_id,
            )

        # Add metrics
        metrics.add_metric(name="JournalEntriesListRequests", unit=MetricUnit.Count, value=1)
        metrics.add_metric(
            name="JournalEntriesReturned",
            unit=MetricUnit.Count,
            value=len(response.get("entries", [])),
        )

        return create_response(
            status_code=200, body=response, request_id=request_id  # Already a dict from service
        )

    except Exception as e:
        logger.error(f"Unexpected error during journal entries listing: {str(e)}", exc_info=True)
        metrics.add_metric(name="JournalEntriesListSystemErrors", unit=MetricUnit.Count, value=1)

        return create_error_response(
            status_code=500,
            error_code="SYSTEM_ERROR",
            message="An unexpected error occurred",
            request_id=request_id,
        )
