"""
Unit tests for email verification handler.
"""

from unittest.mock import MagicMock, Mock, patch

import pytest
from botocore.exceptions import ClientError

from src.verify_email.errors import (
    AlreadyVerifiedError,
    EmailVerificationError,
    InvalidTokenError,
    TokenExpiredError,
    UserNotFoundError,
)

# Import handler and related modules
from src.verify_email.handler import lambda_handler


@pytest.fixture
def lambda_context():
    """Mock Lambda context."""
    context = Mock()
    context.aws_request_id = "test-request-id"
    context.function_name = "verify-email"
    context.memory_limit_in_mb = 128
    context.invoked_function_arn = "arn:aws:lambda:us-east-1:123456789012:function:verify-email"
    return context


@pytest.fixture
def valid_event():
    """Valid API Gateway event."""
    return {
        "httpMethod": "POST",
        "path": "/auth/email/verify",
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"token": "test@example.com:123456"}),
        "requestContext": {
            "requestId": "api-request-id",
            "accountId": "123456789012",
            "stage": "dev",
        },
    }


class TestEmailVerificationHandler:
    """Test cases for email verification handler."""

    @patch("src.verify_email.handler.EmailVerificationService")
    def test_successful_verification(self, mock_service_class, valid_event, lambda_context):
        """Test successful email verification."""
        # Arrange
        mock_service = Mock()
        mock_service.verify_email_with_token.return_value = (
            "Email successfully verified. You can now access all features of the app."
        )
        mock_service_class.return_value = mock_service

        # Act
        response = lambda_handler(valid_event, lambda_context)

        # Assert
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert (
            body["message"]
            == "Email successfully verified. You can now access all features of the app."
        )
        assert "X-Request-ID" in response["headers"]
        mock_service.verify_email_with_token.assert_called_once_with("test@example.com:123456")

    @patch("src.verify_email.handler.EmailVerificationService")
    def test_already_verified_email(self, mock_service_class, valid_event, lambda_context):
        """Test verification when email is already verified."""
        # Arrange
        mock_service = Mock()
        mock_service.verify_email_with_token.side_effect = AlreadyVerifiedError()
        mock_service_class.return_value = mock_service

        # Act
        response = lambda_handler(valid_event, lambda_context)

        # Assert
        assert response["statusCode"] == 200  # Still returns success
        body = json.loads(response["body"])
        assert body["message"] == "Email is already verified"

    @patch("src.verify_email.handler.EmailVerificationService")
    def test_invalid_token(self, mock_service_class, valid_event, lambda_context):
        """Test verification with invalid token."""
        # Arrange
        mock_service = Mock()
        mock_service.verify_email_with_token.side_effect = InvalidTokenError(
            "Invalid verification code"
        )
        mock_service_class.return_value = mock_service

        # Act
        response = lambda_handler(valid_event, lambda_context)

        # Assert
        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "INVALID_TOKEN"
        assert body["message"] == "Invalid verification code"

    @patch("src.verify_email.handler.EmailVerificationService")
    def test_expired_token(self, mock_service_class, valid_event, lambda_context):
        """Test verification with expired token."""
        # Arrange
        mock_service = Mock()
        mock_service.verify_email_with_token.side_effect = TokenExpiredError()
        mock_service_class.return_value = mock_service

        # Act
        response = lambda_handler(valid_event, lambda_context)

        # Assert
        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "TOKEN_EXPIRED"
        assert body["message"] == "Verification token has expired"
        assert body["details"]["help"] == "Please request a new verification email"

    @patch("src.verify_email.handler.EmailVerificationService")
    def test_user_not_found(self, mock_service_class, valid_event, lambda_context):
        """Test verification when user not found."""
        # Arrange
        mock_service = Mock()
        mock_service.verify_email_with_token.side_effect = UserNotFoundError()
        mock_service_class.return_value = mock_service

        # Act
        response = lambda_handler(valid_event, lambda_context)

        # Assert
        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "USER_NOT_FOUND"
        assert body["message"] == "Invalid verification token"  # Don't reveal user existence

    def test_missing_request_body(self, lambda_context):
        """Test with missing request body."""
        # Arrange
        event = {
            "httpMethod": "POST",
            "path": "/auth/email/verify",
            "headers": {"Content-Type": "application/json"},
        }

        # Act
        response = lambda_handler(event, lambda_context)

        # Assert
        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "VALIDATION_ERROR"
        assert body["message"] == "Invalid request data"

    def test_invalid_json_body(self, lambda_context):
        """Test with invalid JSON in request body."""
        # Arrange
        event = {
            "httpMethod": "POST",
            "path": "/auth/email/verify",
            "headers": {"Content-Type": "application/json"},
            "body": "invalid json",
        }

        # Act
        response = lambda_handler(event, lambda_context)

        # Assert
        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "VALIDATION_ERROR"

    def test_missing_token_field(self, lambda_context):
        """Test with missing token field."""
        # Arrange
        event = {
            "httpMethod": "POST",
            "path": "/auth/email/verify",
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({}),
        }

        # Act
        response = lambda_handler(event, lambda_context)

        # Assert
        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "VALIDATION_ERROR"
        assert "validation_errors" in body["details"]

    def test_empty_token(self, lambda_context):
        """Test with empty token."""
        # Arrange
        event = {
            "httpMethod": "POST",
            "path": "/auth/email/verify",
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"token": ""}),
        }

        # Act
        response = lambda_handler(event, lambda_context)

        # Assert
        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "VALIDATION_ERROR"

    def test_whitespace_only_token(self, lambda_context):
        """Test with whitespace-only token."""
        # Arrange
        event = {
            "httpMethod": "POST",
            "path": "/auth/email/verify",
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"token": "   "}),
        }

        # Act
        response = lambda_handler(event, lambda_context)

        # Assert
        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "VALIDATION_ERROR"

    @patch("src.verify_email.handler.EmailVerificationService")
    def test_general_verification_error(self, mock_service_class, valid_event, lambda_context):
        """Test general email verification error."""
        # Arrange
        mock_service = Mock()
        mock_service.verify_email_with_token.side_effect = EmailVerificationError(
            "Verification failed"
        )
        mock_service_class.return_value = mock_service

        # Act
        response = lambda_handler(valid_event, lambda_context)

        # Assert
        assert response["statusCode"] == 400
        body = json.loads(response["body"])
        assert body["error"] == "EMAIL_VERIFICATION_ERROR"
        assert body["message"] == "Verification failed"

    @patch("src.verify_email.handler.EmailVerificationService")
    def test_unexpected_error(self, mock_service_class, valid_event, lambda_context):
        """Test unexpected system error."""
        # Arrange
        mock_service = Mock()
        mock_service.verify_email_with_token.side_effect = Exception("Unexpected error")
        mock_service_class.return_value = mock_service

        # Act
        response = lambda_handler(valid_event, lambda_context)

        # Assert
        assert response["statusCode"] == 500
        body = json.loads(response["body"])
        assert body["error"] == "SYSTEM_ERROR"
        assert body["message"] == "An unexpected error occurred"

    def test_response_headers(self, valid_event, lambda_context):
        """Test response includes proper headers."""
        # Arrange & Act
        with patch("src.verify_email.handler.EmailVerificationService"):
            response = lambda_handler(valid_event, lambda_context)

        # Assert
        assert response["headers"]["Content-Type"] == "application/json"
        assert response["headers"]["X-Request-ID"] == "test-request-id"

    @patch("src.verify_email.handler.metrics")
    @patch("src.verify_email.handler.EmailVerificationService")
    def test_metrics_recorded(self, mock_service_class, mock_metrics, valid_event, lambda_context):
        """Test that metrics are recorded correctly."""
        # Arrange
        mock_service = Mock()
        mock_service.verify_email_with_token.return_value = "Success"
        mock_service_class.return_value = mock_service

        # Act
        lambda_handler(valid_event, lambda_context)

        # Assert
        mock_metrics.add_metric.assert_any_call(
            name="EmailVerificationAttempts",
            unit=mock_metrics.add_metric.call_args_list[0][1]["unit"],
            value=1,
        )
        mock_metrics.add_metric.assert_any_call(
            name="SuccessfulEmailVerifications",
            unit=mock_metrics.add_metric.call_args_list[1][1]["unit"],
            value=1,
        )
