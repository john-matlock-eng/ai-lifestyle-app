"""Lambda handler for patching goal module."""
import json
from datetime import datetime, timezone
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths

from goals_common import (
    PatchGoalModuleRequest,
    GoalNotFoundError,
    GoalPermissionError,
    GoalError,
)
from .service import PatchGoalModuleService

logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")


def extract_user_id(event: Dict[str, Any]) -> str:
    authorizer = event.get("requestContext", {}).get("authorizer", {})
    claims = authorizer.get("claims", {})
    if not claims:
        authorizer = event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})
        if authorizer:
            claims = authorizer
    user_id = claims.get("sub")
    if not user_id:
        raise ValueError("User ID not found in token")
    return user_id


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    request_id = context.aws_request_id
    try:
        try:
            user_id = extract_user_id(event)
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {e}")
            return {
                "statusCode": 401,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps({
                    "error": "UNAUTHORIZED",
                    "message": "User authentication required",
                    "request_id": request_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }),
            }

        path_params = event.get("pathParameters", {})
        goal_id = path_params.get("goalId")
        if not goal_id:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps({
                    "error": "VALIDATION_ERROR",
                    "message": "Goal ID is required",
                    "request_id": request_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }),
            }

        body = json.loads(event.get("body", "{}"))
        try:
            request_data = PatchGoalModuleRequest(**body)
        except Exception as e:
            logger.error(f"Request validation failed: {e}")
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
                "body": json.dumps({
                    "error": "VALIDATION_ERROR",
                    "message": "Validation failed",
                    "request_id": request_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }),
            }

        service = PatchGoalModuleService()
        metrics.add_metric(name="GoalModulePatchAttempts", unit=MetricUnit.Count, value=1)
        updated_goal = service.patch_goal_module(user_id, goal_id, request_data)
        metrics.add_metric(name="SuccessfulGoalModulePatches", unit=MetricUnit.Count, value=1)
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": updated_goal.model_dump_json(by_alias=True),
        }

    except GoalNotFoundError as e:
        metrics.add_metric(name="GoalNotFoundErrors", unit=MetricUnit.Count, value=1)
        return {
            "statusCode": 404,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps({
                "error": e.error_code,
                "message": e.message,
                "request_id": request_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }),
        }
    except GoalPermissionError:
        metrics.add_metric(name="GoalPermissionErrors", unit=MetricUnit.Count, value=1)
        return {
            "statusCode": 404,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps({
                "error": "GOAL_NOT_FOUND",
                "message": f"Goal {goal_id} not found",
                "request_id": request_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }),
        }
    except GoalError as e:
        metrics.add_metric(name="GoalModulePatchErrors", unit=MetricUnit.Count, value=1)
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps({
                "error": e.error_code,
                "message": e.message,
                "request_id": request_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }),
        }
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        metrics.add_metric(name="GoalModulePatchSystemErrors", unit=MetricUnit.Count, value=1)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "X-Request-ID": request_id},
            "body": json.dumps({
                "error": "SYSTEM_ERROR",
                "message": "An unexpected error occurred",
                "request_id": request_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }),
        }
