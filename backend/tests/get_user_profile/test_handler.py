"""
Unit tests for get user profile handler.
"""

import json
import os
import pytest
from unittest.mock import Mock, patch
from datetime import datetime

# Mock environment variables before importing handler
os.environ['COGNITO_USER_POOL_ID'] = 'test-pool-id'
os.environ['COGNITO_CLIENT_ID'] = 'test-client-id'
os.environ['USERS_TABLE_NAME'] = 'test-users-table'
os.environ['ENVIRONMENT'] = 'test'

from get_user_profile.handler import lambda_handler
from get_user_profile.models import UserProfile, UserPreferences
from get_user_profile.errors import (
    UnauthorizedError,
    TokenExpiredError,
    UserNotFoundError
)


class TestGetUserProfileHandler:
    """Test suite for get user profile handler."""
    
    @pytest.fixture
    def valid_event(self):
        """Valid API Gateway event with auth header."""
        return {
            'httpMethod': 'GET',
            'path': '/users/profile',
            'headers': {
                'Authorization': 'Bearer valid-access-token-123'
            },
            'requestContext': {
                'requestId': 'test-request-123'
            }
        }
    
    @pytest.fixture
    def lambda_context(self):
        """Mock Lambda context."""
        context = Mock()
        context.aws_request_id = 'test-request-123'
        return context
    
    @patch('get_user_profile.handler.UserProfileService')
    @patch('get_user_profile.handler.UserRepository')
    @patch('get_user_profile.handler.CognitoClient')
    def test_successful_profile_retrieval(self, mock_cognito_class, mock_repo_class, mock_service_class, valid_event, lambda_context):
        """Test successful user profile retrieval."""
        # Setup mocks
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        
        # Create mock user profile
        mock_profile = UserProfile(
            userId='123e4567-e89b-12d3-a456-426614174000',
            email='test@example.com',
            firstName='Test',
            lastName='User',
            emailVerified=True,
            mfaEnabled=False,
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow()
        )
        mock_service.get_user_profile.return_value = mock_profile
        
        # Call handler
        response = lambda_handler(valid_event, lambda_context)
        
        # Verify response
        assert response['statusCode'] == 200
        assert 'X-Request-ID' in response['headers']
        
        body = json.loads(response['body'])
        assert body['userId'] == '123e4567-e89b-12d3-a456-426614174000'
        assert body['email'] == 'test@example.com'
        assert body['firstName'] == 'Test'
        assert body['lastName'] == 'User'
    
    def test_missing_auth_header(self, lambda_context):
        """Test request without Authorization header."""
        event = {
            'httpMethod': 'GET',
            'path': '/users/profile',
            'headers': {},
            'requestContext': {'requestId': 'test-123'}
        }
        
        response = lambda_handler(event, lambda_context)
        
        assert response['statusCode'] == 401
        assert response['headers']['WWW-Authenticate'] == 'Bearer'
        
        body = json.loads(response['body'])
        assert body['error'] == 'UNAUTHORIZED'
        assert 'Missing Authorization header' in body['message']
    
    @patch('get_user_profile.handler.UserProfileService')
    @patch('get_user_profile.handler.UserRepository')
    @patch('get_user_profile.handler.CognitoClient')
    def test_expired_token(self, mock_cognito_class, mock_repo_class, mock_service_class, valid_event, lambda_context):
        """Test expired token handling."""
        # Setup mocks
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_service.get_user_profile.side_effect = TokenExpiredError(
            "Access token has expired"
        )
        
        # Call handler
        response = lambda_handler(valid_event, lambda_context)
        
        # Verify response
        assert response['statusCode'] == 401
        assert 'invalid_token' in response['headers']['WWW-Authenticate']
        
        body = json.loads(response['body'])
        assert body['error'] == 'TOKEN_EXPIRED'
    
    @patch('get_user_profile.handler.UserProfileService')
    @patch('get_user_profile.handler.UserRepository')
    @patch('get_user_profile.handler.CognitoClient')
    def test_user_not_found(self, mock_cognito_class, mock_repo_class, mock_service_class, valid_event, lambda_context):
        """Test user not found handling."""
        # Setup mocks
        mock_service = Mock()
        mock_service_class.return_value = mock_service
        mock_service.get_user_profile.side_effect = UserNotFoundError(
            "User not found"
        )
        
        # Call handler
        response = lambda_handler(valid_event, lambda_context)
        
        # Verify response
        assert response['statusCode'] == 404
        
        body = json.loads(response['body'])
        assert body['error'] == 'USER_NOT_FOUND'
