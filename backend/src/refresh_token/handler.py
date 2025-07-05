"""
AWS Lambda handler for token refresh endpoint.
"""

import os
import json
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.typing import LambdaContext
from pydantic import ValidationError

from .models import RefreshTokenRequest, RefreshTokenResponse, ErrorResponse, ValidationErrorResponse
from .service import TokenRefreshService
from .cognito_client import CognitoClient
from .errors import (
    RefreshError,
    InvalidTokenError,
    ExpiredTokenError,
    RevokedTokenError
)

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")

# Environment variables
COGNITO_USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID')
COGNITO_CLIENT_ID = os.environ.get('COGNITO_CLIENT_ID')
COGNITO_CLIENT_SECRET = os.environ.get('COGNITO_CLIENT_SECRET')  # Optional
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:
    """
    AWS Lambda handler for token refresh.
    
    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context
        
    Returns:
        API Gateway Lambda proxy response
    """
    # Add metric for invocation
    metrics.add_metric(name="TokenRefreshAttempts", unit=MetricUnit.Count, value=1)
    
    # Extract request ID for tracking
    request_id = event.get('requestContext', {}).get('requestId', 'unknown')
    
    logger.info(
        "Token refresh request received",
        extra={
            "request_id": request_id,
            "path": event.get('path'),
            "method": event.get('httpMethod')
        }
    )
    
    try:
        # Validate environment variables
        if not all([COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID]):
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
        
        # Parse and validate request body
        try:
            body = json.loads(event.get('body', '{}'))
            refresh_request = RefreshTokenRequest(**body)
        except json.JSONDecodeError:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Request-ID': request_id
                },
                'body': json.dumps({
                    'error': 'INVALID_JSON',
                    'message': 'Invalid JSON in request body',
                    'request_id': request_id
                })
            }
        except ValidationError as e:
            validation_errors = []
            for error in e.errors():
                field = '.'.join(str(loc) for loc in error['loc'])
                validation_errors.append({
                    'field': field,
                    'message': error['msg']
                })
            
            error_response = ValidationErrorResponse(
                validation_errors=validation_errors,
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
        cognito_client = CognitoClient(
            user_pool_id=COGNITO_USER_POOL_ID,
            client_id=COGNITO_CLIENT_ID,
            client_secret=COGNITO_CLIENT_SECRET
        )
        token_service = TokenRefreshService(cognito_client=cognito_client)
        
        # Perform token refresh
        refresh_response = token_service.refresh_token(refresh_request)
        
        # Add success metric
        metrics.add_metric(name="SuccessfulTokenRefreshes", unit=MetricUnit.Count, value=1)
        
        logger.info(
            "Token refresh successful",
            extra={"request_id": request_id}
        )
        
        # Return success response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': refresh_response.model_dump_json()
        }
        
    except InvalidTokenError as e:
        metrics.add_metric(name="InvalidTokenRefreshes", unit=MetricUnit.Count, value=1)
        error_response = ErrorResponse(
            error="INVALID_TOKEN",
            message=e.message,
            request_id=request_id
        )
        
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': error_response.model_dump_json()
        }
        
    except ExpiredTokenError as e:
        metrics.add_metric(name="ExpiredTokenRefreshes", unit=MetricUnit.Count, value=1)
        error_response = ErrorResponse(
            error="TOKEN_EXPIRED",
            message=e.message,
            request_id=request_id
        )
        
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': error_response.model_dump_json()
        }
        
    except RevokedTokenError as e:
        metrics.add_metric(name="RevokedTokenRefreshes", unit=MetricUnit.Count, value=1)
        error_response = ErrorResponse(
            error="TOKEN_REVOKED",
            message=e.message,
            request_id=request_id
        )
        
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': request_id
            },
            'body': error_response.model_dump_json()
        }
        
    except RefreshError as e:
        logger.error(
            "Token refresh error",
            extra={
                "error": str(e),
                "details": e.details,
                "request_id": request_id
            }
        )
        
        error_response = ErrorResponse(
            error="REFRESH_ERROR",
            message=e.message,
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
        
    except Exception as e:
        logger.exception(
            "Unexpected error in token refresh handler",
            extra={
                "error": str(e),
                "request_id": request_id
            }
        )
        
        metrics.add_metric(name="TokenRefreshErrors", unit=MetricUnit.Count, value=1)
        
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
