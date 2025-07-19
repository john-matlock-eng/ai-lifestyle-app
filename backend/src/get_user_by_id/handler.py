"""
AWS Lambda handler for get user by ID endpoint.
"""

import os
import json
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.typing import LambdaContext

from user_profile_common import ErrorResponse
from .service import UserService
from .repository import UserRepository
from .cognito_client import CognitoClient
from .errors import (
    UserError,
    UnauthorizedError,
    UserNotFoundError,
    DatabaseError,
    ValidationError
)

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")

# Environment variables
COGNITO_USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID')
COGNITO_CLIENT_ID = os.environ.get('COGNITO_CLIENT_ID')
USERS_TABLE_NAME = os.environ.get('USERS_TABLE_NAME')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    AWS Lambda handler for get user by ID.
    
    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context
        
    Returns:
        API Gateway Lambda proxy response
    """
    # Add metric for invocation
    metrics.add_metric(name="GetUserByIdRequests", unit=MetricUnit.Count, value=1)
    
    # Extract request ID for tracking
    request_id = event.get('requestContext', {}).get('requestId', 'unknown')
    
    logger.info(
        "Get user by ID request received",
        extra={
            "request_id": request_id,
            "path": event.get('path'),
            "method": event.get('httpMethod')
        }
    )
    
    try:
        # Validate environment variables
        if not all([COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID, USERS_TABLE_NAME]):
            logger.error("Missing required environment variables")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'CONFIGURATION_ERROR',
                    'message': 'Service configuration error',
                    'request_id': request_id
                })
            }
        
        # Extract Authorization header
        headers = event.get('headers', {})
        auth_header = headers.get('Authorization') or headers.get('authorization', '')
        
        if not auth_header:
            metrics.add_metric(name="MissingAuthHeader", unit=MetricUnit.Count, value=1)
            error_response = ErrorResponse(
                error="UNAUTHORIZED",
                message="Missing Authorization header",
                request_id=request_id
            )
            
            return {
                'statusCode': 401,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id,
                    'WWW-Authenticate': 'Bearer'
                },
                'body': error_response.model_dump_json()
            }
        
        # Extract user ID from path parameters
        path_params = event.get('pathParameters', {})
        user_id = path_params.get('userId')
        
        if not user_id:
            error_response = ErrorResponse(
                error="VALIDATION_ERROR",
                message="Missing userId in path",
                request_id=request_id
            )
            
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': error_response.model_dump_json()
            }
        
        # Initialize services
        repository = UserRepository(table_name=USERS_TABLE_NAME)
        cognito_client = CognitoClient(
            user_pool_id=COGNITO_USER_POOL_ID,
            client_id=COGNITO_CLIENT_ID
        )
        user_service = UserService(
            repository=repository,
            cognito_client=cognito_client
        )
        
        # Verify the caller is authenticated
        user_service.verify_auth_token(auth_header)
        
        # Get user information
        user_info = user_service.get_user_public_info(user_id)
        
        # Add success metric
        metrics.add_metric(name="SuccessfulUserRetrievals", unit=MetricUnit.Count, value=1)
        
        logger.info(
            "User information retrieved successfully",
            extra={
                "request_id": request_id,
                "requested_user_id": user_id
            }
        )
        
        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': user_info.model_dump_json()
        }
        
    except (UnauthorizedError, ValidationError) as e:
        metrics.add_metric(name="UnauthorizedRequests", unit=MetricUnit.Count, value=1)
        error_response = ErrorResponse(
            error="UNAUTHORIZED",
            message=e.message,
            details=e.details,
            request_id=request_id
        )
        
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id,
                'WWW-Authenticate': 'Bearer'
            },
            'body': error_response.model_dump_json()
        }
    
    except UserNotFoundError as e:
        metrics.add_metric(name="UserNotFoundErrors", unit=MetricUnit.Count, value=1)
        logger.warning(
            "User not found",
            extra={
                "error": str(e),
                "details": e.details,
                "request_id": request_id,
                "user_id": user_id
            }
        )
        
        error_response = ErrorResponse(
            error="USER_NOT_FOUND",
            message=e.message,
            request_id=request_id
        )
        
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': error_response.model_dump_json()
        }
    
    except DatabaseError as e:
        logger.error(
            "Database error",
            extra={
                "error": str(e),
                "details": e.details,
                "request_id": request_id
            }
        )
        
        metrics.add_metric(name="DatabaseErrors", unit=MetricUnit.Count, value=1)
        
        error_response = ErrorResponse(
            error="DATABASE_ERROR",
            message="A database error occurred",
            request_id=request_id
        )
        
        return {
            'statusCode': 503,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': error_response.model_dump_json()
        }
        
    except Exception as e:
        logger.exception(
            "Unexpected error in get user by ID handler",
            extra={
                "error": str(e),
                "request_id": request_id
            }
        )
        
        metrics.add_metric(name="GetUserByIdErrors", unit=MetricUnit.Count, value=1)
        
        error_response = ErrorResponse(
            error="INTERNAL_ERROR",
            message="An unexpected error occurred",
            request_id=request_id
        )
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': error_response.model_dump_json()
        }