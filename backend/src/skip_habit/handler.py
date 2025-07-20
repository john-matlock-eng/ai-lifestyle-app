"""Lambda handler for skipping a habit."""

import json
import logging
import os
from typing import Any, Dict

from habits_common.errors import HabitError, HabitNotFoundError, ValidationError
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
    """Lambda handler for skipping a habit."""
    try:
        # Log the incoming event
        logger.info(f"Received event: {json.dumps(event)}")

        # Handle OPTIONS request for CORS
        if event.get("httpMethod") == "OPTIONS":
            return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

        # Extract user ID from authorizer
        user_id = event["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]

        # Extract habit ID from path parameters
        habit_id = event["pathParameters"]["habitId"]

        # Skip habit for today
        service.skip_habit(user_id, habit_id)

        return {
            "statusCode": 200,
            "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
            "body": json.dumps({"message": "Habit skipped successfully", "habitId": habit_id}),
        }

    except HabitNotFoundError as e:
        logger.warning(f"Habit not found: {str(e)}")
        return {
            "statusCode": 404,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": "Not Found", "message": str(e)}),
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
