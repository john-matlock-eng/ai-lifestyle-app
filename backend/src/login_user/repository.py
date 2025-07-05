"""
Repository for user data access operations.
"""

import os
from typing import Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

logger = Logger()


class UserRepository:
    """Repository for user data operations in DynamoDB"""
    
    def __init__(self, table_name: str):
        """
        Initialize user repository.
        
        Args:
            table_name: DynamoDB table name
        """
        self.table_name = table_name
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(table_name)
        
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Get user by email address using GSI.
        
        Args:
            email: User's email address
            
        Returns:
            User data if found, None otherwise
        """
        try:
            response = self.table.query(
                IndexName='EmailIndex',
                KeyConditionExpression=Key('gsi1_pk').eq(f'EMAIL#{email}'),
                Limit=1
            )
            
            items = response.get('Items', [])
            if items:
                user = items[0]
                logger.info("User found", extra={"email": email})
                return self._deserialize_user(user)
            
            logger.info("User not found", extra={"email": email})
            return None
            
        except ClientError as e:
            logger.error(
                "Error querying user by email",
                extra={
                    "email": email,
                    "error": str(e)
                }
            )
            raise
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get user by user ID.
        
        Args:
            user_id: User's unique identifier
            
        Returns:
            User data if found, None otherwise
        """
        try:
            response = self.table.get_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'USER#{user_id}'
                }
            )
            
            if 'Item' in response:
                logger.info("User found", extra={"userId": user_id})
                return self._deserialize_user(response['Item'])
            
            logger.info("User not found", extra={"userId": user_id})
            return None
            
        except ClientError as e:
            logger.error(
                "Error getting user by ID",
                extra={
                    "userId": user_id,
                    "error": str(e)
                }
            )
            raise
    
    def update_last_login(self, user_id: str, login_timestamp: datetime) -> None:
        """
        Update user's last login timestamp.
        
        Args:
            user_id: User's unique identifier
            login_timestamp: Login timestamp
        """
        try:
            self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'USER#{user_id}'
                },
                UpdateExpression='SET last_login = :timestamp, updated_at = :timestamp',
                ExpressionAttributeValues={
                    ':timestamp': login_timestamp.isoformat()
                }
            )
            
            logger.info(
                "Updated last login timestamp",
                extra={
                    "userId": user_id,
                    "timestamp": login_timestamp.isoformat()
                }
            )
            
        except ClientError as e:
            logger.error(
                "Error updating last login",
                extra={
                    "userId": user_id,
                    "error": str(e)
                }
            )
            # Don't fail the login if we can't update the timestamp
    
    def record_login_attempt(self, email: str, success: bool, ip_address: Optional[str] = None) -> None:
        """
        Record login attempt for audit purposes.
        
        Args:
            email: User's email address
            success: Whether login was successful
            ip_address: IP address of login attempt
        """
        try:
            # This could be a separate table for audit logs
            # For now, we'll just log it
            logger.info(
                "Login attempt recorded",
                extra={
                    "email": email,
                    "success": success,
                    "ip_address": ip_address,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
        except Exception as e:
            logger.error(
                "Error recording login attempt",
                extra={
                    "email": email,
                    "error": str(e)
                }
            )
    
    def _deserialize_user(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deserialize DynamoDB item to user object.
        
        Args:
            item: DynamoDB item
            
        Returns:
            Deserialized user data
        """
        # Convert any Decimal values to int/float
        def convert_decimal(obj):
            if isinstance(obj, Decimal):
                if obj % 1 == 0:
                    return int(obj)
                else:
                    return float(obj)
            elif isinstance(obj, dict):
                return {k: convert_decimal(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_decimal(i) for i in obj]
            return obj
        
        # Convert snake_case to camelCase and map fields
        user_data = {
            'userId': item.get('user_id'),
            'email': item.get('email'),
            'firstName': item.get('first_name'),
            'lastName': item.get('last_name'),
            'emailVerified': item.get('email_verified', False),
            'mfaEnabled': item.get('mfa_enabled', False),
            'phoneNumber': item.get('phone_number'),
            'dateOfBirth': item.get('date_of_birth'),
            'timezone': item.get('timezone'),
            'preferences': item.get('preferences'),
            'createdAt': item.get('created_at'),
            'updatedAt': item.get('updated_at'),
            'lastLogin': item.get('last_login')
        }
        
        # Remove None values and convert decimals
        user_data = {k: v for k, v in user_data.items() if v is not None}
        return convert_decimal(user_data)
