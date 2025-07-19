"""
Service for revoking encrypted shares.
"""

import os
from datetime import datetime, timezone
from typing import Dict, Any
import boto3
from aws_lambda_powertools import Logger, Tracer

logger = Logger()
tracer = Tracer()


class RevokeShareService:
    """Service for revoking encrypted shares."""
    
    def __init__(self):
        """Initialize the service with DynamoDB client."""
        self.dynamodb = boto3.resource('dynamodb')
        self.table_name = os.environ['MAIN_TABLE_NAME']
        self.table = self.dynamodb.Table(self.table_name)
    
    @tracer.capture_method
    def revoke_share(self, user_id: str, share_id: str) -> None:
        """
        Revoke an encrypted share.
        
        Args:
            user_id: ID of the user revoking the share (must be owner)
            share_id: ID of the share to revoke
            
        Raises:
            ValueError: If share not found or user not authorized
        """
        # Get the share
        share = self._get_share(share_id)
        
        if not share:
            raise ValueError("Share not found")
        
        # Verify user is the owner
        if share.get('ownerId') != user_id:
            raise ValueError("Only the share owner can revoke access")
        
        # Check if already revoked
        if not share.get('isActive', False):
            raise ValueError("Share is already revoked")
        
        # Update share to inactive
        try:
            self.table.update_item(
                Key={
                    'pk': f'SHARE#{share_id}',
                    'sk': f'SHARE#{share_id}'
                },
                UpdateExpression='SET isActive = :inactive, revokedAt = :revoked_at, revokedBy = :revoked_by',
                ExpressionAttributeValues={
                    ':inactive': False,
                    ':revoked_at': datetime.now(timezone.utc).isoformat(),
                    ':revoked_by': user_id
                }
            )
            
            # Update the original item to remove from sharedWith list
            self._update_item_shares(
                owner_id=share.get('ownerId'),
                item_type=share.get('itemType'),
                item_id=share.get('itemId'),
                recipient_id=share.get('recipientId'),
                action='remove'
            )
            
            logger.info(f"Revoked share {share_id}")
            
        except Exception as e:
            logger.error(f"Failed to revoke share: {str(e)}")
            raise
    
    @tracer.capture_method
    def _get_share(self, share_id: str) -> Dict[str, Any]:
        """Get a share by ID."""
        try:
            response = self.table.get_item(
                Key={
                    'pk': f'SHARE#{share_id}',
                    'sk': f'SHARE#{share_id}'
                }
            )
            
            return response.get('Item')
            
        except Exception as e:
            logger.error(f"Error getting share: {str(e)}")
            return None
    
    @tracer.capture_method
    def _update_item_shares(self, owner_id: str, item_type: str, item_id: str, recipient_id: str, action: str):
        """Update the shared_with list on the original item."""
        if not all([owner_id, item_type, item_id, recipient_id]):
            logger.warning("Missing required parameters for updating item shares")
            return
        
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
                
                if action == 'remove' and recipient_id in shared_with:
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
                    logger.info(f"Updated {item_type} {item_id} shares list - removed {recipient_id}")
                else:
                    logger.info(f"Recipient {recipient_id} not in shared list for {item_type} {item_id}")
                    
        except Exception as e:
            logger.warning(f"Failed to update item shares: {str(e)}")
            # Non-critical error, don't fail the revocation
