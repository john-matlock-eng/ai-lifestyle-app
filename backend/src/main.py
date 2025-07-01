"""
Main Lambda handler that routes requests to appropriate function handlers.
This aligns with the GitHub Actions workflow that deploys a single Lambda.
"""
import json
import os
from typing import Any, Dict

# Import all endpoint handlers
from register_user.handler import lambda_handler as register_user_handler
from health import handler as health_check_handler
# Future imports:
# from login_user.handler import lambda_handler as login_user_handler
# from refresh_token.handler import lambda_handler as refresh_token_handler
# from get_user_profile.handler import lambda_handler as get_user_profile_handler
# from update_user_profile.handler import lambda_handler as update_user_profile_handler


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler that routes requests based on path and method.
    
    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context object
        
    Returns:
        API Gateway Lambda proxy response
    """
    # Extract HTTP method and path
    http_method = event.get("httpMethod", "").upper()
    path = event.get("path", "")
    
    # Route to appropriate handler based on path and method
    route_key = f"{http_method} {path}"
    
    # Define routing table
    routes = {
        "GET /health": health_check_handler,
        "POST /auth/register": register_user_handler,
        # "POST /auth/login": login_user_handler,
        # "POST /auth/refresh": refresh_token_handler,
        # "GET /users/profile": get_user_profile_handler,
        # "PUT /users/profile": update_user_profile_handler,
    }
    
    # Find and execute the appropriate handler
    handler = routes.get(route_key)
    
    if handler:
        return handler(event, context)
    else:
        # Return 404 for unmatched routes
        return {
            "statusCode": 404,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
            },
            "body": json.dumps({
                "error": "NOT_FOUND",
                "message": f"Route {route_key} not found",
                "timestamp": context.aws_request_id if context else "unknown"
            })
        }

