"""
Unit tests for email verification service.
"""

import pytest
from unittest.mock import Mock, patch, call
from datetime import datetime

from src.verify_email.service import EmailVerificationService
from src.verify_email.errors import (
    InvalidTokenError,
    AlreadyVerifiedError,
    UserNotFoundError,
    EmailVerificationError
)


@pytest.fixture
def mock_cognito_client():
    """Mock Cognito client."""
    with patch('src.verify_email.service.CognitoClient') as mock:
        yield mock.return_value


@pytest.fixture
def mock_repository():
    """Mock repository."""
    with patch('src.verify_email.service.EmailVerificationRepository') as mock:
        yield mock.return_value


@pytest.fixture
def service(mock_cognito_client, mock_repository):
    """Email verification service with mocked dependencies."""
    return EmailVerificationService()


class TestEmailVerificationService:
    """Test cases for email verification service."""
    
    def test_verify_email_success(self, service, mock_cognito_client, mock_repository):
        """Test successful email verification."""
        # Arrange
        token = "test@example.com:123456"
        mock_cognito_client.get_user_verification_status.return_value = False
        mock_cognito_client.verify_email.return_value = None
        mock_repository.get_user_by_email.return_value = {
            'user_id': 'user-123',
            'email': 'test@example.com'
        }
        
        # Act
        result = service.verify_email_with_token(token)
        
        # Assert
        assert "Email successfully verified" in result
        mock_cognito_client.get_user_verification_status.assert_called_once_with("test@example.com")
        mock_cognito_client.verify_email.assert_called_once_with("test@example.com", "123456")
        mock_repository.update_email_verified_status.assert_called_once_with('user-123', True)
        mock_repository.record_verification_event.assert_called_once()
    
    def test_verify_email_invalid_token_format(self, service):
        """Test verification with invalid token format."""
        # Arrange
        token = "invalid-token-format"
        
        # Act & Assert
        with pytest.raises(InvalidTokenError) as exc:
            service.verify_email_with_token(token)
        assert "Invalid token format" in str(exc.value)
    
    def test_verify_email_already_verified(self, service, mock_cognito_client):
        """Test verification when email is already verified."""
        # Arrange
        token = "test@example.com:123456"
        mock_cognito_client.get_user_verification_status.return_value = True
        
        # Act & Assert
        with pytest.raises(AlreadyVerifiedError):
            service.verify_email_with_token(token)
    
    def test_verify_email_user_not_found_in_cognito(self, service, mock_cognito_client):
        """Test verification when user not found in Cognito."""
        # Arrange
        token = "test@example.com:123456"
        mock_cognito_client.get_user_verification_status.side_effect = UserNotFoundError()
        
        # Act
        # Should not raise - let Cognito handle in verify_email
        mock_cognito_client.verify_email.side_effect = UserNotFoundError()
        
        with pytest.raises(UserNotFoundError):
            service.verify_email_with_token(token)
    
    def test_verify_email_user_not_in_database(self, service, mock_cognito_client, mock_repository):
        """Test verification when user not found in database."""
        # Arrange
        token = "test@example.com:123456"
        mock_cognito_client.get_user_verification_status.return_value = False
        mock_cognito_client.verify_email.return_value = None
        mock_repository.get_user_by_email.return_value = None
        
        # Act
        result = service.verify_email_with_token(token)
        
        # Assert
        assert "Email successfully verified" in result
        # Should not try to update database if user not found
        mock_repository.update_email_verified_status.assert_not_called()
        mock_repository.record_verification_event.assert_not_called()
    
    def test_verify_email_database_update_fails(self, service, mock_cognito_client, mock_repository):
        """Test when database update fails but Cognito succeeds."""
        # Arrange
        token = "test@example.com:123456"
        mock_cognito_client.get_user_verification_status.return_value = False
        mock_cognito_client.verify_email.return_value = None
        mock_repository.get_user_by_email.return_value = {
            'user_id': 'user-123',
            'email': 'test@example.com'
        }
        mock_repository.update_email_verified_status.side_effect = Exception("DB Error")
        
        # Act & Assert
        with pytest.raises(EmailVerificationError) as exc:
            service.verify_email_with_token(token)
        assert "Failed to verify email" in str(exc.value)
    
    def test_resend_verification_email_success(self, service, mock_cognito_client, mock_repository):
        """Test successful verification email resend."""
        # Arrange
        email = "test@example.com"
        mock_cognito_client.get_user_verification_status.return_value = False
        mock_cognito_client.resend_verification_code.return_value = None
        mock_repository.get_user_by_email.return_value = {
            'user_id': 'user-123',
            'email': email
        }
        
        # Act
        result = service.resend_verification_email(email)
        
        # Assert
        assert "Verification email has been resent" in result
        mock_cognito_client.resend_verification_code.assert_called_once_with(email)
        mock_repository.record_verification_event.assert_called_once_with(
            'user-123',
            'verification_code_resent',
            {'email': email}
        )
    
    def test_resend_verification_email_already_verified(self, service, mock_cognito_client):
        """Test resend when email is already verified."""
        # Arrange
        email = "test@example.com"
        mock_cognito_client.get_user_verification_status.return_value = True
        
        # Act & Assert
        with pytest.raises(AlreadyVerifiedError):
            service.resend_verification_email(email)
    
    def test_resend_verification_email_user_not_found(self, service, mock_cognito_client):
        """Test resend when user not found."""
        # Arrange
        email = "test@example.com"
        mock_cognito_client.get_user_verification_status.side_effect = UserNotFoundError()
        
        # Act & Assert
        with pytest.raises(UserNotFoundError):
            service.resend_verification_email(email)
    
    def test_check_verification_status_verified(self, service, mock_cognito_client):
        """Test checking status when email is verified."""
        # Arrange
        email = "test@example.com"
        mock_cognito_client.get_user_verification_status.return_value = True
        
        # Act
        is_verified, message = service.check_verification_status(email)
        
        # Assert
        assert is_verified is True
        assert "Email is verified" in message
    
    def test_check_verification_status_not_verified(self, service, mock_cognito_client):
        """Test checking status when email is not verified."""
        # Arrange
        email = "test@example.com"
        mock_cognito_client.get_user_verification_status.return_value = False
        
        # Act
        is_verified, message = service.check_verification_status(email)
        
        # Assert
        assert is_verified is False
        assert "Email is not verified" in message
        assert "check your inbox" in message
    
    def test_check_verification_status_user_not_found(self, service, mock_cognito_client):
        """Test checking status when user not found."""
        # Arrange
        email = "test@example.com"
        mock_cognito_client.get_user_verification_status.side_effect = UserNotFoundError()
        
        # Act & Assert
        with pytest.raises(UserNotFoundError):
            service.check_verification_status(email)
    
    def test_verify_email_cognito_error_wrapped(self, service, mock_cognito_client):
        """Test that Cognito errors are properly wrapped."""
        # Arrange
        token = "test@example.com:123456"
        mock_cognito_client.get_user_verification_status.return_value = False
        mock_cognito_client.verify_email.side_effect = Exception("Cognito error")
        
        # Act & Assert
        with pytest.raises(EmailVerificationError) as exc:
            service.verify_email_with_token(token)
        assert "Failed to verify email" in str(exc.value)
