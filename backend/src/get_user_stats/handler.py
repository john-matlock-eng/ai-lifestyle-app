"""Lambda handler for getting user stats."""
import json
import logging
import os
from typing import Dict, Any

from habits_common.service import HabitService
from habits_common.errors import HabitError

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Initialize service
table_name = os.environ.get('TABLE_NAME', 'ai-lifestyle-dev')
service = HabitService(table_name)

# CORS headers
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for getting user gamification stats.
    
    GET /users/stats
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Handle OPTIONS request for CORS
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': CORS_HEADERS,
            'body': ''
        }
    
    try:
        # Extract user ID from authorizer context
        user_id = event['requestContext']['authorizer']['claims']['sub']
        
        # Get user stats
        stats = service.get_user_stats(user_id)
        
        # Convert to response format
        response_body = stats.dict(by_alias=True)
        
        return {
            'statusCode': 200,
            'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
            'body': json.dumps(response_body, default=str)
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
        
    except KeyError as e:
        logger.error(f"Missing required field: {str(e)}")
        return {
            'statusCode': 400,
            'headers': CORS_HEADERS,
            'body': json.dumps({
                'error': 'Bad Request',
                'message': f'Missing required field: {str(e)}'
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
