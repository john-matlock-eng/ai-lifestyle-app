"""
Lambda handler for logging goal activities.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths

from goals_common import (
    LogActivityRequest, GoalActivity, ActivityType,
    GoalNotFoundError, ActivityValidationError, 
    GoalPermissionError, GoalError
)
from .service import LogActivityService

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


def get_user_timezone(event: Dict[str, Any]) -> str:
    """Extract user timezone from headers or default to UTC."""
    headers = event.get('headers', {})
    # Look for timezone in headers (case-insensitive)
    for key, value in headers.items():
        if key.lower() == 'x-timezone':
            return value
    return 'UTC'


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle goal activity logging request.
    
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
            metrics.add_metric(name="UnauthorizedActivityLogAttempts", unit=MetricUnit.Count, value=1)
            
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
        
        # Parse and validate request body
        body = json.loads(event.get('body', '{}'))
        
        try:
            # Validate request against schema
            request_data = LogActivityRequest(**body)
        except Exception as e:
            logger.error(f"Request validation failed: {str(e)}")
            metrics.add_metric(name="InvalidActivityLogRequests", unit=MetricUnit.Count, value=1)
            
            # Extract validation errors
            validation_errors = []
            if hasattr(e, 'errors'):
                for error in e.errors():
                    validation_errors.append({
                        'field': '.'.join(str(x) for x in error['loc']),
                        'message': error['msg']
                    })
            
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'VALIDATION_ERROR',
                    'message': 'Validation failed',
                    'validation_errors': validation_errors,
                    'request_id': request_id,
                    'timestamp': datetime.utcnow().isoformat()
                })
            }
        
        # Get user timezone
        timezone_str = get_user_timezone(event)
        
        logger.info(f"Activity log request for goal {goal_id} by user {user_id}")
        
        # Initialize service
        service = LogActivityService()
        
        # Log activity
        metrics.add_metric(name="ActivityLogAttempts", unit=MetricUnit.Count, value=1)
        metrics.add_metric(name=f"ActivityType_{request_data.activityType.value}", unit=MetricUnit.Count, value=1)
        
        activity = service.log_activity(user_id, goal_id, request_data, timezone_str)
        
        # Success
        metrics.add_metric(name="SuccessfulActivityLogs", unit=MetricUnit.Count, value=1)
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': activity.model_dump_json(by_alias=True)
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
        
    except GoalPermissionError as e:
        logger.warning(f"Permission denied: {str(e)}")
        metrics.add_metric(name="GoalPermissionErrors", unit=MetricUnit.Count, value=1)
        
        return {
            'statusCode': 404,  # Return 404 to not reveal existence
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': json.dumps({
                'error': 'GOAL_NOT_FOUND',
                'message': f"Goal {goal_id} not found",
                'request_id': request_id,
                'timestamp': datetime.utcnow().isoformat()
            })
        }
        
    except ActivityValidationError as e:
        logger.warning(f"Activity validation error: {str(e)}")
        metrics.add_metric(name="ActivityValidationErrors", unit=MetricUnit.Count, value=1)
        
        return {
            'statusCode': 422,
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
        
    except GoalError as e:
        logger.error(f"Activity log error: {str(e)}")
        metrics.add_metric(name="ActivityLogErrors", unit=MetricUnit.Count, value=1)
        
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
        logger.error(f"Unexpected error during activity log: {str(e)}", exc_info=True)
        metrics.add_metric(name="ActivityLogSystemErrors", unit=MetricUnit.Count, value=1)
        
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
