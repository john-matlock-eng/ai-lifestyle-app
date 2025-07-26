"""
Unit tests for login Lambda handler.
"""

import os
from datetime import datetime
from unittest.mock import MagicMock, Mock, patch

import pytest
from botocore.exceptions import ClientError

# Set environment variables before importing handler
os.environ["COGNITO_USER_POOL_ID"] = "test-pool-id"
os.environ["COGNITO_CLIENT_ID"] = "test-client-id"
os.environ["USERS_TABLE_NAME"] = "test-users-table"
os.environ["ENVIRONMENT"] = "test"

from ..errors import (
    AccountLockedError,
    AccountNotVerifiedError,
    InvalidCredentialsError,
    MfaRequiredError,
    UserNotFoundError,
)
from ..handler import lambda_handler


@pytest.fixture
def api_gateway_event():
    """Create a sample API Gateway event."""
    return {
        "httpMethod": "POST",
        "path": "/auth/login",
        "headers": {"Content-Type": "application/json"},
        "requestContext": {"requestId": "test-request-id", "identity": {"sourceIp": "192.168.1.1"}},
        "body": json.dumps({"email": "test@example.com", "password": "TestPassword123!"}),
    }


@pytest.fixture
def lambda_context():
    """Create a mock Lambda context."""
    context = MagicMock()
    context.aws_request_id = "test-lambda-request-id"
    context.function_name = "test-function"
    return context


@pytest.fixture
def mock_user_data():
    """Sample user data from DynamoDB."""
    return {
        "userId": "123e4567-e89b-12d3-a456-426614174000",
        "email": "test@example.com",
        "firstName": "Test",
        "lastName": "User",
        "emailVerified": True,
        "mfaEnabled": False,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
    }


@pytest.fixture
def mock_cognito_auth_response():
    """Sample Cognito authentication response."""
    return {
        "accessToken": "mock-access-token",
        "refreshToken": "mock-refresh-token",
        "idToken": "mock-id-token",
        "expiresIn": 3600,
        "tokenType": "Bearer",
    }


class TestLoginHandler:
    """Test cases for login Lambda handler."""

    @patch("login_user.handler.UserRepository")
    @patch("login_user.handler.CognitoClient")
    @patch("login_user.handler.LoginService")
    def test_successful_login_without_mfa(
        self,
        mock_login_service,
        mock_cognito_client,
        mock_user_repository,
        api_gateway_event,
        lambda_context,
        mock_user_data,
    ):
        """Test successful login without MFA."""
        # Setup mock response
        mock_service_instance = MagicMock()
        mock_login_response = MagicMock()
        mock_login_response.model_dump_json.return_value = json.dumps(
            {
                "accessToken": "mock-access-token",
                "refreshToken": "mock-refresh-token",
                "tokenType": "Bearer",
                "expiresIn": 3600,
                "user": mock_user_data,
            }
        )
        mock_service_instance.login_user.return_value = mock_login_response
        mock_login_service.return_value = mock_service_instance

        # Call handler
        response = lambda_handler(api_gateway_event, lambda_context)

        # Assertions
        assert response["statusCode"] == 200
        assert response["headers"]["Content-Type"] == "application/json"
        assert response["headers"]["X-Request-ID"] == "test-request-id"

        body = json.loads(response["body"])
        assert body["accessToken"] == "mock-access-token"
        assert body["refreshToken"] == "mock-refresh-token"
        assert body["user"]["email"] == "test@example.com"

    @patch("login_user.handler.UserRepository")
    @patch("login_user.handler.CognitoClient")
    @patch("login_user.handler.LoginService")
    def test_successful_login_with_mfa_required(
        self,
        mock_login_service,
        mock_cognito_client,
        mock_user_repository,
        api_gateway_event,
        lambda_context,
    ):
        """Test login response when MFA is required."""
        # Setup mock response for MFA
        mock_service_instance = MagicMock()
        mock_mfa_response = MagicMock()
        mock_mfa_response.model_dump_json.return_value = json.dumps(
            {"sessionToken": "temp-session-id", "mfaRequired": True, "tokenType": "Bearer"}
        )
        mock_service_instance.login_user.return_value = mock_mfa_response
        mock_login_service.return_value = mock_service_instance

        # Call handler
        response = lambda_handler(api_gateway_event, lambda_context)

        # Assertions
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert body["sessionToken"] == "temp-session-id"
        assert body["mfaRequired"] is True
        assert "accessToken" not in body

    @patch("login_user.handler.UserRepository")
    @patch("login_user.handler.CognitoClient")
    @patch("login_user.handler.LoginService")
    def test_invalid_credentials(
        self,
        mock_login_service,
        mock_cognito_client,
        mock_user_repository,
        api_gateway_event,
        lambda_context,
    ):
        """Test login with invalid credentials."""
        # Setup mock to raise InvalidCredentialsError
        mock_service_instance = MagicMock()
        mock_service_instance.login_user.side_effect = InvalidCredentialsError()
        mock_login_service.return_value = mock_service_instance

        # Call handler
        response = lambda_handler(api_gateway_event, lambda_context)

        # Assertions
        assert response["statusCode"] == 401
        body = json.loads(response["body"])
        assert body["error"] == "INVALID_CREDENTIALS"
        assert body["message"] == "Invalid email or password"

    def test_invalid_json_body(self, lambda_context):
        """Test with invalid JSON in request body."""
        event = {
            "httpMethod": "POST",
            "path": "/auth/login",
            "headers": {"Content-Type": "application/json"},
            "requestContext": {"requestId": "test-request-id"},
            "body": "invalid-json",
        }

        response = lambda_handler(event, lambda_context)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "INVALID_JSON"

    def test_missing_required_fields(self, lambda_context):
        """Test with missing required fields."""
        event = {
            "httpMethod": "POST",
            "path": "/auth/login",
            "headers": {"Content-Type": "application/json"},
            "requestContext": {"requestId": "test-request-id"},
            "body": json.dumps({"email": "test@example.com"}),  # Missing password
        }

        response = lambda_handler(event, lambda_context)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "VALIDATION_ERROR"
        assert len(body["validation_errors"]) > 0

    def test_invalid_email_format(self, lambda_context):
        """Test with invalid email format."""
        event = {
            "httpMethod": "POST",
            "path": "/auth/login",
            "headers": {"Content-Type": "application/json"},
            "requestContext": {"requestId": "test-request-id"},
            "body": json.dumps({"email": "not-an-email", "password": "TestPassword123!"}),
        }

        response = lambda_handler(event, lambda_context)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "VALIDATION_ERROR"

    @patch("login_user.handler.UserRepository")
    @patch("login_user.handler.CognitoClient")
    @patch("login_user.handler.LoginService")
    def test_account_not_verified(
        self,
        mock_login_service,
        mock_cognito_client,
        mock_user_repository,
        api_gateway_event,
        lambda_context,
    ):
        """Test login with unverified account."""
        # Setup mock to raise AccountNotVerifiedError
        mock_service_instance = MagicMock()
        mock_service_instance.login_user.side_effect = AccountNotVerifiedError("test@example.com")
        mock_login_service.return_value = mock_service_instance

        # Call handler
        response = lambda_handler(api_gateway_event, lambda_context)

        # Assertions
        assert response["statusCode"] == 403
        body = json.loads(response["body"])
        assert body["error"] == "ACCOUNT_NOT_VERIFIED"

    @patch("login_user.handler.UserRepository")
    @patch("login_user.handler.CognitoClient")
    @patch("login_user.handler.LoginService")
    def test_account_locked(
        self,
        mock_login_service,
        mock_cognito_client,
        mock_user_repository,
        api_gateway_event,
        lambda_context,
    ):
        """Test login with locked account."""
        # Setup mock to raise AccountLockedError
        mock_service_instance = MagicMock()
        mock_service_instance.login_user.side_effect = AccountLockedError("test@example.com")
        mock_login_service.return_value = mock_service_instance

        # Call handler
        response = lambda_handler(api_gateway_event, lambda_context)

        # Assertions
        assert response["statusCode"] == 429
        assert response["headers"]["Retry-After"] == "900"
        body = json.loads(response["body"])
        assert body["error"] == "ACCOUNT_LOCKED"

    def test_missing_environment_variables(self, api_gateway_event, lambda_context):
        """Test handler with missing environment variables."""
        # Remove required environment variable
        original_value = os.environ.pop("COGNITO_USER_POOL_ID", None)

        try:
            response = lambda_handler(api_gateway_event, lambda_context)

            assert response["statusCode"] == 500
            body = json.loads(response["body"])
            assert body["error"] == "CONFIGURATION_ERROR"
        finally:
            # Restore environment variable
            if original_value:
                os.environ["COGNITO_USER_POOL_ID"] = original_value

    @patch("login_user.handler.UserRepository")
    @patch("login_user.handler.CognitoClient")
    @patch("login_user.handler.LoginService")
    def test_unexpected_error(
        self,
        mock_login_service,
        mock_cognito_client,
        mock_user_repository,
        api_gateway_event,
        lambda_context,
    ):
        """Test handler with unexpected error."""
        # Setup mock to raise unexpected exception
        mock_service_instance = MagicMock()
        mock_service_instance.login_user.side_effect = Exception("Unexpected error")
        mock_login_service.return_value = mock_service_instance

        # Call handler
        response = lambda_handler(api_gateway_event, lambda_context)

        # Assertions
        assert response["statusCode"] == 500
        body = json.loads(response["body"])
        assert body["error"] == "INTERNAL_ERROR"
        assert body["message"] == "An unexpected error occurred"
