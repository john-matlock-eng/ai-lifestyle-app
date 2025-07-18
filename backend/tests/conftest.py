"""
Test configuration and fixtures
"""
import pytest
import os
import sys
from unittest.mock import Mock

# Add src to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))


@pytest.fixture
def lambda_context():
    """Mock Lambda context"""
    context = Mock()
    context.request_id = "test-request-id"
    context.function_name = "test-function"
    context.memory_limit_in_mb = 128
    context.invoked_function_arn = "arn:aws:lambda:us-east-1:123456789012:function:test"
    context.aws_request_id = "test-request-id"
    return context


@pytest.fixture
def api_gateway_event():
    """Mock API Gateway event"""
    return {
        "version": "2.0",
        "routeKey": "GET /health",
        "rawPath": "/health",
        "rawQueryString": "",
        "headers": {
            "accept": "application/json",
            "content-type": "application/json",
            "host": "api.example.com",
            "user-agent": "pytest",
            "x-amzn-trace-id": "Root=1-test",
            "x-forwarded-for": "127.0.0.1",
            "x-forwarded-port": "443",
            "x-forwarded-proto": "https"
        },
        "requestContext": {
            "accountId": "123456789012",
            "apiId": "test-api-id",
            "domainName": "api.example.com",
            "domainPrefix": "api",
            "http": {
                "method": "GET",
                "path": "/health",
                "protocol": "HTTP/1.1",
                "sourceIp": "127.0.0.1",
                "userAgent": "pytest"
            },
            "requestId": "test-request-id",
            "routeKey": "GET /health",
            "stage": "v1",
            "time": "01/Jan/2024:00:00:00 +0000",
            "timeEpoch": 1234567890
        },
        "isBase64Encoded": False
    }


@pytest.fixture
def mock_dynamodb(monkeypatch):
    """Mock DynamoDB client"""
    mock_client = Mock()
    mock_client.describe_table.return_value = {
        'Table': {
            'TableStatus': 'ACTIVE',
            'ItemCount': 0
        }
    }
    
    def mock_boto_client(service_name):
        if service_name == 'dynamodb':
            return mock_client
        return Mock()
    
    monkeypatch.setattr('boto3.client', mock_boto_client)
    return mock_client


@pytest.fixture(autouse=True)
def set_env_vars(monkeypatch):
    """Set environment variables for tests"""
    monkeypatch.setenv('ENVIRONMENT', 'test')
    monkeypatch.setenv('TABLE_NAME', 'test-table')
    monkeypatch.setenv('USERS_TABLE_NAME', 'users-test')
    monkeypatch.setenv('LOG_LEVEL', 'DEBUG')
    monkeypatch.setenv('AWS_REGION', 'us-east-1')
    monkeypatch.setenv('POWERTOOLS_SERVICE_NAME', 'test-service')
    monkeypatch.setenv('POWERTOOLS_METRICS_NAMESPACE', 'test-namespace')
