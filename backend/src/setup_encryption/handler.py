"""
Lambda handler for setting up user encryption.
"""

import json
import os
from datetime import datetime, timezone
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths

from encryption_common import (
    EncryptionKeys, EncryptionSetupRequest, EncryptionRepository
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
    Handle encryption setup request.
    
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
            logger.info(f"Encryption setup request for user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(name="UnauthorizedEncryptionSetupAttempts", unit=MetricUnit.Count, value=1)
            
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
            request_data = EncryptionSetupRequest(**body)
        except Exception as e:
            logger.error(f"Request validation failed: {str(e)}", exc_info=True)
            metrics.add_metric(name="InvalidEncryptionSetupRequests", unit=MetricUnit.Count, value=1)
            
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
        
        # Check if encryption already exists
        existing_keys = repository.get_encryption_keys(user_id)
        if existing_keys:
            logger.warning(f"Encryption already set up for user {user_id}")
            metrics.add_metric(name="DuplicateEncryptionSetupAttempts", unit=MetricUnit.Count, value=1)
            
            return {
                'statusCode': 409,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'CONFLICT',
                    'message': 'Encryption already set up for this user',
                    'requestId': request_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            }
        
        # Create encryption keys
        encryption_keys = EncryptionKeys(
            user_id=user_id,
            salt=request_data.salt,
            encrypted_private_key=request_data.encrypted_private_key,
            public_key=request_data.public_key,
            public_key_id=request_data.public_key_id
        )
        
        # Save to database
        try:
            repository.save_encryption_keys(encryption_keys)
        except Exception as e:
            logger.error(f"Failed to save encryption keys: {str(e)}")
            metrics.add_metric(name="EncryptionSetupFailures", unit=MetricUnit.Count, value=1)
            
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'SYSTEM_ERROR',
                    'message': 'Failed to save encryption keys',
                    'requestId': request_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            }
        
        # Add metrics
        metrics.add_metric(name="EncryptionSetupAttempts", unit=MetricUnit.Count, value=1)
        metrics.add_metric(name="SuccessfulEncryptionSetups", unit=MetricUnit.Count, value=1)
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': json.dumps({
                'userId': user_id,
                'publicKeyId': encryption_keys.public_key_id,
                'createdAt': encryption_keys.created_at.isoformat(),
                'message': 'Encryption successfully set up'
            })
        }
        
    except Exception as e:
        logger.error(f"Unexpected error during encryption setup: {str(e)}", exc_info=True)
        metrics.add_metric(name="EncryptionSetupSystemErrors", unit=MetricUnit.Count, value=1)
        
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
