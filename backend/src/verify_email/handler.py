"""
Lambda handler for email verification endpoint.
"""

from typing import Any, Dict

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

from .errors import (
    AlreadyVerifiedError,
    EmailVerificationError,
    InvalidTokenError,
    TokenExpiredError,
    UserNotFoundError,
)
from .models import EmailVerificationRequest, ErrorResponse, MessageResponse
from .service import EmailVerificationService

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle email verification requests.

    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context object

    Returns:
        API Gateway Lambda proxy response
    """

    # Extract request ID for tracking
    request_id = context.aws_request_id

    try:
        # Parse and validate request body
        body = json.loads(event.get("body", "{}"))

        # Validate request data
        try:
            request_data = EmailVerificationRequest(**body)
        except Exception as e:
            logger.error(f"Request validation failed: {str(e)}")
            metrics.add_metric(
                name="InvalidEmailVerificationRequest", unit=MetricUnit.Count, value=1
            )

            error_response = ErrorResponse(
                error="VALIDATION_ERROR",
                message="Invalid request data",
                details={"validation_errors": str(e)},
                request_id=request_id,
            )

            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": error_response.model_dump_json(),
            }

        # Initialize service
        service = EmailVerificationService()

        # Verify email with token
        logger.info("Processing email verification request")
        metrics.add_metric(name="EmailVerificationAttempts", unit=MetricUnit.Count, value=1)

        success_message = service.verify_email_with_token(request_data.token)

        # Success - email verified
        metrics.add_metric(name="SuccessfulEmailVerifications", unit=MetricUnit.Count, value=1)

        response = MessageResponse(message=success_message)

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": response.model_dump_json(),
        }

    except InvalidTokenError as e:
        logger.warning(f"Invalid verification token: {str(e)}")
        metrics.add_metric(name="InvalidVerificationTokens", unit=MetricUnit.Count, value=1)

        error_response = ErrorResponse(error=e.error_code, message=e.message, request_id=request_id)

        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": error_response.model_dump_json(),
        }

    except TokenExpiredError as e:
        logger.warning(f"Expired verification token: {str(e)}")
        metrics.add_metric(name="ExpiredVerificationTokens", unit=MetricUnit.Count, value=1)

        error_response = ErrorResponse(
            error=e.error_code,
            message=e.message,
            details={"help": "Please request a new verification email"},
            request_id=request_id,
        )

        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": error_response.model_dump_json(),
        }

    except AlreadyVerifiedError as e:
        logger.info(f"Email already verified: {str(e)}")
        metrics.add_metric(name="AlreadyVerifiedEmails", unit=MetricUnit.Count, value=1)

        # Return success even if already verified (idempotent)
        response = MessageResponse(message="Email is already verified")

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": response.model_dump_json(),
        }

    except UserNotFoundError as e:
        logger.warning(f"User not found during verification: {str(e)}")
        metrics.add_metric(name="UserNotFoundVerifications", unit=MetricUnit.Count, value=1)

        error_response = ErrorResponse(
            error=e.error_code,
            message="Invalid verification token",  # Don't reveal user existence
            request_id=request_id,
        )

        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": error_response.model_dump_json(),
        }

    except EmailVerificationError as e:
        logger.error(f"Email verification error: {str(e)}")
        metrics.add_metric(name="EmailVerificationErrors", unit=MetricUnit.Count, value=1)

        error_response = ErrorResponse(error=e.error_code, message=e.message, request_id=request_id)

        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": error_response.model_dump_json(),
        }

    except Exception as e:
        logger.error(f"Unexpected error during email verification: {str(e)}", exc_info=True)
        metrics.add_metric(name="EmailVerificationSystemErrors", unit=MetricUnit.Count, value=1)

        error_response = ErrorResponse(
            error="SYSTEM_ERROR", message="An unexpected error occurred", request_id=request_id
        )

        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": error_response.model_dump_json(),
        }
