"""
Tests for get_user_by_email handler.
"""

from unittest.mock import Mock, patch

import pytest

from get_user_by_email.handler import lambda_handler


@pytest.fixture
def lambda_context():
    """Mock Lambda context."""
    context = Mock()
    context.aws_request_id = "test-request-id"
    return context


@pytest.fixture
def api_gateway_event():
    """Base API Gateway event."""
    return {
        "httpMethod": "GET",
        "path": "/users/by-email/test@example.com",
        "pathParameters": {"email": "test@example.com"},
        "headers": {},
        "body": None,
    }


def test_get_user_by_email_success(api_gateway_event, lambda_context):
    """Test successful user lookup by email."""
    with patch("get_user_by_email.service.GetUserByEmailService") as mock_service:
        # Mock the service response
        mock_instance = mock_service.return_value
        mock_instance.get_user_by_email.return_value = {
            "userId": "user-123",
            "email": "test@example.com",
            "username": "testuser",
            "hasEncryption": True,
            "createdAt": "2024-01-01T00:00:00Z",
        }

        # Call handler
        response = lambda_handler(api_gateway_event, lambda_context)

        # Assert response
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert body["userId"] == "user-123"
        assert body["email"] == "test@example.com"
        assert body["hasEncryption"] is True


def test_get_user_by_email_not_found(api_gateway_event, lambda_context):
    """Test user not found by email."""
    with patch("get_user_by_email.service.GetUserByEmailService") as mock_service:
        # Mock the service to raise ValueError
        mock_instance = mock_service.return_value
        mock_instance.get_user_by_email.side_effect = ValueError("User not found")

        # Call handler
        response = lambda_handler(api_gateway_event, lambda_context)

        # Assert response
        assert response["statusCode"] == 404
        body = json.loads(response["body"])
        assert body["error"] == "USER_NOT_FOUND"


def test_get_user_by_email_invalid_email(lambda_context):
    """Test invalid email format."""
    event = {
        "httpMethod": "GET",
        "path": "/users/by-email/invalid-email",
        "pathParameters": {"email": "invalid-email"},
        "headers": {},
        "body": None,
    }

    # Call handler
    response = lambda_handler(event, lambda_context)

    # Assert response
    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert body["error"] == "VALIDATION_ERROR"
    assert "Invalid email format" in body["message"]


def test_get_user_by_email_missing_email(lambda_context):
    """Test missing email parameter."""
    event = {
        "httpMethod": "GET",
        "path": "/users/by-email/",
        "pathParameters": {},
        "headers": {},
        "body": None,
    }

    # Call handler
    response = lambda_handler(event, lambda_context)

    # Assert response
    assert response["statusCode"] == 400
    body = json.loads(response["body"])
    assert body["error"] == "VALIDATION_ERROR"
    assert "Email address required" in body["message"]
