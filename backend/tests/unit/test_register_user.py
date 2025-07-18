"""
Unit tests for user registration service.
"""
import pytest
from datetime import datetime
from unittest.mock import Mock, patch
from uuid import UUID, uuid4

from src.register_user.errors import (
    UserAlreadyExistsError,
    CognitoError,
    DynamoDBError,
)
from src.register_user.models import (
    RegisterRequest,
    RegisterResponse,
    CognitoUser,
    DynamoDBUser,
)
from src.register_user.service import RegistrationService


class TestRegistrationService:
    """Test cases for RegistrationService"""
    
    @pytest.fixture
    def registration_service(self):
        """Create a RegistrationService instance with mocked dependencies"""
        with patch('src.register_user.service.CognitoClient') as mock_cognito:
            with patch('src.register_user.service.UserRepository') as mock_repo:
                service = RegistrationService()
                service.cognito_client = mock_cognito.return_value
                service.user_repository = mock_repo.return_value
                yield service
    
    @pytest.fixture
    def valid_request(self):
        """Valid registration request"""
        return RegisterRequest(
            email="test@example.com",
            password="SecureP@ss123",
            firstName="John",
            lastName="Doe"
        )
    
    def test_successful_registration(self, registration_service, valid_request):
        """Test successful user registration flow"""
        # Arrange
        user_id = uuid4()
        
        # Mock repository to return no existing user
        registration_service.user_repository.get_user_by_email.return_value = None
        
        # Mock Cognito user creation
        cognito_user = CognitoUser(
            user_id=user_id,
            email=valid_request.email,
            email_verified=False,
            enabled=True,
            status="UNCONFIRMED",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        registration_service.cognito_client.create_user.return_value = cognito_user
        
        # Mock DynamoDB user creation
        registration_service.user_repository.create_user.return_value = Mock()
        
        # Email is sent automatically by sign_up, no separate call needed
        
        # Act
        result = registration_service.register_user(valid_request)
        
        # Assert
        assert isinstance(result, RegisterResponse)
        assert result.userId == user_id
        assert result.email == valid_request.email
        assert "verify" in result.message.lower()
        
        # Verify method calls
        registration_service.user_repository.get_user_by_email.assert_called_once_with(valid_request.email)
        registration_service.cognito_client.create_user.assert_called_once()
        registration_service.user_repository.create_user.assert_called_once()
        # Email verification is handled automatically by Cognito sign_up
    
    def test_registration_with_existing_email(self, registration_service, valid_request):
        """Test registration fails when email already exists"""
        # Arrange
        existing_user = DynamoDBUser(
            pk="USER#123",
            sk="USER#123",
            user_id=uuid4(),
            email=valid_request.email,
            first_name="Existing",
            last_name="User",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        registration_service.user_repository.get_user_by_email.return_value = existing_user
        
        # Act & Assert
        with pytest.raises(UserAlreadyExistsError) as exc_info:
            registration_service.register_user(valid_request)
        
        assert valid_request.email in str(exc_info.value)
        
        # Verify no user was created
        registration_service.cognito_client.create_user.assert_not_called()
        registration_service.user_repository.create_user.assert_not_called()
    
    def test_rollback_on_dynamodb_failure(self, registration_service, valid_request):
        """Test rollback when DynamoDB creation fails"""
        # Arrange
        user_id = uuid4()
        
        registration_service.user_repository.get_user_by_email.return_value = None
        
        cognito_user = CognitoUser(
            user_id=user_id,
            email=valid_request.email,
            email_verified=False,
            enabled=True,
            status="UNCONFIRMED",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        registration_service.cognito_client.create_user.return_value = cognito_user
        
        # Mock DynamoDB failure
        registration_service.user_repository.create_user.side_effect = DynamoDBError(
            "Failed to create user in database"
        )
        
        # Act & Assert
        with pytest.raises(DynamoDBError):
            registration_service.register_user(valid_request)
        
        # Verify rollback was attempted
        registration_service.cognito_client.delete_user.assert_called_once_with(str(user_id))
    
    def test_rollback_on_dynamodb_create_failure_after_cognito(self, registration_service, valid_request):
        """Test rollback when DynamoDB creation fails after Cognito user created"""
        # Arrange
        user_id = uuid4()
        
        registration_service.user_repository.get_user_by_email.return_value = None
        
        cognito_user = CognitoUser(
            user_id=user_id,
            email=valid_request.email,
            email_verified=False,
            enabled=True,
            status="UNCONFIRMED",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        registration_service.cognito_client.create_user.return_value = cognito_user
        
        # Mock DynamoDB failure
        registration_service.user_repository.create_user.side_effect = DynamoDBError(
            "Failed to create user in database"
        )
        
        # Act & Assert
        with pytest.raises(DynamoDBError):
            registration_service.register_user(valid_request)
        
        # Verify rollback was attempted for Cognito user
        registration_service.cognito_client.delete_user.assert_called_once_with(str(user_id))


class TestPasswordValidation:
    """Test password validation rules"""
    
    def test_valid_password(self):
        """Test that valid passwords pass validation"""
        valid_passwords = [
            "Password123!",
            "SecureP@ss123",
            "MyStr0ng!Pass",
            "Test123$Word"
        ]
        
        for password in valid_passwords:
            request = RegisterRequest(
                email="test@example.com",
                password=password,
                firstName="John",
                lastName="Doe"
            )
            assert request.password == password
    
    def test_password_missing_lowercase(self):
        """Test password validation fails without lowercase letter"""
        with pytest.raises(ValueError, match="lowercase"):
            RegisterRequest(
                email="test@example.com",
                password="PASSWORD123!",
                firstName="John",
                lastName="Doe"
            )
    
    def test_password_missing_uppercase(self):
        """Test password validation fails without uppercase letter"""
        with pytest.raises(ValueError, match="uppercase"):
            RegisterRequest(
                email="test@example.com",
                password="password123!",
                firstName="John",
                lastName="Doe"
            )
    
    def test_password_missing_number(self):
        """Test password validation fails without number"""
        with pytest.raises(ValueError, match="number"):
            RegisterRequest(
                email="test@example.com",
                password="Password!",
                firstName="John",
                lastName="Doe"
            )
    
    def test_password_missing_special_char(self):
        """Test password validation fails without special character"""
        with pytest.raises(ValueError, match="special character"):
            RegisterRequest(
                email="test@example.com",
                password="Password123",
                firstName="John",
                lastName="Doe"
            )
    
    def test_password_too_short(self):
        """Test password validation fails when too short"""
        with pytest.raises(ValueError):
            RegisterRequest(
                email="test@example.com",
                password="Pass1!",
                firstName="John",
                lastName="Doe"
            )
    
    def test_password_too_long(self):
        """Test password validation fails when too long"""
        with pytest.raises(ValueError):
            RegisterRequest(
                email="test@example.com",
                password="P@ss1" + "a" * 125,  # 129 characters
                firstName="John",
                lastName="Doe"
            )
