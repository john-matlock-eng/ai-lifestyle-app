"""
Lambda handler for listing user goals with filtering and pagination.
"""

import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths

from goals_common import GoalError, GoalStatus, GoalPattern
from .service import ListGoalsService

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


def parse_query_parameters(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse and validate query parameters.
    
    Args:
        event: Lambda event
        
    Returns:
        Parsed query parameters
    """
    params = event.get('queryStringParameters', {}) or {}
    
    # Parse status filter
    status_filter = None
    if 'status' in params:
        status_values = params['status'].split(',') if params['status'] else []
        try:
            status_filter = [GoalStatus(s.strip()) for s in status_values if s.strip()]
        except ValueError as e:
            raise ValueError(f"Invalid status value: {e}")
    
    # Parse goal pattern filter
    pattern_filter = None
    if 'goalPattern' in params:
        pattern_values = params['goalPattern'].split(',') if params['goalPattern'] else []
        try:
            pattern_filter = [GoalPattern(p.strip()) for p in pattern_values if p.strip()]
        except ValueError as e:
            raise ValueError(f"Invalid goal pattern value: {e}")
    
    # Parse category filter
    category_filter = None
    if 'category' in params:
        category_filter = [c.strip() for c in params['category'].split(',') if c.strip()]

    module_filter = params.get('module')
    if module_filter not in (None, 'journal'):
        raise ValueError(f"Invalid module value: {module_filter}")
    
    # Parse pagination
    try:
        page = int(params.get('page', 1))
        if page < 1:
            page = 1
    except ValueError:
        page = 1
    
    try:
        limit = int(params.get('limit', 20))
        if limit < 1:
            limit = 1
        elif limit > 100:
            limit = 100
    except ValueError:
        limit = 20
    
    # Parse sort
    sort = params.get('sort', 'updated_desc')
    valid_sorts = [
        'created_asc', 'created_desc', 
        'updated_asc', 'updated_desc',
        'title_asc', 'title_desc'
    ]
    if sort not in valid_sorts:
        sort = 'updated_desc'
    
    return {
        'status_filter': status_filter,
        'pattern_filter': pattern_filter,
        'category_filter': category_filter,
        'module_filter': module_filter,
        'page': page,
        'limit': limit,
        'sort': sort
    }


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle goal listing request.
    
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
            metrics.add_metric(name="UnauthorizedGoalListAttempts", unit=MetricUnit.Count, value=1)
            
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
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            }
        
        # Parse query parameters
        try:
            params = parse_query_parameters(event)
        except ValueError as e:
            logger.error(f"Invalid query parameters: {str(e)}")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'VALIDATION_ERROR',
                    'message': 'Invalid query parameters',
                    'validation_errors': [
                        {
                            'field': 'query',
                            'message': str(e)
                        }
                    ],
                    'request_id': request_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            }
        
        logger.info(f"Goal list request for user {user_id} with filters: {params}")
        
        # Initialize service
        service = ListGoalsService()
        
        # List goals
        metrics.add_metric(name="GoalListRequests", unit=MetricUnit.Count, value=1)
        
        response = service.list_goals(user_id, **params)
        
        # Success
        metrics.add_metric(name="SuccessfulGoalListRequests", unit=MetricUnit.Count, value=1)
        metrics.add_metric(name="GoalsReturned", unit=MetricUnit.Count, value=len(response['goals']))
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': json.dumps(response, default=str)  # default=str handles datetime serialization
        }
        
    except GoalError as e:
        logger.error(f"Goal listing error: {str(e)}")
        metrics.add_metric(name="GoalListErrors", unit=MetricUnit.Count, value=1)
        
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
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"Unexpected error during goal listing: {str(e)}", exc_info=True)
        metrics.add_metric(name="GoalListSystemErrors", unit=MetricUnit.Count, value=1)
        
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
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
        }
