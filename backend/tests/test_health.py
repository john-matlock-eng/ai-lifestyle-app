
import json
"""
Tests for health check Lambda
"""

import os

# Set environment variables before importing
os.environ["ENVIRONMENT"] = "test"
os.environ["USERS_TABLE_NAME"] = "users-test"

from health import handler


def test_health_check_success(lambda_context, api_gateway_event, mock_dynamodb):
    """Test successful health check"""
    # Call handler
    response = handler(api_gateway_event, lambda_context)

    # Verify response
    assert response["statusCode"] == 200
    assert "Content-Type" in response["headers"]
    assert response["headers"]["Content-Type"] == "application/json"

    # Parse body
    body = json.loads(response["body"])
    assert body["status"] == "healthy"
    assert body["request_id"] == "test-request-id"
    assert "system" in body
    assert "checks" in body
    assert body["checks"]["dynamodb"]["status"] == "healthy"


def test_health_check_dynamodb_failure(lambda_context, api_gateway_event, mock_dynamodb):
    """Test health check with DynamoDB failure"""
    # Mock DynamoDB failure
    mock_dynamodb.describe_table.side_effect = Exception("Table not found")

    # Call handler
    response = handler(api_gateway_event, lambda_context)

    # Verify response
    assert response["statusCode"] == 200  # Still returns 200 but with degraded status

    # Parse body
    body = json.loads(response["body"])
    assert body["status"] == "degraded"
    assert body["checks"]["dynamodb"]["status"] == "unhealthy"
    assert "error" in body["checks"]["dynamodb"]


def test_system_info_included(lambda_context, api_gateway_event, mock_dynamodb):
    """Test that system info is included in response"""
    # Call handler
    response = handler(api_gateway_event, lambda_context)

    # Parse body
    body = json.loads(response["body"])
    system_info = body["system"]

    # Verify system info
    assert system_info["environment"] == "test"
    assert "timestamp" in system_info
    assert "runtime" in system_info
    assert "memory_limit" in system_info
    assert "region" in system_info
    assert system_info["region"] == "us-east-1"
