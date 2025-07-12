"""
Service layer for updating user profile.
"""

from typing import Dict, Any
from aws_lambda_powertools import Logger

from user_profile_common import UserProfile, DynamoDBUser, UpdateUserProfileRequest
from .repository import UserProfileRepository

logger = Logger()


class UpdateUserProfileService:
    """Handles user profile update business logic."""
    
    def __init__(self):
        self.repository = UserProfileRepository()
    
    def update_profile(self, user_id: str, request: UpdateUserProfileRequest) -> UserProfile:
        """
        Update user profile.
        
        Args:
            user_id: User's unique identifier
            request: Update request data
            
        Returns:
            Updated user profile
            
        Raises:
            ValueError: If user not found
            Exception: For other errors
        """
        try:
            # Check if user exists
            existing_user = self.repository.get_user(user_id)
            if not existing_user:
                raise ValueError(f"User not found: {user_id}")
            
            # Prepare updates (only include non-None values)
            updates = {}
            
            if request.firstName is not None:
                updates["firstName"] = request.firstName
            
            if request.lastName is not None:
                updates["lastName"] = request.lastName
            
            if request.phoneNumber is not None:
                updates["phoneNumber"] = request.phoneNumber
            
            if request.dateOfBirth is not None:
                updates["dateOfBirth"] = request.dateOfBirth
            
            if request.timezone is not None:
                updates["timezone"] = request.timezone
            
            if request.preferences is not None:
                updates["preferences"] = request.preferences.model_dump()
            
            if request.encryptionEnabled is not None:
                updates["encryptionEnabled"] = request.encryptionEnabled
            
            if request.encryptionSetupDate is not None:
                updates["encryptionSetupDate"] = request.encryptionSetupDate
            
            if request.encryptionKeyId is not None:
                updates["encryptionKeyId"] = request.encryptionKeyId
            
            # Update user in repository
            updated_data = self.repository.update_user(user_id, updates)
            
            # Convert to response model
            dynamo_user = DynamoDBUser(**updated_data)
            user_profile = dynamo_user.to_user_profile()
            
            logger.info(f"Updated profile for user {user_id}")
            
            return user_profile
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Failed to update user profile: {str(e)}")
            raise Exception(f"Failed to update user profile: {str(e)}")