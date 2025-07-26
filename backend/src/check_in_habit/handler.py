
import json
"""Lambda handler for habit check-in."""

import logging
import os
from typing import Any, Dict

from habits_common.errors import HabitConflictError, HabitError, HabitNotFoundError, ValidationError
from habits_common.models import HabitCheckInRequest
from habits_common.service import HabitService

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

# Initialize service
table_name = os.environ.get("TABLE_NAME", "ai-lifestyle-dev")
service = HabitService(table_name)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for checking in a habit.

    POST /habits/{habitId}/check-in
    Body: {
        "completed": true,
        "note": "optional note",
        "value": 10.5  // optional for measurable habits
    }
    """
    logger.info(f"Received event: {json.dumps(event)}")

    # Handle OPTIONS request for CORS
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
            "body": "",
        }

    try:
        # Extract user ID from authorizer context
        user_id = event["requestContext"]["authorizer"]["jwt"]["claims"]["sub"]

        # Extract habit ID from path parameters
        habit_id = event["pathParameters"]["habitId"]

        # Parse request body
        body = json.loads(event["body"])
        request = HabitCheckInRequest(**body)

        # Perform check-in
        check_in_response = service.check_in_habit(user_id, habit_id, request)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
            "body": json.dumps(check_in_response.dict(by_alias=True), default=str),
        }

    except json.JSONDecodeError:
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Bad Request", "message": "Invalid JSON in request body"}),
        }
    except ValidationError as e:
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Validation Error", "message": str(e)}),
        }
    except HabitNotFoundError as e:
        return {
            "statusCode": 404,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Not Found", "message": str(e)}),
        }
    except HabitConflictError as e:
        return {
            "statusCode": 409,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Conflict", "message": str(e)}),
        }
    except KeyError as e:
        logger.error(f"Missing required field: {str(e)}")
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps(
                {"error": "Bad Request", "message": f"Missing required field: {str(e)}"}
            ),
        }
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
            "body": json.dumps(
                {"error": "Internal Server Error", "message": "An unexpected error occurred"}
            ),
        }
