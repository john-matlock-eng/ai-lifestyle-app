
import json
"""
Lambda handler for retrieving goal progress and analytics.
"""

from datetime import datetime
from typing import Any, Dict

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

from goals_common import GoalError, GoalNotFoundError, GoalPermissionError

from .service import GetProgressService

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")


def extract_user_id(event: Dict[str, Any]) -> str:
    """Extract user ID from JWT claims."""
    authorizer = event.get("requestContext", {}).get("authorizer", {})
    claims = authorizer.get("claims", {})

    if not claims:
        authorizer = (
            event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})
        )
        if authorizer:
            claims = authorizer

    user_id = claims.get("sub")
    if not user_id:
        raise ValueError("User ID not found in token")

    return user_id


def parse_query_parameters(event: Dict[str, Any]) -> str:
    """
    Parse period parameter from query string.

    Args:
        event: Lambda event

    Returns:
        Period value
    """
    params = event.get("queryStringParameters", {}) or {}

    period = params.get("period", "current")
    valid_periods = ["current", "week", "month", "quarter", "year", "all"]

    if period not in valid_periods:
        raise ValueError(f"Invalid period: {period}. Must be one of: {', '.join(valid_periods)}")

    return period


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle goal progress retrieval request.

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
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(
                name="UnauthorizedProgressAccessAttempts", unit=MetricUnit.Count, value=1
            )

            return {
                "statusCode": 401,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps(
                    {
                        "error": "UNAUTHORIZED",
                        "message": "User authentication required",
                        "request_id": request_id,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                ),
            }

        # Extract goal ID from path parameters
        path_params = event.get("pathParameters", {})
        goal_id = path_params.get("goalId")

        if not goal_id:
            logger.error("Goal ID not provided in path")
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps(
                    {
                        "error": "VALIDATION_ERROR",
                        "message": "Goal ID is required",
                        "request_id": request_id,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                ),
            }

        # Parse period parameter
        try:
            period = parse_query_parameters(event)
        except ValueError as e:
            logger.error(f"Invalid query parameters: {str(e)}")
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps(
                    {
                        "error": "VALIDATION_ERROR",
                        "message": str(e),
                        "request_id": request_id,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                ),
            }

        logger.info(f"Progress request for goal {goal_id} by user {user_id} (period: {period})")

        # Initialize service
        service = GetProgressService()

        # Get progress
        metrics.add_metric(name="ProgressRetrievalAttempts", unit=MetricUnit.Count, value=1)

        progress_response = service.get_goal_progress(user_id, goal_id, period)

        # Success
        metrics.add_metric(name="SuccessfulProgressRetrievals", unit=MetricUnit.Count, value=1)

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps(progress_response, default=str),  # default=str handles datetime
        }

    except GoalNotFoundError as e:
        logger.warning(f"Goal not found: {str(e)}")
        metrics.add_metric(name="GoalNotFoundErrors", unit=MetricUnit.Count, value=1)

        return {
            "statusCode": 404,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps(
                {
                    "error": e.error_code,
                    "message": e.message,
                    "request_id": request_id,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            ),
        }

    except GoalPermissionError as e:
        logger.warning(f"Permission denied: {str(e)}")
        metrics.add_metric(name="GoalPermissionErrors", unit=MetricUnit.Count, value=1)

        return {
            "statusCode": 404,  # Return 404 to not reveal existence
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps(
                {
                    "error": "GOAL_NOT_FOUND",
                    "message": f"Goal {goal_id} not found",
                    "request_id": request_id,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            ),
        }

    except GoalError as e:
        logger.error(f"Progress retrieval error: {str(e)}")
        metrics.add_metric(name="ProgressRetrievalErrors", unit=MetricUnit.Count, value=1)

        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps(
                {
                    "error": e.error_code,
                    "message": e.message,
                    "details": e.details,
                    "request_id": request_id,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            ),
        }

    except Exception as e:
        logger.error(f"Unexpected error during progress retrieval: {str(e)}", exc_info=True)
        metrics.add_metric(name="ProgressRetrievalSystemErrors", unit=MetricUnit.Count, value=1)

        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps(
                {
                    "error": "SYSTEM_ERROR",
                    "message": "An unexpected error occurred",
                    "request_id": request_id,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            ),
        }
