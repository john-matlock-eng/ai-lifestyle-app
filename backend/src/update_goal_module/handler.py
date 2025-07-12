"""Lambda handler for updating a goal's module flag."""

import json
from datetime import datetime, timezone
from typing import Any, Dict
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths

from goals_common import GoalModule, GoalNotFoundError, GoalPermissionError, GoalError
from .service import UpdateGoalModuleService

logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")

def extract_user_id(event: Dict[str, Any]) -> str:
    authorizer = event.get('requestContext', {}).get('authorizer', {})
    claims = authorizer.get('claims', {})
    if not claims:
        authorizer = event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {})
        if authorizer:
            claims = authorizer
    user_id = claims.get('sub')
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
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'X-Request-ID': request_id},
                'body': json.dumps({'error': 'UNAUTHORIZED', 'message': 'User authentication required', 'request_id': request_id, 'timestamp': datetime.now(timezone.utc).isoformat()})
            }
        body = json.loads(event.get('body', '{}'))
        module_value = body.get('module')
        module = GoalModule(module_value) if module_value else None
        goal_id = event.get('pathParameters', {}).get('goalId')
        service = UpdateGoalModuleService()
        metrics.add_metric(name="GoalModuleUpdate", unit=MetricUnit.Count, value=1)
        goal = service.update_module(user_id, goal_id, module)
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'X-Request-ID': request_id},
            'body': goal.model_dump_json(by_alias=True)
        }
    except (GoalNotFoundError, GoalPermissionError) as e:
        logger.warning(str(e))
        return {
            'statusCode': 404 if isinstance(e, GoalNotFoundError) else 403,
            'headers': {'Content-Type': 'application/json', 'X-Request-ID': request_id},
            'body': json.dumps({'error': e.error_code, 'message': e.message, 'request_id': request_id, 'timestamp': datetime.now(timezone.utc).isoformat()})
        }
    except GoalError as e:
        logger.error(str(e))
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'X-Request-ID': request_id},
            'body': json.dumps({'error': e.error_code, 'message': e.message, 'request_id': request_id, 'timestamp': datetime.now(timezone.utc).isoformat()})
        }
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'X-Request-ID': request_id},
            'body': json.dumps({'error': 'SYSTEM_ERROR', 'message': 'An unexpected error occurred', 'request_id': request_id, 'timestamp': datetime.now(timezone.utc).isoformat()})
        }
