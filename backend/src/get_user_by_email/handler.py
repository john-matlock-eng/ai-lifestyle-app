"""
Lambda handler for getting user by email.
Used for sharing functionality to look up recipients.
"""

from typing import Any, Dict

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

from common.response_utils import create_error_response, create_response

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle get user by email request.

    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context object

    Returns:
        API Gateway Lambda proxy response
    """

    # Extract request ID for tracking
    request_id = context.aws_request_id

    try:
        # Extract email from path parameters
        path_params = event.get("pathParameters", {})
        email = path_params.get("email")

        if not email:
            logger.error("Email not provided in path parameters")
            metrics.add_metric(name="InvalidUserByEmailRequests", unit=MetricUnit.Count, value=1)

            return create_error_response(
                status_code=400,
                error_code="VALIDATION_ERROR",
                message="Email address required",
                request_id=request_id,
            )

        # Decode the email (it might be URL encoded)
        import urllib.parse

        email = urllib.parse.unquote(email).lower().strip()

        # Validate email format
        import re

        email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
        if not re.match(email_pattern, email):
            logger.error(f"Invalid email format: {email}")
            metrics.add_metric(name="InvalidEmailFormat", unit=MetricUnit.Count, value=1)

            return create_error_response(
                status_code=400,
                error_code="VALIDATION_ERROR",
                message="Invalid email format",
                request_id=request_id,
            )

        # Initialize service
        from .service import GetUserByEmailService

        service = GetUserByEmailService()

        # Get user from database
        try:
            user_data = service.get_user_by_email(email)

            # Add metrics
            metrics.add_metric(name="UserByEmailRequests", unit=MetricUnit.Count, value=1)
            metrics.add_metric(name="SuccessfulUserByEmailLookups", unit=MetricUnit.Count, value=1)

            return create_response(status_code=200, body=user_data, request_id=request_id)

        except ValueError as e:
            # User not found
            logger.warning(f"User not found for email: {email}")
            metrics.add_metric(name="UserByEmailNotFound", unit=MetricUnit.Count, value=1)

            return create_error_response(
                status_code=404,
                error_code="USER_NOT_FOUND",
                message="User not found",
                request_id=request_id,
            )
        except Exception as e:
            logger.error(f"Failed to get user by email: {str(e)}")
            metrics.add_metric(name="UserByEmailLookupFailures", unit=MetricUnit.Count, value=1)

            return create_error_response(
                status_code=500,
                error_code="SYSTEM_ERROR",
                message="Failed to look up user",
                request_id=request_id,
            )

    except Exception as e:
        logger.error(f"Unexpected error during user lookup: {str(e)}", exc_info=True)
        metrics.add_metric(name="UserByEmailSystemErrors", unit=MetricUnit.Count, value=1)

        return create_error_response(
            status_code=500,
            error_code="SYSTEM_ERROR",
            message="An unexpected error occurred",
            request_id=request_id,
        )
