"""
Main Lambda handler for the AI Lifestyle API
"""
import json
import os
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.event_handler import APIGatewayRestResolver
from aws_lambda_powertools.event_handler.exceptions import NotFoundError

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics()
app = APIGatewayRestResolver()

# Environment variables
TABLE_NAME = os.environ.get('TABLE_NAME', 'main-dev')
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')


@app.get("/health")
@tracer.capture_method
def health_check():
    """Health check endpoint"""
    metrics.add_metric(name="HealthCheck", unit=MetricUnit.Count, value=1)
    
    return {
        "status": "healthy",
        "environment": ENVIRONMENT,
        "table": TABLE_NAME
    }


@app.get("/users/<user_id>")
@tracer.capture_method
def get_user(user_id: str):
    """Get user by ID"""
    logger.info(f"Getting user {user_id}")
    
    # TODO: Implement DynamoDB lookup
    if user_id == "test":
        return {
            "user_id": user_id,
            "name": "Test User",
            "email": "test@example.com"
        }
    
    raise NotFoundError(f"User {user_id} not found")


@app.post("/users")
@tracer.capture_method
def create_user():
    """Create a new user"""
    try:
        body = app.current_event.json_body
        logger.info("Creating user", extra={"body": body})
        
        # TODO: Validate input
        # TODO: Save to DynamoDB
        
        return {
            "user_id": "generated-id",
            "status": "created"
        }
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise


@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Main Lambda handler"""
    logger.info("Lambda invocation", extra={"event": event})
    
    try:
        # Process the request through the API Gateway resolver
        return app.resolve(event, context)
    except Exception as e:
        logger.error(f"Unhandled error: {str(e)}", exc_info=True)
        
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "error": "Internal server error",
                "request_id": context.request_id
            })
        }
