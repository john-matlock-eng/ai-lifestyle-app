"""
Service for creating encrypted shares.
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
    """Service for creating encrypted shares."""
    
    def __init__(self):
        """Initialize the service with DynamoDB client."""
        self.dynamodb = boto3.resource('dynamodb')
        self.table_name = os.environ['MAIN_TABLE_NAME']
        self.table = self.dynamodb.Table(self.table_name)
    
    @tracer.capture_method
    def create_share(
        self,
        owner_id: str,
        item_type: str,
        item_id: str,
        recipient_id: str,
        encrypted_key: str,
        permissions: List[str],
        expires_in_hours: Optional[int] = 24
    ) -> Dict[str, Any]:
        """
        Create a new encrypted share.
        
        Args:
            owner_id: ID of the user creating the share
            item_type: Type of item being shared (journal, goal)
            item_id: ID of the item being shared
            recipient_id: ID of the recipient user
            encrypted_key: Re-encrypted content key for recipient
            permissions: List of permissions to grant
            expires_in_hours: Hours until share expires
            
        Returns:
            Dict containing share details
            
        Raises:
            ValueError: If validation fails
        """
        # Validate owner owns the item
        if not self._validate_ownership(owner_id, item_type, item_id):
            raise ValueError(f"User does not own this {item_type}")
        
        # Validate recipient exists and has encryption
        if not self._validate_recipient(recipient_id):
            raise ValueError("Recipient user not found or does not have encryption enabled")
        
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
            'encryptedKey': encrypted_key,
            'permissions': permissions,
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
        
        # Save to DynamoDB
        try:
            self.table.put_item(Item=share_item)
            
            # Update the original item to track shares
            self._update_item_shares(item_type, item_id, recipient_id, 'add')
            
            logger.info(f"Created share {share_id} for {item_type} {item_id}")
            
            return {
                'shareId': share_id,
                'createdAt': created_at.isoformat(),
                'expiresAt': expires_at.isoformat() if expires_at else None
            }
            
        except Exception as e:
            logger.error(f"Failed to create share: {str(e)}")
            raise
    
    @tracer.capture_method
    def _validate_ownership(self, user_id: str, item_type: str, item_id: str) -> bool:
        """Validate that the user owns the item being shared."""
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
                return False
            
            return 'Item' in response
            
        except Exception as e:
            logger.error(f"Error validating ownership: {str(e)}")
            return False
    
    @tracer.capture_method
    def _validate_recipient(self, recipient_id: str) -> bool:
        """Validate that the recipient exists and has encryption enabled."""
        try:
            # Check if user exists
            user_response = self.table.get_item(
                Key={
                    'pk': f'USER#{recipient_id}',
                    'sk': f'USER#{recipient_id}'
                }
            )
            
            if 'Item' not in user_response:
                return False
            
            # Check if user has encryption setup
            encryption_response = self.table.get_item(
                Key={
                    'pk': f'USER#{recipient_id}',
                    'sk': 'ENCRYPTION#SETUP'
                }
            )
            
            return 'Item' in encryption_response
            
        except Exception as e:
            logger.error(f"Error validating recipient: {str(e)}")
            return False
    
    @tracer.capture_method
    def _check_existing_share(self, owner_id: str, item_type: str, item_id: str, recipient_id: str) -> Optional[Dict[str, Any]]:
        """Check if an active share already exists."""
        try:
            # Query shares for this item
            response = self.table.query(
                IndexName='ItemSharesIndex',  # Assuming GSI3
                KeyConditionExpression=Key('gsi3_pk').eq(f'{item_type.upper()}#{item_id}')
            )
            
            # Check for active share with same recipient
            for item in response.get('Items', []):
                if (item.get('recipientId') == recipient_id and 
                    item.get('isActive', False) and
                    item.get('ownerId') == owner_id):
                    
                    # Check if not expired
                    if item.get('expiresAt'):
                        expires_at = datetime.fromisoformat(item['expiresAt'].replace('Z', '+00:00'))
                        if expires_at < datetime.now(timezone.utc):
                            continue
                    
                    return item
            
            return None
            
        except Exception as e:
            logger.warning(f"Error checking existing share: {str(e)}")
            return None
    
    @tracer.capture_method
    def _update_item_shares(self, item_type: str, item_id: str, recipient_id: str, action: str):
        """Update the shared_with list on the original item."""
        try:
            if item_type == 'journal':
                # Get the journal entry
                response = self.table.query(
                    IndexName='ItemTypeIndex',  # Assuming a GSI for querying by item type
                    KeyConditionExpression=Key('sk').eq(f'JOURNAL#{item_id}')
                )
                
                if response.get('Items'):
                    item = response['Items'][0]
                    shared_with = item.get('sharedWith', [])
                    
                    if action == 'add' and recipient_id not in shared_with:
                        shared_with.append(recipient_id)
                    elif action == 'remove' and recipient_id in shared_with:
                        shared_with.remove(recipient_id)
                    
                    # Update the item
                    self.table.update_item(
                        Key={
                            'pk': item['pk'],
                            'sk': item['sk']
                        },
                        UpdateExpression='SET sharedWith = :sw, isShared = :is',
                        ExpressionAttributeValues={
                            ':sw': shared_with,
                            ':is': len(shared_with) > 0
                        }
                    )
                    
        except Exception as e:
            logger.warning(f"Failed to update item shares: {str(e)}")
            # Non-critical error, don't fail the share creation
