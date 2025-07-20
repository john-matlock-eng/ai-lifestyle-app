"""
Common response utilities for Lambda handlers.
Ensures consistent CORS headers across all responses.
"""

import json
import os
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Dict, Optional


class CustomJSONEncoder(json.JSONEncoder):
    """
    Custom JSON encoder that handles datetime objects and other special types.
    """

    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        elif isinstance(obj, Decimal):
            return float(obj)
        elif hasattr(obj, "__dict__"):
            return obj.__dict__
        return super().default(obj)


def create_response(
    status_code: int,
    body: Any,
    request_id: str,
    additional_headers: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """
    Create a standardized Lambda response with CORS headers.

    Args:
        status_code: HTTP status code
        body: Response body (will be JSON serialized if not a string)
        request_id: AWS request ID for tracking
        additional_headers: Optional additional headers

    Returns:
        Lambda proxy response dict
    """
    cors_origin = os.environ.get("CORS_ORIGIN", "*")

    headers = {
        "Content-Type": "application/json",
        "X-Request-ID": request_id,
        "Access-Control-Allow-Origin": cors_origin,
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    }

    # Add credentials support only if not using wildcard origin
    if cors_origin != "*":
        headers["Access-Control-Allow-Credentials"] = "true"

    # Merge additional headers if provided
    if additional_headers:
        headers.update(additional_headers)

    # Serialize body if it's not already a string
    if not isinstance(body, str):
        # Use custom encoder to handle datetime and other types
        body = json.dumps(body, cls=CustomJSONEncoder)

    return {"statusCode": status_code, "headers": headers, "body": body}


def create_error_response(
    status_code: int,
    error_code: str,
    message: str,
    request_id: str,
    additional_details: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Create a standardized error response with CORS headers.

    Args:
        status_code: HTTP status code
        error_code: Application-specific error code
        message: Human-readable error message
        request_id: AWS request ID for tracking
        additional_details: Optional additional error details

    Returns:
        Lambda proxy response dict
    """
    from datetime import datetime, timezone

    error_body = {
        "error": error_code,
        "message": message,
        "request_id": request_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # Add additional details if provided
    if additional_details:
        error_body.update(additional_details)

    return create_response(status_code=status_code, body=error_body, request_id=request_id)
