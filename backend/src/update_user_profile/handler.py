"""
Lambda handler for updating user profile.
"""

import json
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, Response
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.event_handler.exceptions import (
    NotFoundError,
    BadRequestError,
    InternalServerError
)

from user_profile_common import UpdateUserProfileRequest, ErrorResponse
from .service import UpdateUserProfileService

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
app = APIGatewayRestResolver()

# Initialize service
service = UpdateUserProfileService()


@app.put("/users/profile")
@tracer.capture_method
def update_user_profile() -> Dict[str, Any]:
    """
    Update authenticated user's profile.
    
    Returns:
        Updated user profile
        
    Raises:
        BadRequestError: For invalid request data
        NotFoundError: If user not found
        InternalServerError: For server errors
    """
    try:
        # Get user ID from JWT claims
        user_id = app.current_event.request_context.authorizer.claims.get("sub")
        if not user_id:
            logger.error("No user ID in JWT claims")
            raise BadRequestError("Invalid authentication token")
        
        # Parse and validate request body
        try:
            body = json.loads(app.current_event.body or "{}")
            request = UpdateUserProfileRequest(**body)
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(f"Invalid request body: {str(e)}")
            raise BadRequestError(f"Invalid request format: {str(e)}")
        
        # Update profile
        updated_profile = service.update_profile(user_id, request)
        
        # Return updated profile
        return {
            "statusCode": 200,
            "body": json.dumps(updated_profile.model_dump(mode="json")),
            "headers": {
                "Content-Type": "application/json"
            }
        }
        
    except ValueError as e:
        if "not found" in str(e).lower():
            raise NotFoundError(str(e))
        raise BadRequestError(str(e))
    except BadRequestError:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise InternalServerError(f"Failed to update profile: {str(e)}")


@app.exception_handler(BadRequestError)
def handle_bad_request(e: BadRequestError) -> Response:
    """Handle bad request errors."""
    error_response = ErrorResponse(
        error="BAD_REQUEST",
        message=str(e),
        request_id=app.lambda_context.aws_request_id
    )
    
    return Response(
        status_code=400,
        body=json.dumps(error_response.model_dump(mode="json")),
        headers={
            "Content-Type": "application/json"
        }
    )


@app.exception_handler(NotFoundError)
def handle_not_found(e: NotFoundError) -> Response:
    """Handle not found errors."""
    error_response = ErrorResponse(
        error="NOT_FOUND",
        message=str(e),
        request_id=app.lambda_context.aws_request_id
    )
    
    return Response(
        status_code=404,
        body=json.dumps(error_response.model_dump(mode="json")),
        headers={
            "Content-Type": "application/json"
        }
    )


@app.exception_handler(InternalServerError)
def handle_internal_error(e: InternalServerError) -> Response:
    """Handle internal server errors."""
    error_response = ErrorResponse(
        error="INTERNAL_SERVER_ERROR",
        message="An internal error occurred",
        request_id=app.lambda_context.aws_request_id
    )
    
    return Response(
        status_code=500,
        body=json.dumps(error_response.model_dump(mode="json")),
        headers={
            "Content-Type": "application/json"
        }
    )


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda entry point.
    
    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context
        
    Returns:
        API Gateway Lambda proxy response
    """
    return app.resolve(event, context)