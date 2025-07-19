"""
Service layer containing business logic for user registration.
"""
import logging
from datetime import datetime
from uuid import uuid4

from .cognito_client import CognitoClient
from .errors import (
    DynamoDBError,
    RegistrationError,
    UserAlreadyExistsError,
)
from .models import (
    DynamoDBUser,
    RegisterRequest,
    RegisterResponse,
)
from .repository import UserRepository

logger = logging.getLogger(__name__)


class RegistrationService:
    """Service for handling user registration logic"""
    
    def __init__(self):
        self.cognito_client = CognitoClient()
        self.user_repository = UserRepository()
    
    def register_user(self, request: RegisterRequest) -> RegisterResponse:
        """
        Register a new user.
        
        This involves:
        1. Checking if email already exists
        2. Creating user in Cognito
        3. Creating user record in DynamoDB
        4. Sending verification email
        
        Args:
            request: Registration request data
            
        Returns:
            Registration response with user ID and success message
            
        Raises:
            UserAlreadyExistsError: If email is already registered
            RegistrationError: For other registration failures
        """
        logger.info(f"Starting registration for email: {request.email}")
        
        # Check if user already exists in DynamoDB
        existing_user = self.user_repository.get_user_by_email(request.email)
        if existing_user:
            logger.warning(f"Registration attempt for existing email: {request.email}")
            raise UserAlreadyExistsError(request.email)
        
        cognito_user = None
        dynamodb_user = None
        
        try:
            # Step 1: Create user in Cognito
            logger.info("Creating user in Cognito")
            cognito_user = self.cognito_client.create_user(
                email=request.email,
                password=request.password,
                first_name=request.firstName,
                last_name=request.lastName
            )
            
            # Step 2: Create user record in DynamoDB
            logger.info("Creating user record in DynamoDB")
            user_id = cognito_user.user_id
            now = datetime.utcnow()
            
            dynamodb_user = DynamoDBUser(
                pk=f"USER#{str(user_id)}",
                sk=f"USER#{str(user_id)}",
                user_id=user_id,
                email=request.email,
                first_name=request.firstName,
                last_name=request.lastName,
                display_name=(request.displayName or f"{request.firstName} {request.lastName}").strip(),
                email_verified=False,
                mfa_enabled=False,
                created_at=now,
                updated_at=now,
                # Additional fields for email GSI
                gsi1_pk=f"EMAIL#{request.email}",
                gsi1_sk=f"EMAIL#{request.email}"
            )
            
            self.user_repository.create_user(dynamodb_user)
            
            # Step 3: Verification email is sent automatically by Cognito sign_up
            logger.info("Verification email sent automatically by Cognito")
            
            logger.info(f"Successfully registered user: {user_id}")
            
            return RegisterResponse(
                userId=user_id,
                email=request.email,
                message="Registration successful. Please check your email to verify your account."
            )
            
        except UserAlreadyExistsError:
            # Re-raise to preserve specific error type
            raise
            
        except Exception as e:
            logger.error(f"Registration failed: {str(e)}")
            
            # Rollback: Clean up any created resources
            if cognito_user:
                logger.info("Rolling back: Deleting Cognito user")
                self.cognito_client.delete_user(str(cognito_user.user_id))
            
            if dynamodb_user:
                logger.info("Rolling back: Deleting DynamoDB user")
                self.user_repository.delete_user(dynamodb_user.user_id)
            
            # Convert specific errors or raise generic one
            if isinstance(e, (DynamoDBError, RegistrationError)):
                raise
            else:
                raise RegistrationError(
                    message="Registration failed due to an internal error",
                    error_code="INTERNAL_ERROR",
                    details={"error": str(e)}
                )
