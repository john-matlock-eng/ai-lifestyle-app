"""
Unit tests for token refresh handler.
"""

import os
from datetime import datetime
from unittest.mock import MagicMock, Mock, patch

import pytest

# Mock environment variables before importing handler
os.environ["COGNITO_USER_POOL_ID"] = "test-pool-id"
os.environ["COGNITO_CLIENT_ID"] = "test-client-id"
os.environ["ENVIRONMENT"] = "test"

from refresh_token.errors import (
    ExpiredTokenError,
    InvalidTokenError,
    RefreshError,
    RevokedTokenError,
)
from refresh_token.handler import lambda_handler
from refresh_token.models import CognitoTokenResponse, RefreshTokenResponse


class TestRefreshTokenHandler:
    """Test suite for refresh token handler."""

    @pytest.fixture
    def valid_event(self):
        """Valid API Gateway event."""
        return {
            "httpMethod": "POST",
            "path": "/auth/refresh",
            "body": json.dumps({"refreshToken": "valid-refresh-token-123"}),
            "requestContext": {"requestId": "test-request-123"},
        }

    @pytest.fixture
    def lambda_context(self):
        """Mock Lambda context."""
        context = Mock()
        context.aws_request_id = "test-request-123"
        return context

    @patch("refresh_token.handler.TokenRefreshService")
    @patch("refresh_token.handler.CognitoClient")
    def test_successful_token_refresh(
        self, mock_cognito_client_class, mock_service_class, valid_event, lambda_context
    ):
        """Test successful token refresh."""
        # Setup mocks
        mock_service = Mock()
        mock_service_class.return_value = mock_service

        mock_response = RefreshTokenResponse(
            accessToken="new-access-token", tokenType="Bearer", expiresIn=3600
        )
        mock_service.refresh_token.return_value = mock_response

        # Call handler
        response = lambda_handler(valid_event, lambda_context)

        # Verify response
        assert response["statusCode"] == 200
        assert "X-Request-ID" in response["headers"]

        body = json.loads(response["body"])
        assert body["accessToken"] == "new-access-token"
        assert body["tokenType"] == "Bearer"
        assert body["expiresIn"] == 3600

        # Verify service was called correctly
        mock_service.refresh_token.assert_called_once()

    def test_missing_body(self, lambda_context):
        """Test request with missing body."""
        event = {
            "httpMethod": "POST",
            "path": "/auth/refresh",
            "body": None,
            "requestContext": {"requestId": "test-123"},
        }

        response = lambda_handler(event, lambda_context)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "VALIDATION_ERROR"
        assert len(body["validation_errors"]) > 0

    def test_invalid_json_body(self, lambda_context):
        """Test request with invalid JSON."""
        event = {
            "httpMethod": "POST",
            "path": "/auth/refresh",
            "body": "invalid-json",
            "requestContext": {"requestId": "test-123"},
        }

        response = lambda_handler(event, lambda_context)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "INVALID_JSON"

    def test_missing_refresh_token(self, lambda_context):
        """Test request with missing refresh token."""
        event = {
            "httpMethod": "POST",
            "path": "/auth/refresh",
            "body": json.dumps({}),
            "requestContext": {"requestId": "test-123"},
        }

        response = lambda_handler(event, lambda_context)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "VALIDATION_ERROR"
        assert any(error["field"] == "refreshToken" for error in body["validation_errors"])

    def test_empty_refresh_token(self, lambda_context):
        """Test request with empty refresh token."""
        event = {
            "httpMethod": "POST",
            "path": "/auth/refresh",
            "body": json.dumps({"refreshToken": ""}),
            "requestContext": {"requestId": "test-123"},
        }

        response = lambda_handler(event, lambda_context)

        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "VALIDATION_ERROR"

    @patch("refresh_token.handler.TokenRefreshService")
    @patch("refresh_token.handler.CognitoClient")
    def test_invalid_token_error(
        self, mock_cognito_client_class, mock_service_class, valid_event, lambda_context
    ):
        """Test invalid token error handling."""
        # Setup mocks
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_service.refresh_token.side_effect = InvalidTokenError("Invalid refresh token")

        # Call handler
        response = lambda_handler(valid_event, lambda_context)

        # Verify response
        assert response["statusCode"] == 401
        body = json.loads(response["body"])
        assert body["error"] == "INVALID_TOKEN"
        assert "Invalid refresh token" in body["message"]

    @patch("refresh_token.handler.TokenRefreshService")
    @patch("refresh_token.handler.CognitoClient")
    def test_expired_token_error(
        self, mock_cognito_client_class, mock_service_class, valid_event, lambda_context
    ):
        """Test expired token error handling."""
        # Setup mocks
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_service.refresh_token.side_effect = ExpiredTokenError("Refresh token has expired")

        # Call handler
        response = lambda_handler(valid_event, lambda_context)

        # Verify response
        assert response["statusCode"] == 401
        body = json.loads(response["body"])
        assert body["error"] == "TOKEN_EXPIRED"
        assert "expired" in body["message"]

    @patch("refresh_token.handler.TokenRefreshService")
    @patch("refresh_token.handler.CognitoClient")
    def test_revoked_token_error(
        self, mock_cognito_client_class, mock_service_class, valid_event, lambda_context
    ):
        """Test revoked token error handling."""
        # Setup mocks
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_service.refresh_token.side_effect = RevokedTokenError("Token has been revoked")

        # Call handler
        response = lambda_handler(valid_event, lambda_context)

        # Verify response
        assert response["statusCode"] == 401
        body = json.loads(response["body"])
        assert body["error"] == "TOKEN_REVOKED"

    @patch("refresh_token.handler.TokenRefreshService")
    @patch("refresh_token.handler.CognitoClient")
    def test_generic_refresh_error(
        self, mock_cognito_client_class, mock_service_class, valid_event, lambda_context
    ):
        """Test generic refresh error handling."""
        # Setup mocks
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_service.refresh_token.side_effect = RefreshError("Something went wrong")

        # Call handler
        response = lambda_handler(valid_event, lambda_context)

        # Verify response
        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "REFRESH_ERROR"

    @patch("refresh_token.handler.TokenRefreshService")
    @patch("refresh_token.handler.CognitoClient")
    def test_unexpected_error(
        self, mock_cognito_client_class, mock_service_class, valid_event, lambda_context
    ):
        """Test unexpected error handling."""
        # Setup mocks
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_service.refresh_token.side_effect = Exception("Unexpected error")

        # Call handler
        response = lambda_handler(valid_event, lambda_context)

        # Verify response
        assert response["statusCode"] == 500
        body = json.loads(response["body"])
        assert body["error"] == "INTERNAL_ERROR"
        assert body["message"] == "An unexpected error occurred"

    def test_missing_environment_variables(self, valid_event, lambda_context):
        """Test missing environment variables."""
        # Temporarily remove environment variables
        with patch.dict(os.environ, {}, clear=True):
            response = lambda_handler(valid_event, lambda_context)

        assert response["statusCode"] == 500
        body = json.loads(response["body"])
        assert body["error"] == "CONFIGURATION_ERROR"

    @patch("refresh_token.handler.TokenRefreshService")
    @patch("refresh_token.handler.CognitoClient")
    def test_metrics_logging(
        self, mock_cognito_client_class, mock_service_class, valid_event, lambda_context
    ):
        """Test that metrics are properly logged."""
        # Setup mocks
        mock_service = Mock()
        mock_service_class.return_value = mock_service

        mock_response = RefreshTokenResponse(
            accessToken="new-access-token", tokenType="Bearer", expiresIn=3600
        )
        mock_service.refresh_token.return_value = mock_response

        # Call handler
        with patch("refresh_token.handler.metrics") as mock_metrics:
            response = lambda_handler(valid_event, lambda_context)

        # Verify metrics were logged
        mock_metrics.add_metric.assert_any_call(
            name="TokenRefreshAttempts",
            unit=mock_metrics.add_metric.call_args_list[0][1]["unit"],
            value=1,
        )
        mock_metrics.add_metric.assert_any_call(
            name="SuccessfulTokenRefreshes",
            unit=mock_metrics.add_metric.call_args_list[1][1]["unit"],
            value=1,
        )
