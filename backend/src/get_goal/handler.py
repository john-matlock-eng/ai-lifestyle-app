"""
Lambda handler for retrieving a specific goal.
"""

import json
from datetime import datetime
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths

from goals_common import GoalNotFoundError, GoalError
from .service import GetGoalService

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")


def extract_user_id(event: Dict[str, Any]) -> str:
    """Extract user ID from JWT claims."""
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
    """
    Handle goal retrieval request.
    
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
            metrics.add_metric(name="UnauthorizedGoalAccessAttempts", unit=MetricUnit.Count, value=1)
            
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'UNAUTHORIZED',
                    'message': 'User authentication required',
                    'request_id': request_id,
                    'timestamp': datetime.utcnow().isoformat()
                })
            }
        
        # Extract goal ID from path parameters
        path_params = event.get('pathParameters', {})
        goal_id = path_params.get('goalId')
        
        if not goal_id:
            logger.error("Goal ID not provided in path")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'VALIDATION_ERROR',
                    'message': 'Goal ID is required',
                    'request_id': request_id,
                    'timestamp': datetime.utcnow().isoformat()
                })
            }
        
        logger.info(f"Goal retrieval request for goal {goal_id} by user {user_id}")
        
        # Initialize service
        service = GetGoalService()
        
        # Get goal
        metrics.add_metric(name="GoalRetrievalAttempts", unit=MetricUnit.Count, value=1)
        
        goal = service.get_goal(user_id, goal_id)
        
        # Success
        metrics.add_metric(name="SuccessfulGoalRetrievals", unit=MetricUnit.Count, value=1)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': goal.model_dump_json(by_alias=True)
        }
        
    except GoalNotFoundError as e:
        logger.warning(f"Goal not found: {str(e)}")
        metrics.add_metric(name="GoalNotFoundErrors", unit=MetricUnit.Count, value=1)
        
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': json.dumps({
                'error': e.error_code,
                'message': e.message,
                'request_id': request_id,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except GoalError as e:
        logger.error(f"Goal retrieval error: {str(e)}")
        metrics.add_metric(name="GoalRetrievalErrors", unit=MetricUnit.Count, value=1)
        
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': json.dumps({
                'error': e.error_code,
                'message': e.message,
                'details': e.details,
                'request_id': request_id,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"Unexpected error during goal retrieval: {str(e)}", exc_info=True)
        metrics.add_metric(name="GoalRetrievalSystemErrors", unit=MetricUnit.Count, value=1)
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': json.dumps({
                'error': 'SYSTEM_ERROR',
                'message': 'An unexpected error occurred',
                'request_id': request_id,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
