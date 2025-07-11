"""
Lambda handler for user registration endpoint.
"""
import json
import logging
import os
import traceback
from datetime import datetime
from typing import Any, Dict
from uuid import uuid4

from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.metrics.base import MetricResolution
from pydantic import ValidationError as PydanticValidationError

from .errors import (
    RegistrationError,
    UserAlreadyExistsError,
    ValidationError,
)
from .models import (
    ErrorResponse,
    RegisterRequest,
    RegisterResponse,
    ValidationError as ValidationErrorModel,
    ValidationErrorResponse,
)
from .service import RegistrationService

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics(namespace="AILifestyleApp")

# Set up standard logging
logging.basicConfig(level=os.environ.get('LOG_LEVEL', 'INFO'))


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True, raise_on_empty_metrics=False)
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for user registration.
    
    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context object
        
    Returns:
        API Gateway Lambda proxy response
    """
    print("=== REGISTRATION HANDLER START ===")
    
    # Debug: Log the raw event
    logger.info("Raw event received", extra={"event_keys": list(event.keys())})
    
    request_id = str(uuid4())
    logger.append_keys(request_id=request_id)
    
    # Wrap everything in a try-catch to ensure we always return a response
    try:
        # Add registration attempt metric inside try block
        metrics.add_metric(name="RegistrationAttempts", unit=MetricUnit.Count, value=1)
        
        result = _handle_registration(event, context, request_id)
        print(f"=== REGISTRATION HANDLER END - Returning status: {result.get('statusCode', 'unknown')} ===")
        return result
    except Exception as e:
        logger.error("Unhandled exception in handler wrapper", exc_info=True, extra={
            "error_type": type(e).__name__,
            "error_message": str(e)
        })
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({
                "error": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "request_id": request_id
            })
        }


def _handle_registration(event: Dict[str, Any], context: Any, request_id: str) -> Dict[str, Any]:
    """Internal function to handle registration logic"""
    
    try:
        # Get source IP - handle both v1 and v2 formats
        source_ip = None
        if "requestContext" in event:
            if "http" in event["requestContext"]:  # v2 format
                source_ip = event["requestContext"]["http"].get("sourceIp")
            elif "identity" in event["requestContext"]:  # v1 format
                source_ip = event["requestContext"]["identity"].get("sourceIp")
        
        # Log incoming request (without sensitive data)
        logger.info("Processing registration request", extra={
            "path": event.get("path"),
            "method": event.get("httpMethod"),
            "source_ip": source_ip
        })
        
        # Parse and validate request body
        body = json.loads(event.get("body", "{}"))
        logger.info("Parsed request body", extra={"body_keys": list(body.keys())})
        
        try:
            request = RegisterRequest(**body)
            logger.info("RegisterRequest created successfully", extra={"email": request.email})
        except PydanticValidationError as e:
            logger.error("Pydantic validation failed", extra={"errors": e.errors()})
            # Convert Pydantic validation errors to our format
            validation_errors = []
            for error in e.errors():
                field_path = ".".join(str(loc) for loc in error["loc"])
                validation_errors.append(
                    ValidationErrorModel(
                        field=field_path,
                        message=error["msg"]
                    )
                )
            
            response = ValidationErrorResponse(
                validation_errors=validation_errors,
                request_id=request_id
            )
            
            response_body = response.model_dump_json()
            result = {
                "statusCode": 400,
                "headers": get_response_headers(),
                "body": response_body
            }
            logger.info("Returning validation error response", extra={
                "status_code": 400,
                "validation_errors_count": len(validation_errors)
            })
            return result
        
        # Process registration
        logger.info("Creating RegistrationService")
        try:
            service = RegistrationService()
            logger.info("RegistrationService created successfully")
        except Exception as e:
            logger.error("Failed to create RegistrationService", exc_info=True, extra={
                "error_type": type(e).__name__,
                "error_message": str(e)
            })
            raise
            
        logger.info("Calling register_user")
        result = service.register_user(request)
        
        # Track successful registration metric
        metrics.add_metric(name="SuccessfulRegistrations", unit=MetricUnit.Count, value=1)
        
        logger.info("Registration successful", extra={
            "user_id": str(result.userId),
            "email": result.email
        })
        
        return {
            "statusCode": 201,
            "headers": get_response_headers(),
            "body": result.model_dump_json()
        }
        
    except UserAlreadyExistsError as e:
        logger.warning("User already exists", extra={"email": e.details.get("email")})
        metrics.add_metric(name="DuplicateRegistrationAttempts", unit=MetricUnit.Count, value=1)
        
        response = ErrorResponse(
            error="USER_ALREADY_EXISTS",
            message="Email address is already registered",
            request_id=request_id
        )
        
        return {
            "statusCode": 409,
            "headers": get_response_headers(),
            "body": response.model_dump_json()
        }
        
    except RegistrationError as e:
        logger.error("Registration error", extra={
            "error_code": e.error_code,
            "details": e.details
        })
        metrics.add_metric(name="RegistrationErrors", unit=MetricUnit.Count, value=1)
        
        response = ErrorResponse(
            error=e.error_code,
            message=e.message,
            details=e.details,
            request_id=request_id
        )
        
        return {
            "statusCode": 400,
            "headers": get_response_headers(),
            "body": response.model_dump_json()
        }
        
    except Exception as e:
        logger.error("Unexpected error", extra={
            "error": str(e),
            "traceback": traceback.format_exc()
        })
        metrics.add_metric(name="UnexpectedErrors", unit=MetricUnit.Count, value=1)
        
        response = ErrorResponse(
            error="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred",
            request_id=request_id
        )
        
        return {
            "statusCode": 500,
            "headers": get_response_headers(),
            "body": response.model_dump_json()
        }
    
    # This should never be reached, but just in case
    logger.error("Handler reached end without returning a response")
    return {
        "statusCode": 500,
        "headers": get_response_headers(),
        "body": json.dumps({"error": "INTERNAL_ERROR", "message": "No response generated"})
    }


def get_response_headers() -> Dict[str, str]:
    """Get standard response headers"""
    try:
        correlation_id = logger.get_correlation_id() or ""
    except:
        correlation_id = ""
        
    return {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": os.environ.get("CORS_ORIGIN", "*"),
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "X-Request-ID": correlation_id
    }
