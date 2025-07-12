"""
Lambda handler for creating a new journal entry.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths

from journal_common import (
    JournalEntry, CreateJournalEntryRequest, JournalTemplate,
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


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle journal entry creation request.
    
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
            logger.info(f"Journal entry creation request for user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(name="UnauthorizedJournalCreationAttempts", unit=MetricUnit.Count, value=1)
            
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
        
        # Parse and validate request body
        body = json.loads(event.get('body', '{}'))
        
        try:
            # Validate request against schema
            request_data = CreateJournalEntryRequest(**body)
        except Exception as e:
            logger.error(f"Request validation failed: {str(e)}", exc_info=True)
            metrics.add_metric(name="InvalidJournalCreationRequests", unit=MetricUnit.Count, value=1)
            
            # Extract validation errors
            validation_errors = []
            if hasattr(e, 'errors'):
                for error in e.errors():
                    validation_errors.append({
                        'field': '.'.join(str(x) for x in error['loc']),
                        'message': error['msg']
                    })
            else:
                # If it's not a Pydantic error, include the error message
                validation_errors.append({
                    'field': 'request',
                    'message': str(e)
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
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            }
        
        # TODO: Initialize journal service when available
        # service = CreateJournalEntryService()
        
        # TODO: Create journal entry in database
        # journal_entry = service.create_entry(user_id, request_data)
        
        # For now, create a mock journal entry
        journal_entry = JournalEntry(
            entry_id=str(uuid.uuid4()),
            user_id=user_id,
            title=request_data.title,
            content=request_data.content,
            template=request_data.template,
            word_count=len(request_data.content.split()),
            tags=request_data.tags or [],
            mood=request_data.mood,
            linked_goal_ids=request_data.linked_goal_ids or [],
            goal_progress=request_data.goal_progress or [],
            is_encrypted=True,
            is_shared=request_data.is_shared,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        # Add metrics
        metrics.add_metric(name="JournalEntryCreationAttempts", unit=MetricUnit.Count, value=1)
        metrics.add_metric(name="SuccessfulJournalEntryCreations", unit=MetricUnit.Count, value=1)
        
        # Track template usage
        try:
            template_value = str(request_data.template.value)
            metrics.add_metric(name=f"JournalTemplate_{template_value}", unit=MetricUnit.Count, value=1)
        except Exception as metric_error:
            logger.warning(f"Failed to record journal template metric: {str(metric_error)}")
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Location': f"/journal/entries/{journal_entry.entry_id}",
                'X-Request-ID': request_id
            },
            'body': journal_entry.model_dump_json(by_alias=True)
        }
        
    except Exception as e:
        logger.error(f"Unexpected error during journal entry creation: {str(e)}", exc_info=True)
        metrics.add_metric(name="JournalEntryCreationSystemErrors", unit=MetricUnit.Count, value=1)
        
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