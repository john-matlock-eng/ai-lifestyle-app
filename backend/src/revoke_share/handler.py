"""
Lambda handler for revoking encrypted shares.
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
    Handle share revocation request.
    
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
            logger.info(f"Share revocation request from user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(name="UnauthorizedShareRevocationAttempts", unit=MetricUnit.Count, value=1)
            
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
        
        # Extract share ID from path parameters
        path_params = event.get('pathParameters', {})
        share_id = path_params.get('shareId')
        
        if not share_id:
            logger.error("Share ID not provided in path")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'BAD_REQUEST',
                    'message': 'Share ID is required',
                    'requestId': request_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            }
        
        logger.info(f"Attempting to revoke share {share_id}")
        
        # Initialize repository
        table_name = os.environ.get('TABLE_NAME', 'ai-lifestyle-dev')
        repository = EncryptionRepository(table_name)
        
        # Revoke the share (this will verify ownership)
        success = repository.revoke_share(share_id, user_id)
        
        if not success:
            logger.warning(f"Share {share_id} not found or user {user_id} not authorized")
            metrics.add_metric(name="ShareRevocationNotFound", unit=MetricUnit.Count, value=1)
            
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'NOT_FOUND',
                    'message': 'Share not found or you are not authorized to revoke it',
                    'requestId': request_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            }
        
        # Add metrics
        metrics.add_metric(name="ShareRevocationRequests", unit=MetricUnit.Count, value=1)
        metrics.add_metric(name="SuccessfulShareRevocations", unit=MetricUnit.Count, value=1)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': json.dumps({
                'shareId': share_id,
                'status': 'revoked',
                'revokedAt': datetime.now(timezone.utc).isoformat(),
                'message': 'Share successfully revoked'
            })
        }
        
    except Exception as e:
        logger.error(f"Unexpected error revoking share: {str(e)}", exc_info=True)
        metrics.add_metric(name="ShareRevocationErrors", unit=MetricUnit.Count, value=1)
        
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
