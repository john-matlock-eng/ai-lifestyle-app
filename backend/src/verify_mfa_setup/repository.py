"""
Repository layer for MFA verification data operations.
"""

import os
from datetime import datetime
from typing import Optional, Dict, Any, List
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

from .errors import DatabaseError

logger = Logger()


class MFAVerificationRepository:
    """Handles MFA verification data operations in DynamoDB."""
    
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.table_name = os.environ.get('USERS_TABLE_NAME', 'users')
        self.table = self.dynamodb.Table(self.table_name)
    
    def get_mfa_secret(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve MFA secret data for user.
        
        Args:
            user_id: User's unique identifier
            
        Returns:
            MFA data if exists, None otherwise
            
        Raises:
            DatabaseError: If retrieval fails
        """
        try:
            response = self.table.get_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': 'MFA#SECRET'
                }
            )
            
            return response.get('Item')
            
        except ClientError as e:
            logger.error(f"Failed to get MFA secret: {str(e)}")
            raise DatabaseError(f"Failed to retrieve MFA secret: {str(e)}")
    
    def mark_mfa_as_verified(self, user_id: str) -> List[str]:
        """
        Mark MFA as verified and return backup codes.
        
        Args:
            user_id: User's unique identifier
            
        Returns:
            List of backup codes
            
        Raises:
            DatabaseError: If update fails
        """
        try:
            # Update MFA secret record to mark as verified
            response = self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': 'MFA#SECRET'
                },
                UpdateExpression='SET verified = :verified, verified_at = :verified_at, updated_at = :updated',
                ExpressionAttributeValues={
                    ':verified': True,
                    ':verified_at': datetime.utcnow().isoformat(),
                    ':updated': datetime.utcnow().isoformat()
                },
                ReturnValues='ALL_NEW'
            )
            
            # Return backup codes
            backup_codes = response['Attributes'].get('backup_codes', [])
            
            logger.info(f"Marked MFA as verified for user {user_id}")
            return backup_codes
            
        except ClientError as e:
            logger.error(f"Failed to mark MFA as verified: {str(e)}")
            raise DatabaseError(f"Failed to mark MFA as verified: {str(e)}")
    
    def update_user_mfa_status(self, user_id: str, mfa_enabled: bool) -> None:
        """
        Update user's MFA status in the main user record.
        
        Args:
            user_id: User's unique identifier
            mfa_enabled: Whether MFA is enabled
            
        Raises:
            DatabaseError: If update fails
        """
        try:
            self.table.update_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'USER#{user_id}'
                },
                UpdateExpression='SET mfa_enabled = :mfa, updated_at = :updated',
                ExpressionAttributeValues={
                    ':mfa': mfa_enabled,
                    ':updated': datetime.utcnow().isoformat()
                }
            )
            
            logger.info(f"Updated MFA status for user {user_id} to {mfa_enabled}")
            
        except ClientError as e:
            logger.error(f"Failed to update MFA status: {str(e)}")
            raise DatabaseError(f"Failed to update MFA status: {str(e)}")
    
    def check_mfa_verified(self, user_id: str) -> bool:
        """
        Check if MFA is already verified for user.
        
        Args:
            user_id: User's unique identifier
            
        Returns:
            True if verified, False otherwise
        """
        try:
            mfa_data = self.get_mfa_secret(user_id)
            if mfa_data:
                return mfa_data.get('verified', False)
            return False
            
        except Exception:
            return False
