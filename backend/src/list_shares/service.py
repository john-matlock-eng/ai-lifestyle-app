"""
Service for listing encrypted shares.
"""

import os
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import boto3
from boto3.dynamodb.conditions import Key
from aws_lambda_powertools import Logger, Tracer

logger = Logger()
tracer = Tracer()


class ListSharesService:
    """Service for listing encrypted shares."""
    
    def __init__(self):
        """Initialize the service with DynamoDB client."""
        self.dynamodb = boto3.resource('dynamodb')
        self.table_name = os.environ['MAIN_TABLE_NAME']
        self.table = self.dynamodb.Table(self.table_name)
    
    @tracer.capture_method
    def list_shares(
        self,
        user_id: str,
        direction: str = 'both',
        item_type: Optional[str] = None,
        include_expired: bool = False
    ) -> List[Dict[str, Any]]:
        """
        List shares for a user.
        
        Args:
            user_id: ID of the user
            direction: 'sent' (shares created by user), 'received' (shared with user), or 'both'
            item_type: Filter by item type (journal, goal)
            include_expired: Whether to include expired shares
            
        Returns:
            List of share objects
        """
        shares = []
        
        # Get shares created by user (sent)
        if direction in ['sent', 'both']:
            sent_shares = self._get_sent_shares(user_id)
            shares.extend(sent_shares)
        
        # Get shares received by user
        if direction in ['received', 'both']:
            received_shares = self._get_received_shares(user_id)
            shares.extend(received_shares)
        
        # Filter by item type if specified
        if item_type:
            shares = [s for s in shares if s.get('itemType') == item_type]
        
        # Filter out expired shares unless requested
        if not include_expired:
            shares = self._filter_expired_shares(shares)
        
        # Sort by creation date (newest first)
        shares.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        
        # Transform shares for response
        return [self._transform_share(share) for share in shares]
    
    @tracer.capture_method
    def _get_sent_shares(self, user_id: str) -> List[Dict[str, Any]]:
        """Get shares created by the user."""
        try:
            # Use the EmailIndex GSI which is keyed by gsi1_pk
            response = self.table.query(
                IndexName='EmailIndex',
                KeyConditionExpression=Key('gsi1_pk').eq(f'USER#{user_id}') & Key('gsi1_sk').begins_with('SHARE#')
            )
            
            shares = []
            for item in response.get('Items', []):
                # Verify this is a share item and user is the owner
                if (item.get('pk', '').startswith('SHARE#') and 
                    item.get('ownerId') == user_id and
                    item.get('isActive', False)):
                    shares.append(item)
            
            # Handle pagination if needed
            while 'LastEvaluatedKey' in response:
                response = self.table.query(
                    IndexName='EmailIndex',
                    KeyConditionExpression=Key('gsi1_pk').eq(f'USER#{user_id}') & Key('gsi1_sk').begins_with('SHARE#'),
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                for item in response.get('Items', []):
                    if (item.get('pk', '').startswith('SHARE#') and 
                        item.get('ownerId') == user_id and
                        item.get('isActive', False)):
                        shares.append(item)
            
            logger.info(f"Found {len(shares)} sent shares for user {user_id}")
            return shares
            
        except Exception as e:
            logger.error(f"Error getting sent shares: {str(e)}")
            return []
    
    @tracer.capture_method
    def _get_received_shares(self, user_id: str) -> List[Dict[str, Any]]:
        """Get shares received by the user."""
        try:
            # Use the RecipientSharesIndex GSI
            response = self.table.query(
                IndexName='RecipientSharesIndex',
                KeyConditionExpression=Key('gsi2_pk').eq(f'USER#{user_id}') & Key('gsi2_sk').begins_with('SHARE#')
            )
            
            shares = []
            for item in response.get('Items', []):
                if item.get('isActive', False):
                    shares.append(item)
            
            # Handle pagination if needed
            while 'LastEvaluatedKey' in response:
                response = self.table.query(
                    IndexName='RecipientSharesIndex',
                    KeyConditionExpression=Key('gsi2_pk').eq(f'USER#{user_id}') & Key('gsi2_sk').begins_with('SHARE#'),
                    ExclusiveStartKey=response['LastEvaluatedKey']
                )
                for item in response.get('Items', []):
                    if item.get('isActive', False):
                        shares.append(item)
            
            logger.info(f"Found {len(shares)} received shares for user {user_id}")
            return shares
            
        except Exception as e:
            logger.error(f"Error getting received shares: {str(e)}")
            return []
    
    @tracer.capture_method
    def _filter_expired_shares(self, shares: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Filter out expired shares."""
        current_time = datetime.now(timezone.utc)
        filtered_shares = []
        
        for share in shares:
            if share.get('expiresAt'):
                try:
                    expires_at = datetime.fromisoformat(share['expiresAt'].replace('Z', '+00:00'))
                    if expires_at > current_time:
                        filtered_shares.append(share)
                except Exception as e:
                    logger.warning(f"Error parsing expiration date: {str(e)}")
                    filtered_shares.append(share)
            else:
                # No expiration, include it
                filtered_shares.append(share)
        
        return filtered_shares
    
    @tracer.capture_method
    def _transform_share(self, share: Dict[str, Any]) -> Dict[str, Any]:
        """Transform share data for response."""
        # Get additional info if needed
        owner_info = self._get_user_info(share.get('ownerId'))
        recipient_info = self._get_user_info(share.get('recipientId'))
        
        # Check if expired
        is_expired = False
        if share.get('expiresAt'):
            try:
                expires_at = datetime.fromisoformat(share['expiresAt'].replace('Z', '+00:00'))
                is_expired = expires_at < datetime.now(timezone.utc)
            except:
                pass
        
        return {
            'id': share.get('shareId'),
            'itemType': share.get('itemType'),
            'itemId': share.get('itemId'),
            'ownerId': share.get('ownerId'),
            'ownerEmail': owner_info.get('email'),
            'recipientId': share.get('recipientId'),
            'recipientEmail': recipient_info.get('email'),
            'permissions': share.get('permissions', []),
            'createdAt': share.get('createdAt'),
            'expiresAt': share.get('expiresAt'),
            'isExpired': is_expired,
            'accessCount': share.get('accessCount', 0)
        }
    
    @tracer.capture_method
    def _get_user_info(self, user_id: Optional[str]) -> Dict[str, Any]:
        """Get basic user info for display."""
        if not user_id:
            return {}
        
        try:
            response = self.table.get_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'USER#{user_id}'
                }
            )
            
            if 'Item' in response:
                return {
                    'email': response['Item'].get('email'),
                    'username': response['Item'].get('username')
                }
            
            return {}
            
        except Exception as e:
            logger.warning(f"Error getting user info: {str(e)}")
            return {}
