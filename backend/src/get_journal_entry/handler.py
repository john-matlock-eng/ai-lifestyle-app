"""
Lambda handler for getting a specific journal entry.
"""

from datetime import datetime
from datetime import datetime, timezone
from typing import Any, Dict

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

from common.response_utils import create_error_response, create_response
from journal_common import JournalEntry

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
    Handle journal entry retrieval request.

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
            logger.info(f"Journal entry retrieval request for user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(
                name="UnauthorizedJournalRetrievalAttempts", unit=MetricUnit.Count, value=1
            )

            return create_error_response(
                status_code=401,
                error_code="UNAUTHORIZED",
                message="User authentication required",
                request_id=request_id,
            )

        # Extract entry ID from path parameters
        path_params = event.get("pathParameters", {})
        entry_id = path_params.get("entryId")

        if not entry_id:
            logger.error("Entry ID not provided in path parameters")
            metrics.add_metric(
                name="InvalidJournalRetrievalRequests", unit=MetricUnit.Count, value=1
            )

            return create_error_response(
                status_code=400,
                error_code="VALIDATION_ERROR",
                message="Entry ID required",
                request_id=request_id,
            )

        # Initialize journal service
        from .service import GetJournalEntryService

        service = GetJournalEntryService()

        # Get journal entry from database
        try:
            journal_entry = service.get_entry(user_id, entry_id)

            # Add metrics
            metrics.add_metric(name="JournalEntryRetrievalAttempts", unit=MetricUnit.Count, value=1)
            metrics.add_metric(
                name="SuccessfulJournalEntryRetrievals", unit=MetricUnit.Count, value=1
            )

            return create_response(
                status_code=200,
                body=journal_entry,  # Already a dict from service
                request_id=request_id,
            )

        except ValueError as e:
            # Entry not found
            logger.warning(f"Journal entry not found: {str(e)}")
            metrics.add_metric(name="JournalEntryNotFound", unit=MetricUnit.Count, value=1)

            return create_error_response(
                status_code=404,
                error_code="NOT_FOUND",
                message="Journal entry not found",
                request_id=request_id,
            )
        except Exception as e:
            logger.error(f"Failed to get journal entry: {str(e)}")
            metrics.add_metric(name="JournalEntryRetrievalFailures", unit=MetricUnit.Count, value=1)

            return create_error_response(
                status_code=500,
                error_code="SYSTEM_ERROR",
                message="Failed to retrieve journal entry",
                request_id=request_id,
            )

    except Exception as e:
        logger.error(f"Unexpected error during journal entry retrieval: {str(e)}", exc_info=True)
        metrics.add_metric(name="JournalEntryRetrievalSystemErrors", unit=MetricUnit.Count, value=1)

        return create_error_response(
            status_code=500,
            error_code="SYSTEM_ERROR",
            message="An unexpected error occurred",
            request_id=request_id,
        )
