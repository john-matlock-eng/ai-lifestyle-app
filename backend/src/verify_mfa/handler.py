
import json
"""
Lambda handler for MFA verification during login.
"""

from datetime import datetime
from typing import Any, Dict

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

from .errors import InvalidMFACodeError, InvalidSessionError, MFALoginError, TooManyAttemptsError
from .models import ErrorResponse, LoginResponse, VerifyMfaRequest
from .service import MFALoginService

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle MFA verification during login.

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

        try:
            request_data = VerifyMfaRequest(**body)
        except Exception as e:
            logger.error(f"Request validation failed: {str(e)}")
            metrics.add_metric(name="InvalidMFALoginRequests", unit=MetricUnit.Count, value=1)

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
        service = MFALoginService()

        # Verify MFA and complete login
        logger.info("Processing MFA login verification")
        metrics.add_metric(name="MFALoginAttempts", unit=MetricUnit.Count, value=1)

        response = service.verify_mfa_login(
            session_token=request_data.sessionToken, mfa_code=request_data.code
        )

        # Success
        metrics.add_metric(name="SuccessfulMFALogins", unit=MetricUnit.Count, value=1)

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": response.model_dump_json(),
        }

    except InvalidSessionError as e:
        logger.warning(f"Invalid session during MFA: {str(e)}")
        metrics.add_metric(name="InvalidMFASessions", unit=MetricUnit.Count, value=1)

        error_response = ErrorResponse(
            error=e.error_code,
            message=e.message,
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat(),
        )

        return {
            "statusCode": 401,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": error_response.model_dump_json(),
        }

    except InvalidMFACodeError as e:
        logger.warning(f"Invalid MFA code: {str(e)}")
        metrics.add_metric(name="InvalidMFALoginCodes", unit=MetricUnit.Count, value=1)

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

    except TooManyAttemptsError as e:
        logger.warning(f"Too many MFA attempts: {str(e)}")
        metrics.add_metric(name="MFALoginRateLimited", unit=MetricUnit.Count, value=1)

        error_response = ErrorResponse(
            error=e.error_code,
            message=e.message,
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat(),
        )

        return {
            "statusCode": 429,
            "headers": {
                "Content-Type": "application/json",
                "X-Request-ID": request_id,
                "Retry-After": "300",  # 5 minutes
            },
            "body": error_response.model_dump_json(),
        }

    except MFALoginError as e:
        logger.error(f"MFA login error: {str(e)}")
        metrics.add_metric(name="MFALoginErrors", unit=MetricUnit.Count, value=1)

        error_response = ErrorResponse(
            error=e.error_code,
            message=e.message,
            details=e.details,
            request_id=request_id,
            timestamp=datetime.utcnow().isoformat(),
        )

        return {
            "statusCode": 401,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": error_response.model_dump_json(),
        }

    except Exception as e:
        logger.error(f"Unexpected error during MFA login: {str(e)}", exc_info=True)
        metrics.add_metric(name="MFALoginSystemErrors", unit=MetricUnit.Count, value=1)

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
