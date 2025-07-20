"""
Debug handler to inspect API Gateway events
"""

import json


def handler(event, context):
    """Debug handler that returns the raw event for inspection"""

    # Extract interesting parts of the event
    debug_info = {
        "raw_event": event,
        "event_keys": list(event.keys()),
        "context_info": {
            "request_id": getattr(context, "aws_request_id", "N/A"),
            "function_name": getattr(context, "function_name", "N/A"),
            "remaining_time": getattr(context, "get_remaining_time_in_millis", lambda: "N/A")(),
        },
    }

    # Try to identify the API Gateway version
    if "requestContext" in event:
        if "http" in event.get("requestContext", {}):
            debug_info["api_gateway_version"] = "v2 (HTTP API)"
            debug_info["extracted_info"] = {
                "method": event["requestContext"]["http"].get("method"),
                "path": event["requestContext"]["http"].get("path"),
                "sourceIp": event["requestContext"]["http"].get("sourceIp"),
            }
        else:
            debug_info["api_gateway_version"] = "v1 (REST API)"
            debug_info["extracted_info"] = {
                "method": event.get("httpMethod"),
                "path": event.get("path"),
                "sourceIp": event["requestContext"].get("identity", {}).get("sourceIp"),
            }
    else:
        debug_info["api_gateway_version"] = "Unknown"

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "X-Debug-Mode": "true"},
        "body": json.dumps(debug_info, indent=2, default=str),
    }
