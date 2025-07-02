"""
Main Lambda handler that routes requests to appropriate function handlers.
This aligns with the GitHub Actions workflow that deploys a single Lambda.
Supports both API Gateway v1 (REST) and v2 (HTTP) event formats.
"""
import json
import os
from typing import Any, Dict

# Import all endpoint handlers
from register_user.minimal_handler import lambda_handler as register_user_handler_minimal
from register_user.handler import lambda_handler as register_user_handler
from health import handler as health_check_handler
from login_user.handler import lambda_handler as login_user_handler
from debug import handler as debug_handler
from refresh_token.handler import lambda_handler as refresh_token_handler
from get_user_profile.handler import lambda_handler as get_user_profile_handler
# Future imports:
# from update_user_profile.handler import lambda_handler as update_user_profile_handler


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler that routes requests based on path and method.
    
    Args:
        event: API Gateway Lambda proxy event (v1 or v2)
        context: Lambda context object
        
    Returns:
        API Gateway Lambda proxy response
    """
    # Log the incoming event for debugging (sanitized)
    # Never log the body which may contain passwords
    sanitized_event = {
        "httpMethod": event.get("httpMethod"),
        "path": event.get("path"),
        "headers": "<redacted>",
        "requestContext": {
            "requestId": event.get("requestContext", {}).get("requestId"),
            "accountId": event.get("requestContext", {}).get("accountId"),
            "stage": event.get("requestContext", {}).get("stage")
        } if "requestContext" in event else None
    }
    print(f"Incoming request: {json.dumps(sanitized_event)}")
    
    # Try to extract HTTP method and path for both v1 and v2 formats
    # API Gateway v2 (HTTP API) format
    if "requestContext" in event and "http" in event.get("requestContext", {}):
        http_method = event["requestContext"]["http"]["method"].upper()
        path = event["requestContext"]["http"]["path"]
        # Remove stage from path if present
        if path.startswith("/$default"):
            path = path[9:]  # Remove "/$default" prefix
    # API Gateway v1 (REST API) format
    elif "httpMethod" in event:
        http_method = event.get("httpMethod", "").upper()
        path = event.get("path", "")
    else:
        # Unknown format, try to get from top-level
        http_method = event.get("httpMethod", event.get("method", "")).upper()
        path = event.get("path", event.get("rawPath", ""))
    
    # Log extracted values
    print(f"Extracted method: {http_method}, path: {path}")
    
    # Route to appropriate handler based on path and method
    route_key = f"{http_method} {path}"
    
    # Define routing table
    routes = {
        "GET /health": health_check_handler,
        "POST /auth/register": register_user_handler,
        "POST /auth/register-test": register_user_handler_minimal,  # Test minimal handler
        "POST /auth/login": login_user_handler,
        "GET /debug": debug_handler,  # Debug endpoint to inspect events
        "POST /auth/refresh": refresh_token_handler,
        "GET /users/profile": get_user_profile_handler,
        # "PUT /users/profile": update_user_profile_handler,
    }
    
    # Find and execute the appropriate handler
    handler = routes.get(route_key)
    
    if handler:
        # Ensure the event has the expected format for handlers
        # Convert v2 format to v1 format if needed
        if "httpMethod" not in event:
            event["httpMethod"] = http_method
            event["path"] = path
            
        print(f"Calling handler for route: {route_key}")
        response = handler(event, context)
        print(f"Handler returned response with status: {response.get('statusCode', 'unknown')}")
        return response
    else:
        # Return 404 for unmatched routes
        request_id = None
        if context and hasattr(context, 'aws_request_id'):
            request_id = context.aws_request_id
        elif "requestContext" in event:
            request_id = event["requestContext"].get("requestId", "unknown")
        else:
            request_id = "unknown"
            
        error_response = {
            "error": "NOT_FOUND",
            "message": f"Route {route_key} not found",
            "timestamp": request_id,
            "debug": {
                "method": http_method,
                "path": path,
                "available_routes": list(routes.keys())
            }
        }
        
        # Return proper format based on API Gateway version
        if "requestContext" in event and "http" in event.get("requestContext", {}):
            # v2 format response
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
                },
                "body": json.dumps(error_response)
            }
        else:
            # v1 format response
            return {
                "statusCode": 404,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
                },
                "body": json.dumps(error_response)
            }
