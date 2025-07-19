"""
Lambda handler for checking user encryption status.
"""

import json
import os
from datetime import datetime, timezone
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths

from encryption_common import EncryptionRepository

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle encryption status check request.
    
    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context object
        
    Returns:
        API Gateway Lambda proxy response
    """
    
    # Extract request ID for tracking
    request_id = context.aws_request_id
    
    try:
        # Extract user ID from path parameters
        path_params = event.get('pathParameters', {})
        user_id = path_params.get('userId')
        
        if not user_id:
            logger.error("User ID not provided in path")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'BAD_REQUEST',
                    'message': 'User ID is required',
                    'requestId': request_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            }
        
        logger.info(f"Checking encryption status for user {user_id}")
        
        # Initialize repository
        table_name = os.environ.get('TABLE_NAME', 'ai-lifestyle-dev')
        repository = EncryptionRepository(table_name)
        
        # Check if encryption exists
        encryption_keys = repository.get_encryption_keys(user_id)
        
        # Track metrics
        metrics.add_metric(name="EncryptionStatusChecks", unit=MetricUnit.Count, value=1)
        
        if encryption_keys:
            metrics.add_metric(name="UsersWithEncryption", unit=MetricUnit.Count, value=1)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'userId': user_id,
                    'hasEncryption': True,
                    'publicKeyId': encryption_keys.public_key_id,
                    'recoveryEnabled': encryption_keys.recovery_enabled,
                    'recoveryMethods': [method.value for method in encryption_keys.recovery_methods],
                    'createdAt': encryption_keys.created_at.isoformat()
                })
            }
        else:
            metrics.add_metric(name="UsersWithoutEncryption", unit=MetricUnit.Count, value=1)
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'userId': user_id,
                    'hasEncryption': False
                })
            }
        
    except Exception as e:
        logger.error(f"Unexpected error checking encryption status: {str(e)}", exc_info=True)
        metrics.add_metric(name="EncryptionStatusCheckErrors", unit=MetricUnit.Count, value=1)
        
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
