"""
Lambda handler for listing goal activities.
"""

from datetime import date, datetime
from typing import Any, Dict, List, Optional

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

from goals_common import ActivityType, GoalError, GoalNotFoundError, GoalPermissionError

from .service import ListActivitiesService

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


def parse_query_parameters(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse and validate query parameters.

    Args:
        event: Lambda event

    Returns:
        Parsed query parameters
    """
    params = event.get("queryStringParameters", {}) or {}

    # Parse dates
    start_date = None
    if "startDate" in params:
        try:
            start_date = datetime.fromisoformat(params["startDate"]).date()
        except ValueError:
            raise ValueError(f"Invalid startDate format: {params['startDate']}")

    end_date = None
    if "endDate" in params:
        try:
            end_date = datetime.fromisoformat(params["endDate"]).date()
        except ValueError:
            raise ValueError(f"Invalid endDate format: {params['endDate']}")

    # Validate date range
    if start_date and end_date and start_date > end_date:
        raise ValueError("startDate must be before endDate")

    # Parse activity type filter
    activity_type_filter = None
    if "activityType" in params:
        activity_types = params["activityType"].split(",") if params["activityType"] else []
        try:
            activity_type_filter = [ActivityType(t.strip()) for t in activity_types if t.strip()]
        except ValueError as e:
            raise ValueError(f"Invalid activity type: {e}")

    # Parse pagination
    try:
        page = int(params.get("page", 1))
        if page < 1:
            page = 1
    except ValueError:
        page = 1

    try:
        limit = int(params.get("limit", 20))
        if limit < 1:
            limit = 1
        elif limit > 100:
            limit = 100
    except ValueError:
        limit = 20

    return {
        "start_date": start_date,
        "end_date": end_date,
        "activity_type_filter": activity_type_filter,
        "page": page,
        "limit": limit,
    }


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle goal activities listing request.

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
                name="UnauthorizedActivityListAttempts", unit=MetricUnit.Count, value=1
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

        # Parse query parameters
        try:
            params = parse_query_parameters(event)
        except ValueError as e:
            logger.error(f"Invalid query parameters: {str(e)}")
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps(
                    {
                        "error": "VALIDATION_ERROR",
                        "message": "Invalid query parameters",
                        "validation_errors": [{"field": "query", "message": str(e)}],
                        "request_id": request_id,
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                ),
            }

        logger.info(f"Activity list request for goal {goal_id} by user {user_id}")

        # Initialize service
        service = ListActivitiesService()

        # List activities
        metrics.add_metric(name="ActivityListRequests", unit=MetricUnit.Count, value=1)

        response = service.list_activities(user_id, goal_id, **params)

        # Success
        metrics.add_metric(name="SuccessfulActivityListRequests", unit=MetricUnit.Count, value=1)
        metrics.add_metric(
            name="ActivitiesReturned", unit=MetricUnit.Count, value=len(response["activities"])
        )

        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps(response, default=str),  # default=str handles datetime serialization
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
        logger.error(f"Activity listing error: {str(e)}")
        metrics.add_metric(name="ActivityListErrors", unit=MetricUnit.Count, value=1)

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
        logger.error(f"Unexpected error during activity listing: {str(e)}", exc_info=True)
        metrics.add_metric(name="ActivityListSystemErrors", unit=MetricUnit.Count, value=1)

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
