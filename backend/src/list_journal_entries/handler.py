"""
Lambda handler for listing journal entries.
"""

import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths

from journal_common import (
    JournalEntry, JournalListResponse, JournalTemplate,
    GoalProgress
)

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
    authorizer = event.get('requestContext', {}).get('authorizer', {})
    claims = authorizer.get('claims', {})
    
    if not claims:
        # Try alternative location for HTTP API
        authorizer = event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {})
        if authorizer:
            claims = authorizer
    
    user_id = claims.get('sub')  # Cognito user ID
    
    if not user_id:
        raise ValueError("User ID not found in token")
    
    return user_id


def parse_query_params(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse query parameters from API Gateway event.
    
    Args:
        event: API Gateway event
        
    Returns:
        Parsed query parameters
    """
    query_params = event.get('queryStringParameters') or {}
    
    # Parse pagination params
    page = int(query_params.get('page', '1'))
    limit = int(query_params.get('limit', '20'))
    
    # Validate pagination
    if page < 1:
        page = 1
    if limit < 1:
        limit = 1
    if limit > 100:
        limit = 100
    
    # Parse goal filter
    goal_id = query_params.get('goalId')
    
    # Parse date filters
    start_date = query_params.get('startDate')
    end_date = query_params.get('endDate')
    
    # Parse template filter
    template = query_params.get('template')
    
    # Parse tag filter
    tag = query_params.get('tag')
    
    # Parse mood filter
    mood = query_params.get('mood')
    
    return {
        'page': page,
        'limit': limit,
        'goal_id': goal_id,
        'start_date': start_date,
        'end_date': end_date,
        'template': template,
        'tag': tag,
        'mood': mood
    }


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle journal entries listing request.
    
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
            logger.info(f"Journal entries list request for user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(name="UnauthorizedJournalListAttempts", unit=MetricUnit.Count, value=1)
            
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
        query_params = event.get('queryStringParameters') or {}
        
        # Extract pagination params
        limit = int(query_params.get('limit', '20'))
        page_token = query_params.get('page_token')
        goal_id = query_params.get('goalId')
        
        # Validate limit
        if limit < 1:
            limit = 1
        if limit > 100:
            limit = 100
        
        # Initialize journal service
        from .service import ListJournalEntriesService
        service = ListJournalEntriesService()
        
        # List journal entries from database
        try:
            response = service.list_entries(
                user_id=user_id,
                limit=limit,
                page_token=page_token,
                goal_id=goal_id
            )
        except Exception as e:
            logger.error(f"Failed to list journal entries: {str(e)}")
            metrics.add_metric(name="JournalEntryListFailures", unit=MetricUnit.Count, value=1)
            
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'SYSTEM_ERROR',
                    'message': 'Failed to list journal entries',
                    'request_id': request_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            }
        
        # Add metrics
        metrics.add_metric(name="JournalEntriesListRequests", unit=MetricUnit.Count, value=1)
        metrics.add_metric(name="JournalEntriesReturned", unit=MetricUnit.Count, value=len(response.entries))
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': response.model_dump_json(by_alias=True)
        }
        
    except Exception as e:
        logger.error(f"Unexpected error during journal entries listing: {str(e)}", exc_info=True)
        metrics.add_metric(name="JournalEntriesListSystemErrors", unit=MetricUnit.Count, value=1)
        
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