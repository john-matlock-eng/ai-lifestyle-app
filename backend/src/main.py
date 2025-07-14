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
from verify_email.handler import lambda_handler as verify_email_handler
from setup_mfa.handler import lambda_handler as setup_mfa_handler
from verify_mfa_setup.handler import lambda_handler as verify_mfa_setup_handler
from verify_mfa.handler import lambda_handler as verify_mfa_handler
# Goal endpoints
from create_goal.handler import lambda_handler as create_goal_handler
from get_goal.handler import lambda_handler as get_goal_handler
from list_goals.handler import lambda_handler as list_goals_handler
from update_goal.handler import lambda_handler as update_goal_handler
from archive_goal.handler import lambda_handler as archive_goal_handler
from log_activity.handler import lambda_handler as log_activity_handler
from list_activities.handler import lambda_handler as list_activities_handler
from get_progress.handler import lambda_handler as get_progress_handler
# Journal endpoints
from create_journal_entry.handler import lambda_handler as create_journal_entry_handler
from get_journal_entry.handler import lambda_handler as get_journal_entry_handler
from list_journal_entries.handler import lambda_handler as list_journal_entries_handler
from update_journal_entry.handler import lambda_handler as update_journal_entry_handler
from delete_journal_entry.handler import lambda_handler as delete_journal_entry_handler
from get_journal_stats.handler import lambda_handler as get_journal_stats_handler
from update_user_profile.handler import lambda_handler as update_user_profile_handler
from get_user_by_email.handler import lambda_handler as get_user_by_email_handler
from get_user_by_id.handler import lambda_handler as get_user_by_id_handler
# Encryption endpoints
from setup_encryption.handler import lambda_handler as setup_encryption_handler
from check_encryption.handler import lambda_handler as check_encryption_handler
from get_user_public_key.handler import lambda_handler as get_user_public_key_handler
from create_share.handler import lambda_handler as create_share_handler
from create_ai_share.handler import lambda_handler as create_ai_share_handler
from list_shares.handler import lambda_handler as list_shares_handler
from revoke_share.handler import lambda_handler as revoke_share_handler
from setup_recovery.handler import lambda_handler as setup_recovery_handler
from delete_encryption_keys.handler import lambda_handler as delete_encryption_keys_handler


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
        "GET /users/by-email/{email}": get_user_by_email_handler,
        "GET /users/{userId}": get_user_by_id_handler,
        "POST /auth/email/verify": verify_email_handler,
        "POST /auth/mfa/setup": setup_mfa_handler,
        "POST /auth/mfa/verify-setup": verify_mfa_setup_handler,
        "POST /auth/mfa/verify": verify_mfa_handler,
        # Goal endpoints
        "GET /goals": list_goals_handler,
        "POST /goals": create_goal_handler,
        "GET /goals/{goalId}": get_goal_handler,
        "PUT /goals/{goalId}": update_goal_handler,
        "DELETE /goals/{goalId}": archive_goal_handler,
        "GET /goals/{goalId}/activities": list_activities_handler,
        "POST /goals/{goalId}/activities": log_activity_handler,
        "GET /goals/{goalId}/progress": get_progress_handler,
        # Journal endpoints
        "GET /journal": list_journal_entries_handler,
        "POST /journal": create_journal_entry_handler,
        "GET /journal/{entryId}": get_journal_entry_handler,
        "PUT /journal/{entryId}": update_journal_entry_handler,
        "DELETE /journal/{entryId}": delete_journal_entry_handler,
        "GET /journal/stats": get_journal_stats_handler,
        "PUT /users/profile": update_user_profile_handler,
        # Encryption endpoints
        "POST /encryption/setup": setup_encryption_handler,
        "GET /encryption/check/{userId}": check_encryption_handler,
        "GET /encryption/user/{userId}": get_user_public_key_handler,
        "POST /encryption/shares": create_share_handler,
        "GET /encryption/shares": list_shares_handler,
        "POST /encryption/ai-shares": create_ai_share_handler,
        "DELETE /encryption/shares/{shareId}": revoke_share_handler,
        "POST /encryption/recovery": setup_recovery_handler,
        "DELETE /encryption/keys": delete_encryption_keys_handler,
    }
    
    # Find and execute the appropriate handler
    handler = routes.get(route_key)
    
    # If no exact match, check for path parameter routes
    if not handler:
        # Check if this might be a path with parameters
        path_parts = path.split('/')
        
        # Check for goal-specific routes with {goalId}
        if len(path_parts) >= 3 and path_parts[1] == 'goals':
            # Extract goalId for path parameter
            goal_id = path_parts[2]
            
            # Add path parameters to event if not present
            if 'pathParameters' not in event:
                event['pathParameters'] = {}
            event['pathParameters']['goalId'] = goal_id
            
            # Check for specific goal endpoints
            if len(path_parts) == 3:
                # /goals/{goalId}
                if http_method == 'GET':
                    handler = get_goal_handler
                elif http_method == 'PUT':
                    handler = update_goal_handler
                elif http_method == 'DELETE':
                    handler = archive_goal_handler
            elif len(path_parts) == 4:
                # /goals/{goalId}/activities or /goals/{goalId}/progress
                if path_parts[3] == 'activities':
                    if http_method == 'GET':
                        handler = list_activities_handler
                    elif http_method == 'POST':
                        handler = log_activity_handler
                elif path_parts[3] == 'progress' and http_method == 'GET':
                    handler = get_progress_handler
        
        # Check for journal-specific routes with {entryId}
        elif len(path_parts) >= 3 and path_parts[1] == 'journal':
            # Check if this is /journal/stats first (no path parameter)
            if len(path_parts) == 3 and path_parts[2] == 'stats' and http_method == 'GET':
                handler = get_journal_stats_handler
            # Otherwise, treat as journal entry ID
            elif len(path_parts) == 3:
                # Extract entryId for path parameter
                entry_id = path_parts[2]
                
                # Add path parameters to event if not present
                if 'pathParameters' not in event:
                    event['pathParameters'] = {}
                event['pathParameters']['entryId'] = entry_id
                
                # /journal/{entryId}
                if http_method == 'GET':
                    handler = get_journal_entry_handler
                elif http_method == 'PUT':
                    handler = update_journal_entry_handler
                elif http_method == 'DELETE':
                    handler = delete_journal_entry_handler
        
        # Check for encryption-specific routes with parameters
        elif len(path_parts) >= 3 and path_parts[1] == 'encryption':
            if len(path_parts) >= 4 and path_parts[2] == 'check':
                # /encryption/check/{userId}
                user_id = path_parts[3]
                if 'pathParameters' not in event:
                    event['pathParameters'] = {}
                event['pathParameters']['userId'] = user_id
                if http_method == 'GET':
                    handler = check_encryption_handler
            elif len(path_parts) >= 4 and path_parts[2] == 'user':
                # /encryption/user/{userId}
                user_id = path_parts[3]
                if 'pathParameters' not in event:
                    event['pathParameters'] = {}
                event['pathParameters']['userId'] = user_id
                if http_method == 'GET':
                    handler = get_user_public_key_handler
            elif len(path_parts) >= 4 and path_parts[2] == 'shares':
                # /encryption/shares/{shareId}
                share_id = path_parts[3]
                if 'pathParameters' not in event:
                    event['pathParameters'] = {}
                event['pathParameters']['shareId'] = share_id
                if http_method == 'DELETE':
                    handler = revoke_share_handler
        
        # Check for user-specific routes with email parameter
        elif len(path_parts) >= 4 and path_parts[1] == 'users' and path_parts[2] == 'by-email':
            # /users/by-email/{email}
            email = path_parts[3]
            if 'pathParameters' not in event:
                event['pathParameters'] = {}
            event['pathParameters']['email'] = email
            if http_method == 'GET':
                handler = get_user_by_email_handler
        
        # Check for user-specific routes with userId parameter
        elif len(path_parts) == 3 and path_parts[1] == 'users':
            # /users/{userId}
            user_id = path_parts[2]
            # Skip if it's a known static route
            if user_id not in ['profile', 'by-email']:
                if 'pathParameters' not in event:
                    event['pathParameters'] = {}
                event['pathParameters']['userId'] = user_id
                if http_method == 'GET':
                    handler = get_user_by_id_handler
    
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
