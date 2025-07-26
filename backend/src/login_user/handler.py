
import json
"""
AWS Lambda handler for user login endpoint.
"""

import os
from typing import Any, Dict

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.typing import LambdaContext
from pydantic import ValidationError

from .cognito_client import CognitoClient
from .errors import (
    AccountLockedError,
    AccountNotVerifiedError,
    InvalidCredentialsError,
    LoginError,
    RateLimitExceededError,
    UserNotFoundError,
)
from .models import ErrorResponse, LoginRequest, ValidationErrorResponse
from .repository import UserRepository
from .service import LoginService

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")

# Environment variables
COGNITO_USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID")
COGNITO_CLIENT_ID = os.environ.get("COGNITO_CLIENT_ID")
COGNITO_CLIENT_SECRET = os.environ.get("COGNITO_CLIENT_SECRET")  # Optional
USERS_TABLE_NAME = os.environ.get("USERS_TABLE_NAME")
ENVIRONMENT = os.environ.get("ENVIRONMENT", "dev")


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    AWS Lambda handler for user login.

    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context

    Returns:
        API Gateway Lambda proxy response
    """
    # Add metric for invocation
    metrics.add_metric(name="LoginAttempts", unit=MetricUnit.Count, value=1)

    # Extract request ID for tracking
    request_id = event.get("requestContext", {}).get("requestId", "unknown")

    # Extract IP address for audit logging
    ip_address = event.get("requestContext", {}).get("identity", {}).get("sourceIp")

    logger.info(
        "Login request received",
        extra={
            "request_id": request_id,
            "ip_address": ip_address,
            "path": event.get("path"),
            "method": event.get("httpMethod"),
        },
    )

    try:
        # Validate environment variables
        if not all([COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, USERS_TABLE_NAME]):
            logger.error("Missing required environment variables")
            return {
                "statusCode": 500,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps(
                    {
                        "error": "CONFIGURATION_ERROR",
                        "message": "Service configuration error",
                        "request_id": request_id,
                    }
                ),
            }

        # Parse and validate request body
        try:
            body = json.loads(event.get("body", "{}"))
            login_request = LoginRequest(**body)
        except json.JSONDecodeError:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps(
                    {
                        "error": "INVALID_JSON",
                        "message": "Invalid JSON in request body",
                        "request_id": request_id,
                    }
                ),
            }
        except ValidationError as e:
            validation_errors = []
            for error in e.errors():
                field = ".".join(str(loc) for loc in error["loc"])
                validation_errors.append({"field": field, "message": error["msg"]})

            error_response = ValidationErrorResponse(
                validation_errors=validation_errors, request_id=request_id
            )

            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": error_response.model_dump_json(),
            }

        # Initialize services
        user_repository = UserRepository(USERS_TABLE_NAME)
        cognito_client = CognitoClient(
            user_pool_id=COGNITO_USER_POOL_ID,
            client_id=COGNITO_CLIENT_ID,
            client_secret=COGNITO_CLIENT_SECRET,
        )
        login_service = LoginService(user_repository=user_repository, cognito_client=cognito_client)

        # Perform login
        login_response = login_service.login_user(request=login_request, ip_address=ip_address)

        # Add success metric
        metrics.add_metric(name="SuccessfulLogins", unit=MetricUnit.Count, value=1)

        # Return success response
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": login_response.model_dump_json(exclude_none=True),
        }

    except InvalidCredentialsError as e:
        metrics.add_metric(name="FailedLogins", unit=MetricUnit.Count, value=1)
        error_response = ErrorResponse(
            error="INVALID_CREDENTIALS", message=e.message, request_id=request_id
        )

        return {
            "statusCode": 401,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": error_response.model_dump_json(),
        }

    except AccountNotVerifiedError as e:
        error_response = ErrorResponse(
            error="ACCOUNT_NOT_VERIFIED", message=e.message, request_id=request_id
        )

        return {
            "statusCode": 403,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": error_response.model_dump_json(),
        }

    except AccountLockedError as e:
        metrics.add_metric(name="LockedAccounts", unit=MetricUnit.Count, value=1)
        error_response = ErrorResponse(
            error="ACCOUNT_LOCKED", message=e.message, details=e.details, request_id=request_id
        )

        return {
            "statusCode": 429,
            "headers": {
                "Content-Type": "application/json",
                "X-Request-ID": request_id,
                "Retry-After": "900",  # 15 minutes
            },
            "body": error_response.model_dump_json(),
        }

    except RateLimitExceededError as e:
        metrics.add_metric(name="RateLimitExceeded", unit=MetricUnit.Count, value=1)
        error_response = ErrorResponse(
            error="RATE_LIMIT_EXCEEDED", message=e.message, details=e.details, request_id=request_id
        )

        retry_after = e.details.get("retry_after_seconds", 900)

        return {
            "statusCode": 429,
            "headers": {
                "Content-Type": "application/json",
                "X-Request-ID": request_id,
                "Retry-After": str(retry_after),
            },
            "body": error_response.model_dump_json(),
        }

    except LoginError as e:
        logger.error(
            "Login error", extra={"error": str(e), "details": e.details, "request_id": request_id}
        )

        error_response = ErrorResponse(
            error="LOGIN_ERROR", message=e.message, request_id=request_id
        )

        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": error_response.model_dump_json(),
        }

    except Exception as e:
        logger.exception(
            "Unexpected error in login handler", extra={"error": str(e), "request_id": request_id}
        )

        metrics.add_metric(name="LoginErrors", unit=MetricUnit.Count, value=1)

        error_response = ErrorResponse(
            error="INTERNAL_ERROR", message="An unexpected error occurred", request_id=request_id
        )

        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": error_response.model_dump_json(),
        }
