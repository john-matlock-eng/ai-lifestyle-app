"""Lambda handler for retrieving journal statistics."""

import json
from datetime import datetime, timezone
from typing import Any, Dict
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit

from goals_common import GoalError
from .service import GetJournalStatsService

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
        except ValueError:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'X-Request-ID': request_id},
                'body': json.dumps({'error': 'UNAUTHORIZED', 'message': 'User authentication required', 'request_id': request_id, 'timestamp': datetime.now(timezone.utc).isoformat()})
            }
        service = GetJournalStatsService()
        metrics.add_metric(name="JournalStatsRequests", unit=MetricUnit.Count, value=1)
        stats = service.get_stats(user_id)
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'X-Request-ID': request_id},
            'body': json.dumps(stats, default=str)
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
