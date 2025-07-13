"""
Lambda handler for creating encrypted shares.
"""

import json
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths

from encryption_common import (
    Share, CreateShareRequest, ShareType, SharePermission,
    EncryptionRepository
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
    Handle share creation request.
    
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
            owner_id = extract_user_id(event)
            logger.info(f"Share creation request from user {owner_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(name="UnauthorizedShareCreationAttempts", unit=MetricUnit.Count, value=1)
            
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'UNAUTHORIZED',
                    'message': 'User authentication required',
                    'requestId': request_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            }
        
        # Parse and validate request body
        body = json.loads(event.get('body', '{}'))
        
        try:
            # Validate request against schema
            request_data = CreateShareRequest(**body)
        except Exception as e:
            logger.error(f"Request validation failed: {str(e)}", exc_info=True)
            metrics.add_metric(name="InvalidShareCreationRequests", unit=MetricUnit.Count, value=1)
            
            # Extract validation errors
            validation_errors = []
            if hasattr(e, 'errors'):
                for error in e.errors():
                    validation_errors.append({
                        'field': '.'.join(str(x) for x in error['loc']),
                        'message': error['msg']
                    })
            else:
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
                    'validationErrors': validation_errors,
                    'requestId': request_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            }
        
        # Initialize repository
        table_name = os.environ.get('TABLE_NAME', 'ai-lifestyle-dev')
        repository = EncryptionRepository(table_name)
        
        # Verify recipient has encryption set up
        recipient_keys = repository.get_public_key(request_data.recipient_id)
        if not recipient_keys:
            logger.warning(f"Recipient {request_data.recipient_id} does not have encryption set up")
            metrics.add_metric(name="ShareToUnencryptedUser", unit=MetricUnit.Count, value=1)
            
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'RECIPIENT_NOT_ENCRYPTED',
                    'message': 'Recipient has not set up encryption',
                    'requestId': request_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            }
        
        # Create share
        share_id = str(uuid.uuid4())
        
        # Calculate expiration
        expires_at = None
        if request_data.expires_in_hours:
            expires_at = datetime.now(timezone.utc) + timedelta(hours=request_data.expires_in_hours)
        
        # Set default permissions if not provided
        permissions = request_data.permissions or [SharePermission.READ]
        
        share = Share(
            share_id=share_id,
            owner_id=owner_id,
            recipient_id=request_data.recipient_id,
            item_type=request_data.item_type,
            item_id=request_data.item_id,
            encrypted_key=request_data.encrypted_key,
            share_type=request_data.share_type,
            permissions=permissions,
            expires_at=expires_at,
            max_accesses=request_data.max_accesses
        )
        
        # Save to database
        try:
            repository.create_share(share)
        except Exception as e:
            logger.error(f"Failed to create share: {str(e)}")
            metrics.add_metric(name="ShareCreationFailures", unit=MetricUnit.Count, value=1)
            
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'SYSTEM_ERROR',
                    'message': 'Failed to create share',
                    'requestId': request_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            }
        
        # Add metrics
        metrics.add_metric(name="ShareCreationAttempts", unit=MetricUnit.Count, value=1)
        metrics.add_metric(name="SuccessfulShareCreations", unit=MetricUnit.Count, value=1)
        metrics.add_metric(name=f"ShareType_{share.share_type.value}", unit=MetricUnit.Count, value=1)
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': share.model_dump_json(by_alias=True)
        }
        
    except Exception as e:
        logger.error(f"Unexpected error during share creation: {str(e)}", exc_info=True)
        metrics.add_metric(name="ShareCreationSystemErrors", unit=MetricUnit.Count, value=1)
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': json.dumps({
                'error': 'SYSTEM_ERROR',
                'message': 'An unexpected error occurred',
                'requestId': request_id,
                'timestamp': datetime.now(timezone.utc).isoformat()
            })
        }
