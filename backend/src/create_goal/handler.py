"""
Lambda handler for creating a new goal.
"""

from datetime import datetime
from datetime import datetime, timezone
from typing import Any, Dict

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

from goals_common import (
    CreateGoalRequest,
    Goal,
    GoalError,
    GoalProgress,
    GoalQuotaExceededError,
    GoalStatus,
    GoalValidationError,
)

from .service import CreateGoalService

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
    Handle goal creation request.

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
            logger.info(f"Goal creation request for user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(
                name="UnauthorizedGoalCreationAttempts", unit=MetricUnit.Count, value=1
            )

            return {
                "statusCode": 401,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps(
                    {
                        "error": "UNAUTHORIZED",
                        "message": "User authentication required",
                        "request_id": request_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                ),
            }

        # Parse and validate request body
        body = json.loads(event.get("body", "{}"))

        try:
            # Validate request against schema
            request_data = CreateGoalRequest(**body)
        except Exception as e:
            logger.error(f"Request validation failed: {str(e)}", exc_info=True)
            metrics.add_metric(name="InvalidGoalCreationRequests", unit=MetricUnit.Count, value=1)

            # Extract validation errors
            validation_errors = []
            if hasattr(e, "errors"):
                for error in e.errors():
                    validation_errors.append(
                        {"field": ".".join(str(x) for x in error["loc"]), "message": error["msg"]}
                    )
            else:
                # If it's not a Pydantic error, include the error message
                validation_errors.append({"field": "request", "message": str(e)})

            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps(
                    {
                        "error": "VALIDATION_ERROR",
                        "message": "Validation failed",
                        "validation_errors": validation_errors,
                        "request_id": request_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }
                ),
            }

        # Initialize service
        service = CreateGoalService()

        # Create goal
        metrics.add_metric(name="GoalCreationAttempts", unit=MetricUnit.Count, value=1)

        # Add pattern-specific metric safely
        try:
            pattern_value = str(request_data.goal_pattern)
            metrics.add_metric(name=f"GoalPattern_{pattern_value}", unit=MetricUnit.Count, value=1)
        except Exception as metric_error:
            logger.warning(f"Failed to record goal pattern metric: {str(metric_error)}")

        goal = service.create_goal(user_id, request_data)

        # Success
        metrics.add_metric(name="SuccessfulGoalCreations", unit=MetricUnit.Count, value=1)

        return {
            "statusCode": 201,
            "headers": {
                "Content-Type": "application/json",
                "Location": f"/goals/{goal.goal_id}",
                "X-Request-ID": request_id,
            },
            "body": goal.model_dump_json(by_alias=True),
        }

    except GoalValidationError as e:
        logger.warning(f"Goal validation error: {str(e)}")
        metrics.add_metric(name="GoalValidationErrors", unit=MetricUnit.Count, value=1)

        return {
            "statusCode": 422,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps(
                {
                    "error": e.error_code,
                    "message": e.message,
                    "details": e.details,
                    "request_id": request_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            ),
        }

    except GoalQuotaExceededError as e:
        logger.warning(f"Goal quota exceeded: {str(e)}")
        metrics.add_metric(name="GoalQuotaExceeded", unit=MetricUnit.Count, value=1)

        return {
            "statusCode": 422,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps(
                {
                    "error": e.error_code,
                    "message": e.message,
                    "details": e.details,
                    "request_id": request_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            ),
        }

    except GoalError as e:
        logger.error(f"Goal creation error: {str(e)}")
        metrics.add_metric(name="GoalCreationErrors", unit=MetricUnit.Count, value=1)

        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps(
                {
                    "error": e.error_code,
                    "message": e.message,
                    "details": e.details,
                    "request_id": request_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            ),
        }

    except Exception as e:
        logger.error(f"Unexpected error during goal creation: {str(e)}", exc_info=True)
        metrics.add_metric(name="GoalCreationSystemErrors", unit=MetricUnit.Count, value=1)

        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps(
                {
                    "error": "SYSTEM_ERROR",
                    "message": "An unexpected error occurred",
                    "request_id": request_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            ),
        }
