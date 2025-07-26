import json

"""Lambda handler for creating a new habit."""

import logging
import os
from typing import Any, Dict

from habits_common.errors import HabitError, ValidationError
from habits_common.models import CreateHabitRequest, HabitResponse
from habits_common.service import HabitService

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize service
TABLE_NAME = os.environ.get("TABLE_NAME", "ai-lifestyle-dev")
service = HabitService(TABLE_NAME)

# CORS headers
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
}


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Lambda handler for creating a habit."""
    try:
        # Log the incoming event
        logger.info(f"Received event: {json.dumps(event)}")

        # Handle OPTIONS request for CORS
        if event.get("httpMethod") == "OPTIONS":
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

        # Extract user ID from authorizer
        user_id = event["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]

        # Parse request body
        body = json.loads(event.get("body", "{}"))

        # Validate request
        try:
            request = CreateHabitRequest(**body)
        except Exception as e:
            logger.error(f"Request validation failed: {str(e)}")
            return {
                "statusCode": 400,
                "headers": CORS_HEADERS,
                "body": json.dumps({"error": "Invalid request", "message": str(e)}),
            }

        # Create habit
        habit = service.create_habit(user_id, request)

        # Convert to response format
        response_body = habit.dict(by_alias=True)

        return {
            "statusCode": 201,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps(response_body, default=str),
        }

    except ValidationError as e:
        logger.warning(f"Validation error: {str(e)}")
        return {
            "statusCode": 400,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Validation Error", "message": str(e)}),
        }

    except HabitError as e:
        logger.error(f"Habit error: {str(e)}")
        return {
            "statusCode": e.status_code,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": e.__class__.__name__, "message": str(e)}),
        }

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps(
                {"error": "Internal Server Error", "message": "An unexpected error occurred"}
            ),
        }
