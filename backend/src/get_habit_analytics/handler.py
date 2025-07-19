"""Lambda handler for getting habit analytics."""
import json
import logging
import os
from typing import Any, Dict

from habits_common.service import HabitService
from habits_common.errors import HabitError, HabitNotFoundError, ValidationError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize service
TABLE_NAME = os.environ.get('TABLE_NAME', 'ai-lifestyle-dev')
service = HabitService(TABLE_NAME)

# CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda handler for getting habit analytics."""
    try:
        # Log the incoming event
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Handle OPTIONS request for CORS
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': CORS_HEADERS,
                'body': ''
            }
        
        # Extract user ID from authorizer
        user_id = event['requestContext']['authorizer']['claims']['sub']
        
        # Extract habit ID from path parameters
        habit_id = event['pathParameters']['habitId']
        
        # Extract period from query parameters (default to 'month')
        query_params = event.get('queryStringParameters', {}) or {}
        period = query_params.get('period', 'month')
        
        # Get habit analytics
        analytics = service.get_habit_analytics(user_id, habit_id, period)
        
        # Convert to response format
        response_body = analytics.dict(by_alias=True)
        
        return {
            'statusCode': 200,
            'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
            'body': json.dumps(response_body, default=str)
        }
        
    except HabitNotFoundError as e:
        logger.warning(f"Habit not found: {str(e)}")
        return {
            'statusCode': 404,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'error': 'Not Found',
                'message': str(e)
            })
        }
        
    except ValidationError as e:
        logger.warning(f"Validation error: {str(e)}")
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'error': 'Validation Error',
                'message': str(e)
            })
        }
        
    except HabitError as e:
        logger.error(f"Habit error: {str(e)}")
        return {
            'statusCode': e.status_code,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'error': e.__class__.__name__,
                'message': str(e)
            })
        }
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'error': 'Internal Server Error',
                'message': 'An unexpected error occurred'
            })
        }
