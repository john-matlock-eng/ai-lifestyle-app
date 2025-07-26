import json

"""
Simplified test handler for debugging registration issues
"""

import os
from typing import Any, Dict


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Simple test handler"""
    print("=== TEST REGISTRATION HANDLER ===")

    try:
        # Parse body
        body = json.loads(event.get("body", "{}"))
        print(f"Body: {body}")

        # Basic validation
        required_fields = ["email", "password", "firstName", "lastName"]
        missing_fields = [f for f in required_fields if f not in body]

        if missing_fields:
            return {
                "statusCode": 400,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps(
                    {
                        "error": "VALIDATION_ERROR",
                        "message": f"Missing required fields: {missing_fields}",
                    }
                ),
            }

        # For now, just return success
        return {
            "statusCode": 201,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "userId": "test-user-id",
                    "email": body["email"],
                    "message": "Test registration successful",
                }
            ),
        }

    except Exception as e:
        print(f"Error: {e}")
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "INTERNAL_ERROR", "message": str(e)}),
        }
