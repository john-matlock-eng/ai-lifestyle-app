"""
Service for retrieving users by email address.
"""

import os
from typing import Dict, Any, Optional
import boto3
from boto3.dynamodb.conditions import Key
from aws_lambda_powertools import Logger, Tracer

logger = Logger()
tracer = Tracer()


class GetUserByEmailService:
    """Service for getting user information by email."""
    
    def __init__(self):
        """Initialize the service with DynamoDB client."""
        self.dynamodb = boto3.resource('dynamodb')
        self.table_name = os.environ['USERS_TABLE_NAME']
        self.table = self.dynamodb.Table(self.table_name)
    
    @tracer.capture_method
    def get_user_by_email(self, email: str) -> Dict[str, Any]:
        """
        Get user information by email address.
        
        Args:
            email: User's email address (case-insensitive)
            
        Returns:
            Dict containing user information
            
        Raises:
            ValueError: If user not found
        """
        # Normalize email to lowercase
        email = email.lower().strip()
        
        # Query using the EmailIndex GSI
        # The GSI uses gsi1_pk = 'USER#EMAIL' and gsi1_sk = email
        try:
            response = self.table.query(
                IndexName='EmailIndex',
                KeyConditionExpression=Key('gsi1_pk').eq('USER#EMAIL') & Key('gsi1_sk').eq(email),
                Limit=1
            )
            
            if not response.get('Items'):
                raise ValueError(f"User with email {email} not found")
            
            user_item = response['Items'][0]
            
            # Extract user ID from pk (format: USER#<userId>)
            user_id = user_item['pk'].split('#')[1]
            
            # Check if user has encryption set up
            has_encryption = self._check_encryption_status(user_id)
            
            # Return user data needed for sharing
            return {
                'userId': user_id,
                'email': email,
                'username': user_item.get('username'),
                'hasEncryption': has_encryption,
                'createdAt': user_item.get('createdAt')
            }
            
        except Exception as e:
            logger.error(f"Error querying user by email: {str(e)}")
            raise
    
    @tracer.capture_method
    def _check_encryption_status(self, user_id: str) -> bool:
        """
        Check if user has encryption set up.
        
        Args:
            user_id: User's ID
            
        Returns:
            True if user has encryption set up, False otherwise
        """
        try:
            # Check for encryption setup in the user's record
            response = self.table.get_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': 'ENCRYPTION#SETUP'
                }
            )
            
            return 'Item' in response
            
        except Exception as e:
            logger.warning(f"Error checking encryption status: {str(e)}")
            return False


# Lambda handler initialization
service = GetUserByEmailService()
