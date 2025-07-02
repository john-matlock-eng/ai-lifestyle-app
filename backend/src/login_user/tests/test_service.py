"""
Unit tests for login service.
"""

import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime

from ..service import LoginService
from ..models import LoginRequest, LoginResponse, MfaLoginResponse, UserProfile
from ..errors import (
    InvalidCredentialsError,
    UserNotFoundError,
    MfaRequiredError,
    LoginError
)


@pytest.fixture
def mock_user_repository():
    """Create mock user repository."""
    return MagicMock()


@pytest.fixture
def mock_cognito_client():
    """Create mock Cognito client."""
    return MagicMock()


@pytest.fixture
def login_service(mock_user_repository, mock_cognito_client):
    """Create login service with mocked dependencies."""
    return LoginService(
        user_repository=mock_user_repository,
        cognito_client=mock_cognito_client
    )


@pytest.fixture
def login_request():
    """Create sample login request."""
    return LoginRequest(
        email="test@example.com",
        password="TestPassword123!"
    )


@pytest.fixture
def mock_user_data():
    """Create sample user data."""
    return {
        'userId': '123e4567-e89b-12d3-a456-426614174000',
        'email': 'test@example.com',
        'firstName': 'Test',
        'lastName': 'User',
        'emailVerified': True,
        'mfaEnabled': False,
        'createdAt': '2024-01-01T00:00:00Z',
        'updatedAt': '2024-01-01T00:00:00Z'
    }


@pytest.fixture
def mock_auth_result():
    """Create sample authentication result."""
    return {
        'accessToken': 'mock-access-token',
        'refreshToken': 'mock-refresh-token',
        'idToken': 'mock-id-token',
        'expiresIn': 3600,
        'tokenType': 'Bearer'
    }


class TestLoginService:
    """Test cases for login service."""
    
    def test_successful_login_without_mfa(
        self,
        login_service,
        login_request,
        mock_user_repository,
        mock_cognito_client,
        mock_user_data,
        mock_auth_result
    ):
        """Test successful login without MFA."""
        # Setup mocks
        mock_cognito_client.authenticate_user.return_value = mock_auth_result
        mock_user_repository.get_user_by_email.return_value = mock_user_data
        mock_cognito_client.get_user_attributes.return_value = {
            'email_verified': 'true'
        }
        
        # Call service
        result = login_service.login_user(login_request, ip_address='192.168.1.1')
        
        # Assertions
        assert isinstance(result, LoginResponse)
        assert result.accessToken == 'mock-access-token'
        assert result.refreshToken == 'mock-refresh-token'
        assert result.user.email == 'test@example.com'
        assert result.user.emailVerified is True
        
        # Verify method calls
        mock_cognito_client.authenticate_user.assert_called_once_with(
            email='test@example.com',
            password='TestPassword123!'
        )
        mock_user_repository.get_user_by_email.assert_called_once_with('test@example.com')
        mock_user_repository.record_login_attempt.assert_called()
        mock_user_repository.update_last_login.assert_called_once()
        mock_cognito_client.reset_failed_login_attempts.assert_called_once()
    
    def test_login_with_mfa_required(
        self,
        login_service,
        login_request,
        mock_cognito_client
    ):
        """Test login when MFA is required."""
        # Setup mock to raise MfaRequiredError
        mock_cognito_client.authenticate_user.side_effect = MfaRequiredError(
            session_token='temp-session-id',
            challenge_name='SOFTWARE_TOKEN_MFA'
        )
        
        # Call service
        result = login_service.login_user(login_request)
        
        # Assertions
        assert isinstance(result, MfaLoginResponse)
        assert result.sessionToken == 'temp-session-id'
        assert result.mfaRequired is True
        assert result.tokenType == 'Bearer'
    
    def test_invalid_credentials(
        self,
        login_service,
        login_request,
        mock_cognito_client
    ):
        """Test login with invalid credentials."""
        # Setup mock to raise InvalidCredentialsError
        mock_cognito_client.authenticate_user.side_effect = InvalidCredentialsError()
        
        # Call service and expect exception
        with pytest.raises(InvalidCredentialsError):
            login_service.login_user(login_request)
        
        # Verify failed attempt was tracked
        mock_cognito_client.update_failed_login_attempts.assert_called_once_with('test@example.com')
    
    def test_user_not_found_in_database(
        self,
        login_service,
        login_request,
        mock_cognito_client,
        mock_user_repository,
        mock_auth_result
    ):
        """Test when user authenticates but not found in database."""
        # Setup mocks
        mock_cognito_client.authenticate_user.return_value = mock_auth_result
        mock_user_repository.get_user_by_email.return_value = None
        
        # Call service and expect exception
        with pytest.raises(UserNotFoundError) as exc_info:
            login_service.login_user(login_request)
        
        assert exc_info.value.details['email'] == 'test@example.com'
    
    def test_cognito_attributes_fallback(
        self,
        login_service,
        login_request,
        mock_user_repository,
        mock_cognito_client,
        mock_user_data,
        mock_auth_result
    ):
        """Test fallback when Cognito attributes fetch fails."""
        # Setup mocks
        mock_cognito_client.authenticate_user.return_value = mock_auth_result
        mock_user_repository.get_user_by_email.return_value = mock_user_data
        mock_cognito_client.get_user_attributes.side_effect = Exception("Cognito error")
        
        # Call service
        result = login_service.login_user(login_request)
        
        # Should still succeed using database values
        assert isinstance(result, LoginResponse)
        assert result.user.emailVerified == mock_user_data['emailVerified']
    
    def test_audit_logging(
        self,
        login_service,
        login_request,
        mock_user_repository,
        mock_cognito_client,
        mock_user_data,
        mock_auth_result
    ):
        """Test audit logging for login attempts."""
        # Setup mocks
        mock_cognito_client.authenticate_user.return_value = mock_auth_result
        mock_user_repository.get_user_by_email.return_value = mock_user_data
        
        # Call service with IP address
        login_service.login_user(login_request, ip_address='192.168.1.1')
        
        # Verify audit logging
        assert mock_user_repository.record_login_attempt.call_count == 2
        # First call for initial attempt (success=False)
        first_call = mock_user_repository.record_login_attempt.call_args_list[0]
        assert first_call[1]['email'] == 'test@example.com'
        assert first_call[1]['success'] is False
        assert first_call[1]['ip_address'] == '192.168.1.1'
        
        # Second call for successful login
        second_call = mock_user_repository.record_login_attempt.call_args_list[1]
        assert second_call[1]['success'] is True
    
    def test_user_profile_mapping(
        self,
        login_service,
        login_request,
        mock_user_repository,
        mock_cognito_client,
        mock_auth_result
    ):
        """Test correct mapping of user data to profile."""
        # Setup user data with all fields
        full_user_data = {
            'userId': '123e4567-e89b-12d3-a456-426614174000',
            'email': 'test@example.com',
            'firstName': 'Test',
            'lastName': 'User',
            'emailVerified': True,
            'mfaEnabled': True,
            'phoneNumber': '+1234567890',
            'dateOfBirth': '1990-01-01',
            'timezone': 'America/New_York',
            'preferences': {'language': 'en-US'},
            'createdAt': '2024-01-01T00:00:00Z',
            'updatedAt': '2024-01-01T00:00:00Z'
        }
        
        mock_cognito_client.authenticate_user.return_value = mock_auth_result
        mock_user_repository.get_user_by_email.return_value = full_user_data
        
        # Call service
        result = login_service.login_user(login_request)
        
        # Verify all fields are mapped correctly
        assert result.user.userId == full_user_data['userId']
        assert result.user.email == full_user_data['email']
        assert result.user.firstName == full_user_data['firstName']
        assert result.user.lastName == full_user_data['lastName']
        assert result.user.mfaEnabled == full_user_data['mfaEnabled']
        assert result.user.phoneNumber == full_user_data['phoneNumber']
        assert result.user.dateOfBirth == full_user_data['dateOfBirth']
        assert result.user.timezone == full_user_data['timezone']
        assert result.user.preferences == full_user_data['preferences']
    
    def test_unexpected_error_handling(
        self,
        login_service,
        login_request,
        mock_cognito_client
    ):
        """Test handling of unexpected errors."""
        # Setup mock to raise unexpected exception
        mock_cognito_client.authenticate_user.side_effect = Exception("Unexpected error")
        
        # Call service and expect LoginError
        with pytest.raises(LoginError) as exc_info:
            login_service.login_user(login_request)
        
        assert "An error occurred during login" in exc_info.value.message
        assert exc_info.value.details['original_error'] == "Unexpected error"
