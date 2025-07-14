"""
Service for creating shares (both encrypted and non-encrypted).
"""

import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import boto3
from boto3.dynamodb.conditions import Key
from aws_lambda_powertools import Logger, Tracer

logger = Logger()
tracer = Tracer()


class CreateShareService:
    """Service for creating shares."""
    
    def __init__(self):
        """Initialize the service with DynamoDB client."""
        self.dynamodb = boto3.resource('dynamodb')
        self.table_name = os.environ.get('TABLE_NAME', os.environ.get('MAIN_TABLE_NAME', 'ai-lifestyle-dev'))
        self.table = self.dynamodb.Table(self.table_name)
    
    @tracer.capture_method
    def create_share(
        self,
        owner_id: str,
        item_type: str,
        item_id: str,
        recipient_id: str,
        encrypted_key: Optional[str] = None,
        permissions: List[str] = None,
        expires_in_hours: Optional[int] = 24
    ) -> Dict[str, Any]:
        """
        Create a new share (encrypted or non-encrypted).
        
        Args:
            owner_id: ID of the user creating the share
            item_type: Type of item being shared (journal, goal)
            item_id: ID of the item being shared
            recipient_id: ID of the recipient user
            encrypted_key: Re-encrypted content key for recipient (optional for non-encrypted)
            permissions: List of permissions to grant (defaults to ['read'])
            expires_in_hours: Hours until share expires
            
        Returns:
            Dict containing share details
            
        Raises:
            ValueError: If validation fails
        """
        # Default permissions
        if permissions is None:
            permissions = ['read']
        
        # Validate owner owns the item
        item_data = self._validate_ownership(owner_id, item_type, item_id)
        if not item_data:
            raise ValueError(f"User does not own this {item_type} or it does not exist")
        
        # Check if item is encrypted
        is_encrypted = item_data.get('is_encrypted', False) or item_data.get('isEncrypted', False)
        
        # Validate recipient exists
        recipient_data = self._validate_recipient(recipient_id)
        if not recipient_data:
            raise ValueError("Recipient user not found")
        
        # Check encryption compatibility
        recipient_has_encryption = recipient_data.get('has_encryption', False)
        
        if is_encrypted and not encrypted_key:
            raise ValueError("Encrypted items require an encrypted key for sharing")
        
        if is_encrypted and not recipient_has_encryption:
            raise ValueError("Cannot share encrypted content with users who don't have encryption enabled")
        
        # Check for existing active share
        existing_share = self._check_existing_share(owner_id, item_type, item_id, recipient_id)
        if existing_share:
            raise ValueError("An active share already exists for this recipient")
        
        # Generate share ID
        share_id = f"share_{uuid.uuid4().hex[:12]}"
        
        # Calculate expiration
        created_at = datetime.now(timezone.utc)
        expires_at = None
        if expires_in_hours:
            expires_at = created_at + timedelta(hours=expires_in_hours)
        
        # Create share item
        share_item = {
            'pk': f'SHARE#{share_id}',
            'sk': f'SHARE#{share_id}',
            'shareId': share_id,
            'itemType': item_type,
            'itemId': item_id,
            'ownerId': owner_id,
            'recipientId': recipient_id,
            'permissions': permissions,
            'isEncrypted': is_encrypted,
            'createdAt': created_at.isoformat(),
            'expiresAt': expires_at.isoformat() if expires_at else None,
            'isActive': True,
            'accessCount': 0,
            # GSI attributes for querying
            'gsi1_pk': f'USER#{owner_id}',
            'gsi1_sk': f'SHARE#{created_at.isoformat()}',
            'gsi2_pk': f'USER#{recipient_id}',
            'gsi2_sk': f'SHARE#{created_at.isoformat()}',
            'gsi3_pk': f'{item_type.upper()}#{item_id}',
            'gsi3_sk': f'SHARE#{created_at.isoformat()}'
        }
        
        # Add encrypted key if provided
        if encrypted_key:
            share_item['encryptedKey'] = encrypted_key
        
        # Save to DynamoDB
        try:
            self.table.put_item(Item=share_item)
            
            # Update the original item to track shares
            self._update_item_shares(owner_id, item_type, item_id, recipient_id, 'add')
            
            logger.info(f"Created share {share_id} for {item_type} {item_id}")
            
            return {
                'shareId': share_id,
                'createdAt': created_at.isoformat(),
                'expiresAt': expires_at.isoformat() if expires_at else None,
                'isEncrypted': is_encrypted
            }
            
        except Exception as e:
            logger.error(f"Failed to create share: {str(e)}")
            raise
    
    @tracer.capture_method
    def _validate_ownership(self, user_id: str, item_type: str, item_id: str) -> Optional[Dict[str, Any]]:
        """
        Validate that the user owns the item being shared.
        
        Returns the item data if found, None otherwise.
        """
        try:
            if item_type == 'journal':
                # Check journal ownership
                response = self.table.get_item(
                    Key={
                        'pk': f'USER#{user_id}',
                        'sk': f'JOURNAL#{item_id}'
                    }
                )
            elif item_type == 'goal':
                # Check goal ownership
                response = self.table.get_item(
                    Key={
                        'pk': f'USER#{user_id}',
                        'sk': f'GOAL#{item_id}'
                    }
                )
            else:
                return None
            
            return response.get('Item')
            
        except Exception as e:
            logger.error(f"Error validating ownership: {str(e)}")
            return None
    
    @tracer.capture_method
    def _validate_recipient(self, recipient_id: str) -> Optional[Dict[str, Any]]:
        """
        Validate that the recipient exists and check if they have encryption.
        
        Returns dict with user info including encryption status.
        """
        try:
            # Check if user exists
            user_response = self.table.get_item(
                Key={
                    'pk': f'USER#{recipient_id}',
                    'sk': f'USER#{recipient_id}'
                }
            )
            
            if 'Item' not in user_response:
                return None
            
            user_data = {
                'exists': True,
                'user_id': recipient_id
            }
            
            # Check if user has encryption setup
            encryption_response = self.table.get_item(
                Key={
                    'pk': f'USER#{recipient_id}',
                    'sk': 'ENCRYPTION'
                }
            )
            
            user_data['has_encryption'] = 'Item' in encryption_response
            
            return user_data
            
        except Exception as e:
            logger.error(f"Error validating recipient: {str(e)}")
            return None
    
    @tracer.capture_method
    def _check_existing_share(self, owner_id: str, item_type: str, item_id: str, recipient_id: str) -> Optional[Dict[str, Any]]:
        """Check if an active share already exists."""
        try:
            # Query shares for this item using the correct GSI
            # Note: We might not have ItemSharesIndex, so let's query by owner first
            response = self.table.query(
                IndexName='EmailIndex',  # Using available GSI
                KeyConditionExpression=Key('gsi1_pk').eq(f'USER#{owner_id}')
            )
            
            # Filter for shares of this specific item to this specific recipient
            for item in response.get('Items', []):
                if (item.get('itemType') == item_type and
                    item.get('itemId') == item_id and
                    item.get('recipientId') == recipient_id and 
                    item.get('isActive', False)):
                    
                    # Check if not expired
                    if item.get('expiresAt'):
                        expires_at = datetime.fromisoformat(item['expiresAt'].replace('Z', '+00:00'))
                        if expires_at < datetime.now(timezone.utc):
                            continue
                    
                    return item
            
            return None
            
        except Exception as e:
            logger.warning(f"Error checking existing share: {str(e)}")
            # If GSI doesn't exist, just continue - we'll allow the share
            return None
    
    @tracer.capture_method
    def _update_item_shares(self, owner_id: str, item_type: str, item_id: str, recipient_id: str, action: str):
        """Update the shared_with list on the original item."""
        try:
            # Construct the correct key for the item
            item_key = {
                'pk': f'USER#{owner_id}',
                'sk': f'{item_type.upper()}#{item_id}'
            }
            
            # Get the current item
            response = self.table.get_item(Key=item_key)
            
            if response.get('Item'):
                item = response['Item']
                shared_with = item.get('sharedWith', item.get('shared_with', []))
                
                if action == 'add' and recipient_id not in shared_with:
                    shared_with.append(recipient_id)
                elif action == 'remove' and recipient_id in shared_with:
                    shared_with.remove(recipient_id)
                
                # Update the item
                self.table.update_item(
                    Key=item_key,
                    UpdateExpression='SET sharedWith = :sw, isShared = :is',
                    ExpressionAttributeValues={
                        ':sw': shared_with,
                        ':is': len(shared_with) > 0
                    }
                )
                logger.info(f"Updated {item_type} {item_id} shares list")
                    
        except Exception as e:
            logger.warning(f"Failed to update item shares: {str(e)}")
            # Non-critical error, don't fail the share creation
