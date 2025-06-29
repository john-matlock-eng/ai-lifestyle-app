"""
Health check Lambda handler
"""
import json
import os
import boto3
from datetime import datetime
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit

logger = Logger()
tracer = Tracer()
metrics = Metrics()

# Environment variables
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')
TABLE_NAME = os.environ.get('TABLE_NAME', 'main-dev')

# AWS clients
dynamodb = boto3.client('dynamodb')


@tracer.capture_method
def check_dynamodb():
    """Check DynamoDB connectivity"""
    try:
        response = dynamodb.describe_table(TableName=TABLE_NAME)
        return {
            "status": "healthy",
            "table_status": response['Table']['TableStatus'],
            "item_count": response['Table']['ItemCount']
        }
    except Exception as e:
        logger.error(f"DynamoDB check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }


@tracer.capture_method
def get_system_info():
    """Get system information"""
    return {
        "environment": ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat(),
        "runtime": os.environ.get('AWS_EXECUTION_ENV', 'unknown'),
        "memory_limit": os.environ.get('AWS_LAMBDA_FUNCTION_MEMORY_SIZE', 'unknown'),
        "region": os.environ.get('AWS_REGION', 'unknown'),
        "log_group": os.environ.get('AWS_LAMBDA_LOG_GROUP_NAME', 'unknown')
    }


@logger.inject_lambda_context
@tracer.capture_lambda_handler
@metrics.log_metrics(capture_cold_start_metric=True)
def handler(event, context):
    """Health check handler"""
    logger.info("Health check invoked")
    
    # Add metric
    metrics.add_metric(name="HealthCheck", unit=MetricUnit.Count, value=1)
    
    # Perform health checks
    dynamodb_status = check_dynamodb()
    system_info = get_system_info()
    
    # Overall health status
    overall_status = "healthy" if dynamodb_status["status"] == "healthy" else "degraded"
    
    response_body = {
        "status": overall_status,
        "checks": {
            "dynamodb": dynamodb_status
        },
        "system": system_info,
        "request_id": context.request_id
    }
    
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate"
        },
        "body": json.dumps(response_body)
    }
