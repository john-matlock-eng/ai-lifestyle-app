"""
Repository layer for email verification database operations.
"""

import os
from datetime import datetime
from typing import Optional, Dict, Any
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

from .errors import DatabaseError, UserNotFoundError

logger = Logger()


class EmailVerificationRepository:
    """Handles database operations for email verification."""
    
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.table_name = os.environ.get('USERS_TABLE_NAME', 'users')
        self.table = self.dynamodb.Table(self.table_name)
    
    def update_email_verified_status(self, user_id: str, verified: bool = True) -> None:
        """
        Update user's email verification status in DynamoDB.
        
        Args:
            user_id: User's unique identifier
            verified: Whether email is verified (default: True)
            
        Raises:
            UserNotFoundError: If user doesn't exist
            DatabaseError: For database operation failures
        """
        try:
            # Update the user's email verification status
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'USER#{user_id}'
                },
                UpdateExpression='SET email_verified = :verified, updated_at = :updated',
                ExpressionAttributeValues={
                    ':verified': verified,
                    ':updated': datetime.utcnow().isoformat()
                },
                ConditionExpression='attribute_exists(pk)',  # Ensure user exists
                ReturnValues='ALL_NEW'
            )
            
            logger.info(f"Updated email verification status for user {user_id} to {verified}")
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            
            if error_code == 'ConditionalCheckFailedException':
                raise UserNotFoundError(f"User {user_id} not found")
            else:
                logger.error(f"Database error updating email verification status: {str(e)}")
                raise DatabaseError(f"Failed to update email verification status: {str(e)}")
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get user by email address using GSI.
        
        Args:
            email: User's email address
            
        Returns:
            User data if found, None otherwise
            
        Raises:
            DatabaseError: For database operation failures
        """
        try:
            # Query using the email GSI
            response = self.table.query(
                IndexName='EmailIndex',
                KeyConditionExpression=Key('gsi1_pk').eq(f'EMAIL#{email}'),
                Limit=1
            )
            
            items = response.get('Items', [])
            if items:
                return items[0]
            
            return None
            
        except ClientError as e:
            logger.error(f"Database error querying user by email: {str(e)}")
            raise DatabaseError(f"Failed to query user by email: {str(e)}")
    
    def record_verification_event(self, user_id: str, event_type: str, metadata: Optional[Dict[str, Any]] = None) -> None:
        """
        Record email verification event for audit trail.
        
        Args:
            user_id: User's unique identifier
            event_type: Type of event (e.g., 'email_verified', 'code_resent')
            metadata: Additional event metadata
            
        Raises:
            DatabaseError: For database operation failures
        """
        try:
            # Store verification event
            event_item = {
                'pk': f'USER#{user_id}',
                'sk': f'EVENT#{event_type}#{datetime.utcnow().isoformat()}',
                'event_type': event_type,
                'timestamp': datetime.utcnow().isoformat(),
                'metadata': metadata or {}
            }
            
            self.table.put_item(Item=event_item)
            
            logger.info(f"Recorded {event_type} event for user {user_id}")
            
        except ClientError as e:
            # Log error but don't fail the main operation
            logger.error(f"Failed to record verification event: {str(e)}")
            # Don't raise - this is non-critical
