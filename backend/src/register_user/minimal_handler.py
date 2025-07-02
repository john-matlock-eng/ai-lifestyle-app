"""
Minimal registration handler for debugging
"""
import json
import os
from typing import Any, Dict
from uuid import uuid4

print("Loading minimal registration handler")

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Minimal handler without decorators"""
    print("=== MINIMAL REGISTRATION HANDLER START ===")
    
    try:
        # Parse body
        body = json.loads(event.get("body", "{}"))
        print(f"Parsed body: {body}")
        
        # Check environment variables
        user_pool_id = os.environ.get('COGNITO_USER_POOL_ID', 'NOT_SET')
        client_id = os.environ.get('COGNITO_CLIENT_ID', 'NOT_SET')
        table_name = os.environ.get('USERS_TABLE_NAME', 'NOT_SET')
        
        print(f"Environment - Pool: {user_pool_id}, Client: {client_id}, Table: {table_name}")
        
        # For now, just return a test response
        response = {
            "statusCode": 201,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "message": "Minimal handler test",
                "received": body,
                "env_check": {
                    "pool_id_set": user_pool_id != 'NOT_SET',
                    "client_id_set": client_id != 'NOT_SET',
                    "table_name_set": table_name != 'NOT_SET'
                }
            })
        }
        
        print(f"Returning response: {response}")
        return response
        
    except Exception as e:
        print(f"Error in minimal handler: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "error": "MINIMAL_HANDLER_ERROR",
                "message": str(e)
            })
        }
