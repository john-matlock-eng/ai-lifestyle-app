"""
Lambda handler for listing encrypted shares.
"""

import json
import os
from datetime import datetime, timezone
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths

from encryption_common import (
    ShareListResponse, EncryptionRepository
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
    Handle share listing request.
    
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
            logger.info(f"Share listing request from user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(name="UnauthorizedShareListingAttempts", unit=MetricUnit.Count, value=1)
            
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
        
        # Extract query parameters
        query_params = event.get('queryStringParameters', {}) or {}
        item_type = query_params.get('itemType')
        direction = query_params.get('direction', 'both')  # 'sent', 'received', or 'both'
        active_only = query_params.get('activeOnly', 'true').lower() == 'true'
        
        # Initialize repository
        table_name = os.environ.get('TABLE_NAME', 'ai-lifestyle-dev')
        repository = EncryptionRepository(table_name)
        
        # Get shares based on direction
        all_shares = []
        
        if direction in ['sent', 'both']:
            # Get shares created by the user
            sent_shares = repository.get_shares_by_owner(
                owner_id=user_id,
                item_type=item_type,
                active_only=active_only
            )
            all_shares.extend(sent_shares)
            logger.info(f"Found {len(sent_shares)} sent shares")
        
        if direction in ['received', 'both']:
            # Get shares received by the user
            received_shares = repository.get_shares_for_recipient(
                recipient_id=user_id,
                item_type=item_type,
                active_only=active_only
            )
            all_shares.extend(received_shares)
            logger.info(f"Found {len(received_shares)} received shares")
        
        # Remove duplicates if any
        unique_shares = []
        seen_ids = set()
        for share in all_shares:
            if share.share_id not in seen_ids:
                unique_shares.append(share)
                seen_ids.add(share.share_id)
        
        # Sort by creation date (newest first)
        unique_shares.sort(key=lambda s: s.created_at, reverse=True)
        
        # Add metrics
        metrics.add_metric(name="ShareListingRequests", unit=MetricUnit.Count, value=1)
        metrics.add_metric(name="SharesReturned", unit=MetricUnit.Count, value=len(unique_shares))
        
        response = ShareListResponse(
            shares=unique_shares,
            total=len(unique_shares),
            has_more=False  # Simple implementation, no pagination yet
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': response.model_dump_json(by_alias=True)
        }
        
    except Exception as e:
        logger.error(f"Unexpected error listing shares: {str(e)}", exc_info=True)
        metrics.add_metric(name="ShareListingErrors", unit=MetricUnit.Count, value=1)
        
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
