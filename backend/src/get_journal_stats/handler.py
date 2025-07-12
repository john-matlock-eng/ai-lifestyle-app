"""
Lambda handler for getting journal statistics.
"""

import json
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths

from journal_common import (
    JournalStats, TemplateUsage, JournalTemplate
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


def calculate_mock_stats(user_id: str) -> JournalStats:
    """
    Generate mock journal statistics.
    
    Args:
        user_id: User ID
        
    Returns:
        Mock journal statistics
    """
    # Calculate mock data based on current date
    now = datetime.now(timezone.utc)
    last_entry = now - timedelta(hours=2)
    
    # Calculate streak (mock: active for last 7 days)
    current_streak = 7
    longest_streak = 14
    
    # Mock template usage
    template_usage = [
        TemplateUsage(
            template=JournalTemplate.DAILY_REFLECTION,
            count=15,
            last_used=now - timedelta(days=1)
        ),
        TemplateUsage(
            template=JournalTemplate.GRATITUDE,
            count=12,
            last_used=now - timedelta(days=2)
        ),
        TemplateUsage(
            template=JournalTemplate.GOAL_PROGRESS,
            count=8,
            last_used=now - timedelta(days=3)
        ),
        TemplateUsage(
            template=JournalTemplate.MOOD_TRACKER,
            count=5,
            last_used=now - timedelta(days=5)
        )
    ]
    
    # Calculate totals
    total_entries = sum(usage.count for usage in template_usage)
    total_words = total_entries * 250  # Average 250 words per entry
    
    # Recent activity
    entries_this_week = 7
    entries_this_month = 25
    
    return JournalStats(
        total_entries=total_entries,
        total_words=total_words,
        current_streak=current_streak,
        longest_streak=longest_streak,
        last_entry_date=last_entry,
        goals_tracked=5,
        goals_completed=2,
        template_usage=template_usage,
        entries_this_week=entries_this_week,
        entries_this_month=entries_this_month,
        average_words_per_entry=total_words / total_entries if total_entries > 0 else 0
    )


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle journal statistics request.
    
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
            logger.info(f"Journal stats request for user {user_id}")
        except ValueError as e:
            logger.error(f"Failed to extract user ID: {str(e)}")
            metrics.add_metric(name="UnauthorizedJournalStatsAttempts", unit=MetricUnit.Count, value=1)
            
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
        
        # TODO: Initialize journal stats service when available
        # service = JournalStatsService()
        
        # TODO: Fetch actual statistics from database
        # stats = service.get_stats(user_id)
        
        # For now, return mock statistics
        stats = calculate_mock_stats(user_id)
        
        # Add metrics
        metrics.add_metric(name="JournalStatsRequests", unit=MetricUnit.Count, value=1)
        metrics.add_metric(name="JournalStatsCurrentStreak", unit=MetricUnit.Count, value=stats.current_streak)
        
        # Track active users (users with entries in the last 7 days)
        if stats.last_entry_date and (datetime.now(timezone.utc) - stats.last_entry_date).days < 7:
            metrics.add_metric(name="ActiveJournalUsers", unit=MetricUnit.Count, value=1)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id,
                'Cache-Control': 'max-age=300'  # Cache for 5 minutes
            },
            'body': stats.model_dump_json(by_alias=True)
        }
        
    except Exception as e:
        logger.error(f"Unexpected error during journal stats retrieval: {str(e)}", exc_info=True)
        metrics.add_metric(name="JournalStatsSystemErrors", unit=MetricUnit.Count, value=1)
        
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