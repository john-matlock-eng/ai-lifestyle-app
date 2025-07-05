"""
Unit tests for token refresh service.
"""

import pytest
from unittest.mock import Mock, patch

from refresh_token.service import TokenRefreshService
from refresh_token.models import RefreshTokenRequest, RefreshTokenResponse, CognitoTokenResponse
from refresh_token.errors import (
    InvalidTokenError,
    ExpiredTokenError,
    RevokedTokenError,
    RefreshError
)


class TestTokenRefreshService:
    """Test suite for token refresh service."""
    
    @pytest.fixture
    def mock_cognito_client(self):
        """Mock Cognito client."""
        return Mock()
    
    @pytest.fixture
    def service(self, mock_cognito_client):
        """Token refresh service instance."""
        return TokenRefreshService(cognito_client=mock_cognito_client)
    
    def test_successful_token_refresh(self, service, mock_cognito_client):
        """Test successful token refresh."""
        # Setup mock
        mock_cognito_response = CognitoTokenResponse(
            AccessToken='new-access-token-123',
            IdToken='new-id-token-123',
            TokenType='Bearer',
            ExpiresIn=3600
        )
        mock_cognito_client.refresh_access_token.return_value = mock_cognito_response
        
        # Create request
        request = RefreshTokenRequest(refreshToken='valid-refresh-token')
        
        # Call service
        response = service.refresh_token(request)
        
        # Verify response
        assert isinstance(response, RefreshTokenResponse)
        assert response.accessToken == 'new-access-token-123'
        assert response.tokenType == 'Bearer'
        assert response.expiresIn == 3600
        
        # Verify Cognito was called correctly
        mock_cognito_client.refresh_access_token.assert_called_once_with(
            refresh_token='valid-refresh-token'
        )
    
    def test_invalid_token_error(self, service, mock_cognito_client):
        """Test invalid token error handling."""
        # Setup mock to raise error
        mock_cognito_client.refresh_access_token.side_effect = InvalidTokenError(
            "Invalid token"
        )
        
        # Create request
        request = RefreshTokenRequest(refreshToken='invalid-token')
        
        # Call service and expect error
        with pytest.raises(InvalidTokenError) as exc_info:
            service.refresh_token(request)
        
        assert "Invalid token" in str(exc_info.value)
    
    def test_expired_token_error(self, service, mock_cognito_client):
        """Test expired token error handling."""
        # Setup mock to raise error
        mock_cognito_client.refresh_access_token.side_effect = ExpiredTokenError(
            "Token expired"
        )
        
        # Create request
        request = RefreshTokenRequest(refreshToken='expired-token')
        
        # Call service and expect error
        with pytest.raises(ExpiredTokenError) as exc_info:
            service.refresh_token(request)
        
        assert "Token expired" in str(exc_info.value)
    
    def test_revoked_token_error(self, service, mock_cognito_client):
        """Test revoked token error handling."""
        # Setup mock to raise error
        mock_cognito_client.refresh_access_token.side_effect = RevokedTokenError(
            "Token revoked"
        )
        
        # Create request
        request = RefreshTokenRequest(refreshToken='revoked-token')
        
        # Call service and expect error
        with pytest.raises(RevokedTokenError) as exc_info:
            service.refresh_token(request)
        
        assert "Token revoked" in str(exc_info.value)
    
    def test_refresh_error_passthrough(self, service, mock_cognito_client):
        """Test that RefreshError is passed through."""
        # Setup mock to raise error
        mock_cognito_client.refresh_access_token.side_effect = RefreshError(
            "Generic refresh error"
        )
        
        # Create request
        request = RefreshTokenRequest(refreshToken='token')
        
        # Call service and expect error
        with pytest.raises(RefreshError) as exc_info:
            service.refresh_token(request)
        
        assert "Generic refresh error" in str(exc_info.value)
    
    def test_unexpected_error_handling(self, service, mock_cognito_client):
        """Test unexpected error handling."""
        # Setup mock to raise unexpected error
        mock_cognito_client.refresh_access_token.side_effect = RuntimeError(
            "Unexpected error"
        )
        
        # Create request
        request = RefreshTokenRequest(refreshToken='token')
        
        # Call service and expect RefreshError
        with pytest.raises(RefreshError) as exc_info:
            service.refresh_token(request)
        
        assert "unexpected error occurred" in str(exc_info.value).lower()
        assert exc_info.value.details.get('error') == 'Unexpected error'
    
    def test_validate_new_token_success(self, service, mock_cognito_client):
        """Test successful token validation."""
        # Setup mock
        mock_cognito_client.get_user_from_access_token.return_value = {
            'username': 'test-user',
            'attributes': {
                'email': 'test@example.com',
                'email_verified': 'true'
            }
        }
        
        # Call service
        is_valid = service.validate_new_token('valid-access-token')
        
        # Verify result
        assert is_valid is True
        
        # Verify Cognito was called
        mock_cognito_client.get_user_from_access_token.assert_called_once_with(
            'valid-access-token'
        )
    
    def test_validate_new_token_failure(self, service, mock_cognito_client):
        """Test failed token validation."""
        # Setup mock to raise error
        mock_cognito_client.get_user_from_access_token.side_effect = Exception(
            "Invalid token"
        )
        
        # Call service
        is_valid = service.validate_new_token('invalid-access-token')
        
        # Verify result
        assert is_valid is False
    
    @patch('refresh_token.service.logger')
    def test_logging_successful_refresh(self, mock_logger, service, mock_cognito_client):
        """Test that successful refresh is logged."""
        # Setup mock
        mock_cognito_response = CognitoTokenResponse(
            AccessToken='new-access-token',
            TokenType='Bearer',
            ExpiresIn=3600
        )
        mock_cognito_client.refresh_access_token.return_value = mock_cognito_response
        
        # Create request and call service
        request = RefreshTokenRequest(refreshToken='token')
        service.refresh_token(request)
        
        # Verify logging
        assert mock_logger.info.call_count >= 2
        mock_logger.info.assert_any_call(
            "Processing token refresh request",
            extra={'has_refresh_token': True}
        )
        mock_logger.info.assert_any_call(
            "Token refresh completed successfully",
            extra={
                'expires_in': 3600,
                'token_type': 'Bearer'
            }
        )
    
    @patch('refresh_token.service.logger')
    def test_logging_error(self, mock_logger, service, mock_cognito_client):
        """Test that errors are logged."""
        # Setup mock to raise unexpected error
        mock_cognito_client.refresh_access_token.side_effect = RuntimeError("Error")
        
        # Create request and call service
        request = RefreshTokenRequest(refreshToken='token')
        
        with pytest.raises(RefreshError):
            service.refresh_token(request)
        
        # Verify error was logged
        mock_logger.exception.assert_called_once_with(
            "Unexpected error during token refresh",
            extra={'error': 'Error'}
        )
