import json

"""
Lambda handler for MFA setup endpoint.
"""

from datetime import datetime
from typing import Any, Dict

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

from .errors import MFAAlreadyEnabledError, MFAError
from .models import ErrorResponse, MfaSetupResponse
from .service import MFASetupService

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")


def extract_user_info(event: Dict[str, Any]) -> tuple[str, str]:
    """
    Extract user ID and email from JWT claims.

    Args:
        event: Lambda event

    Returns:
        Tuple of (user_id, user_email)

    Raises:
        ValueError: If user info not found
    """
    # For authenticated endpoints, user info comes from JWT claims
    # This is added by API Gateway authorizer
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
    user_email = claims.get("email")

    if not user_id or not user_email:
        raise ValueError("User information not found in token")

    return user_id, user_email


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle MFA setup request.

    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context object

    Returns:
        API Gateway Lambda proxy response
    """

    # Extract request ID for tracking
    request_id = context.aws_request_id

    try:
        # Extract user info from JWT
        try:
            user_id, user_email = extract_user_info(event)
            logger.info(f"MFA setup request for user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user info: {str(e)}")
            metrics.add_metric(name="UnauthorizedMFASetupAttempts", unit=MetricUnit.Count, value=1)

            error_response = ErrorResponse(
                error="UNAUTHORIZED",
                message="User authentication required",
                request_id=request_id,
                timestamp=datetime.utcnow().isoformat(),
            )

            return {
                "statusCode": 401,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": error_response.model_dump_json(),
            }

        # Initialize service
        service = MFASetupService()

        # Setup MFA
        metrics.add_metric(name="MFASetupAttempts", unit=MetricUnit.Count, value=1)

        response = service.setup_mfa(user_id, user_email)

        # Success
        metrics.add_metric(name="SuccessfulMFASetups", unit=MetricUnit.Count, value=1)

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": response.model_dump_json(),
        }

    except MFAAlreadyEnabledError as e:
        logger.warning(f"MFA already enabled for user: {str(e)}")
        metrics.add_metric(name="MFAAlreadyEnabledErrors", unit=MetricUnit.Count, value=1)

        error_response = ErrorResponse(
            error=e.error_code,
            message=e.message,
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat(),
        )

        return {
            "statusCode": 409,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": error_response.model_dump_json(),
        }

    except MFAError as e:
        logger.error(f"MFA setup error: {str(e)}")
        metrics.add_metric(name="MFASetupErrors", unit=MetricUnit.Count, value=1)

        error_response = ErrorResponse(
            error=e.error_code,
            message=e.message,
            details=e.details,
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat(),
        )

        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": error_response.model_dump_json(),
        }

    except Exception as e:
        logger.error(f"Unexpected error during MFA setup: {str(e)}", exc_info=True)
        metrics.add_metric(name="MFASetupSystemErrors", unit=MetricUnit.Count, value=1)

        error_response = ErrorResponse(
            error="SYSTEM_ERROR",
            message="An unexpected error occurred",
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat(),
        )

        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": error_response.model_dump_json(),
        }
