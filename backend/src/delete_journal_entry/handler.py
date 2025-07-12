"""
Lambda handler for deleting a journal entry.
"""

import json
from datetime import datetime, timezone
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths

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


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle journal entry deletion request.
    
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
            logger.info(f"Journal entry deletion request for user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(name="UnauthorizedJournalDeletionAttempts", unit=MetricUnit.Count, value=1)
            
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
        
        # Extract entry ID from path parameters
        path_params = event.get('pathParameters', {})
        entry_id = path_params.get('entryId')
        
        if not entry_id:
            logger.error("Entry ID not provided in path parameters")
            metrics.add_metric(name="InvalidJournalDeletionRequests", unit=MetricUnit.Count, value=1)
            
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'VALIDATION_ERROR',
                    'message': 'Entry ID required',
                    'request_id': request_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            }
        
        # TODO: Initialize journal service when available
        # service = DeleteJournalEntryService()
        
        # TODO: Delete journal entry from database
        # success = service.delete_entry(user_id, entry_id)
        
        # For now, simulate successful deletion for mock entry
        if entry_id == "mock-entry-123":
            # Add metrics
            metrics.add_metric(name="JournalEntryDeletionAttempts", unit=MetricUnit.Count, value=1)
            metrics.add_metric(name="SuccessfulJournalEntryDeletions", unit=MetricUnit.Count, value=1)
            
            return {
                'statusCode': 204,
                'headers': {
                    'X-Request-ID': request_id
                }
            }
        else:
            # Entry not found
            metrics.add_metric(name="JournalEntryNotFoundForDeletion", unit=MetricUnit.Count, value=1)
            
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'NOT_FOUND',
                    'message': 'Journal entry not found',
                    'request_id': request_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            }
        
    except Exception as e:
        logger.error(f"Unexpected error during journal entry deletion: {str(e)}", exc_info=True)
        metrics.add_metric(name="JournalEntryDeletionSystemErrors", unit=MetricUnit.Count, value=1)
        
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