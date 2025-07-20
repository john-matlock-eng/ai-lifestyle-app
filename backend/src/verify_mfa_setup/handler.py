"""
Lambda handler for MFA setup verification endpoint.
"""

import json
from datetime import datetime
from typing import Any, Dict

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

from .errors import (
    InvalidCodeError,
    MFAAlreadyVerifiedError,
    MFANotInitializedError,
    MFAVerificationError,
)
from .models import ErrorResponse, MfaStatusResponse, VerifyMfaSetupRequest
from .service import MFAVerificationService

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
    Handle MFA setup verification request.

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
            logger.info(f"MFA verification request for user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(
                name="UnauthorizedMFAVerificationAttempts", unit=MetricUnit.Count, value=1
            )

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

        # Parse and validate request body
        body = json.loads(event.get("body", "{}"))

        try:
            request_data = VerifyMfaSetupRequest(**body)
        except Exception as e:
            logger.error(f"Request validation failed: {str(e)}")
            metrics.add_metric(
                name="InvalidMFAVerificationRequests", unit=MetricUnit.Count, value=1
            )

            error_response = ErrorResponse(
                error="VALIDATION_ERROR",
                message="Invalid request data",
                details={"validation_errors": str(e)},
                request_id=request_id,
                timestamp=datetime.utcnow().isoformat(),
            )

            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": error_response.model_dump_json(),
            }

        # Initialize service
        service = MFAVerificationService()

        # Verify MFA setup
        metrics.add_metric(name="MFAVerificationAttempts", unit=MetricUnit.Count, value=1)

        response = service.verify_mfa_setup(user_id, request_data.code)

        # Success
        metrics.add_metric(name="SuccessfulMFAVerifications", unit=MetricUnit.Count, value=1)

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": response.model_dump_json(),
        }

    except InvalidCodeError as e:
        logger.warning(f"Invalid MFA code: {str(e)}")
        metrics.add_metric(name="InvalidMFACodes", unit=MetricUnit.Count, value=1)

        error_response = ErrorResponse(
            error=e.error_code,
            message=e.message,
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat(),
        )

        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": error_response.model_dump_json(),
        }

    except MFANotInitializedError as e:
        logger.error(f"MFA not initialized: {str(e)}")
        metrics.add_metric(name="MFANotInitializedErrors", unit=MetricUnit.Count, value=1)

        error_response = ErrorResponse(
            error=e.error_code,
            message=e.message,
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat(),
        )

        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": error_response.model_dump_json(),
        }

    except MFAAlreadyVerifiedError as e:
        logger.info(f"MFA already verified: {str(e)}")
        metrics.add_metric(name="MFAAlreadyVerifiedErrors", unit=MetricUnit.Count, value=1)

        # Return success but without backup codes
        response = MfaStatusResponse(enabled=True)

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": response.model_dump_json(),
        }

    except MFAVerificationError as e:
        logger.error(f"MFA verification error: {str(e)}")
        metrics.add_metric(name="MFAVerificationErrors", unit=MetricUnit.Count, value=1)

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
        logger.error(f"Unexpected error during MFA verification: {str(e)}", exc_info=True)
        metrics.add_metric(name="MFAVerificationSystemErrors", unit=MetricUnit.Count, value=1)

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
