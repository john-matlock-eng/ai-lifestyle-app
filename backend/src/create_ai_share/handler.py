"""
Lambda handler for creating AI analysis shares.
"""

import json
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths

from encryption_common import (
    Share, AIShareRequest, ShareType, SharePermission,
    EncryptionRepository, AI_SERVICE_ACCOUNT
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
    Handle AI share creation request.
    
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
            logger.info(f"AI share creation request from user {owner_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(name="UnauthorizedAIShareCreationAttempts", unit=MetricUnit.Count, value=1)
            
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
            request_data = AIShareRequest(**body)
        except Exception as e:
            logger.error(f"Request validation failed: {str(e)}", exc_info=True)
            metrics.add_metric(name="InvalidAIShareCreationRequests", unit=MetricUnit.Count, value=1)
            
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
        
        # For AI shares, we need to:
        # 1. Get the content keys for each item
        # 2. Re-encrypt them for the AI service
        # 3. Create time-limited, single-use shares
        
        # In a real implementation, you would:
        # 1. Fetch the items from their respective tables
        # 2. Get the encrypted content keys
        # 3. Decrypt with user's private key
        # 4. Re-encrypt with AI service's public key
        
        # For now, we'll create the share structure
        created_shares: List[Share] = []
        
        for item_id in request_data.item_ids:
            share_id = str(uuid.uuid4())
            
            # AI shares are time-limited and single-use
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=request_data.expires_in_minutes)
            
            share = Share(
                share_id=share_id,
                owner_id=owner_id,
                recipient_id=AI_SERVICE_ACCOUNT["user_id"],
                item_type=request_data.item_type,
                item_id=item_id,
                encrypted_key="",  # This would be the re-encrypted content key
                share_type=ShareType.AI,
                permissions=[SharePermission.READ],  # AI only gets read access
                expires_at=expires_at,
                max_accesses=1  # Single-use
            )
            
            # Save to database
            try:
                repository.create_share(share)
                created_shares.append(share)
            except Exception as e:
                logger.error(f"Failed to create AI share for item {item_id}: {str(e)}")
                # Continue with other items
        
        if not created_shares:
            metrics.add_metric(name="AIShareCreationFailures", unit=MetricUnit.Count, value=1)
            
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'SYSTEM_ERROR',
                    'message': 'Failed to create AI shares',
                    'requestId': request_id,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            }
        
        # Create analysis request for AI service
        analysis_request_id = str(uuid.uuid4())
        
        # In production, you would trigger the AI analysis here
        # For example, send to SQS or invoke another Lambda
        
        # Add metrics
        metrics.add_metric(name="AIShareCreationAttempts", unit=MetricUnit.Count, value=1)
        metrics.add_metric(name="SuccessfulAIShareCreations", unit=MetricUnit.Count, value=len(created_shares))
        metrics.add_metric(name=f"AIAnalysisType_{request_data.analysis_type}", unit=MetricUnit.Count, value=1)
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': json.dumps({
                'analysisRequestId': analysis_request_id,
                'sharesCreated': len(created_shares),
                'shareIds': [share.share_id for share in created_shares],
                'expiresAt': created_shares[0].expires_at.isoformat() if created_shares else None,
                'message': 'AI analysis request created successfully'
            })
        }
        
    except Exception as e:
        logger.error(f"Unexpected error during AI share creation: {str(e)}", exc_info=True)
        metrics.add_metric(name="AIShareCreationSystemErrors", unit=MetricUnit.Count, value=1)
        
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
