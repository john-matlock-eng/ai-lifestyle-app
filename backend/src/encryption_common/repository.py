"""
Repository for encryption-related data operations.

Handles storage and retrieval of encryption keys, shares, and recovery data
using DynamoDB single-table design.
"""

import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key, Attr
from aws_lambda_powertools import Logger

from .models import (
    EncryptionKeys, Share, ShareType, SharePermission, RecoveryMethod,
    AI_SERVICE_ACCOUNT
)

logger = Logger()


class EncryptionRepository:
    """Repository for encryption data operations."""
    
    def __init__(self, table_name: str):
        """
        Initialize repository with DynamoDB table.
        
        Args:
            table_name: Name of the DynamoDB table
        """
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(table_name)
    
    # Encryption Keys Operations
    
    def save_encryption_keys(self, keys: EncryptionKeys) -> None:
        """
        Save user's encryption keys.
        
        Args:
            keys: Encryption keys to save
        """
        item = {
            'PK': f'USER#{keys.user_id}',
            'SK': 'ENCRYPTION#KEYS',
            'Type': 'EncryptionKeys',
            'UserId': keys.user_id,
            'Salt': keys.salt,
            'EncryptedPrivateKey': keys.encrypted_private_key,
            'PublicKey': keys.public_key,
            'PublicKeyId': keys.public_key_id,
            'RecoveryEnabled': keys.recovery_enabled,
            'RecoveryMethods': [method.value for method in keys.recovery_methods],
            'RecoveryData': keys.recovery_data,
            'CreatedAt': keys.created_at.isoformat(),
            'UpdatedAt': keys.updated_at.isoformat(),
            'TTL': None  # Encryption keys never expire
        }
        
        self.table.put_item(Item=item)
        logger.info(f"Saved encryption keys for user {keys.user_id}")
    
    def get_encryption_keys(self, user_id: str) -> Optional[EncryptionKeys]:
        """
        Get user's encryption keys.
        
        Args:
            user_id: User ID
            
        Returns:
            Encryption keys if found
        """
        response = self.table.get_item(
            Key={
                'PK': f'USER#{user_id}',
                'SK': 'ENCRYPTION#KEYS'
            }
        )
        
        item = response.get('Item')
        if not item:
            return None
        
        return EncryptionKeys(
            user_id=item['UserId'],
            salt=item['Salt'],
            encrypted_private_key=item['EncryptedPrivateKey'],
            public_key=item['PublicKey'],
            public_key_id=item['PublicKeyId'],
            recovery_enabled=item.get('RecoveryEnabled', False),
            recovery_methods=[RecoveryMethod(m) for m in item.get('RecoveryMethods', [])],
            recovery_data=item.get('RecoveryData'),
            created_at=datetime.fromisoformat(item['CreatedAt']),
            updated_at=datetime.fromisoformat(item['UpdatedAt'])
        )
    
    def get_public_key(self, user_id: str) -> Optional[Dict[str, str]]:
        """
        Get just the public key info for a user.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict with public key info if found
        """
        # Handle AI service account
        if user_id == AI_SERVICE_ACCOUNT["user_id"]:
            return {
                "user_id": AI_SERVICE_ACCOUNT["user_id"],
                "public_key": self._get_ai_public_key(),
                "public_key_id": AI_SERVICE_ACCOUNT["public_key_id"]
            }
        
        keys = self.get_encryption_keys(user_id)
        if not keys:
            return None
        
        return {
            "user_id": user_id,
            "public_key": keys.public_key,
            "public_key_id": keys.public_key_id
        }
    
    def _get_ai_public_key(self) -> str:
        """Get AI service public key from parameter store."""
        ssm = boto3.client('ssm')
        response = ssm.get_parameter(
            Name='/ai-lifestyle-app/ai-service/public-key',
            WithDecryption=False
        )
        return response['Parameter']['Value']
    
    # Share Operations
    
    def create_share(self, share: Share) -> None:
        """
        Create a new share.
        
        Args:
            share: Share to create
        """
        # Convert datetime fields
        item = {
            'PK': f'USER#{share.recipient_id}',
            'SK': f'SHARE#{share.share_id}',
            'Type': 'Share',
            'ShareId': share.share_id,
            'OwnerId': share.owner_id,
            'RecipientId': share.recipient_id,
            'ItemType': share.item_type,
            'ItemId': share.item_id,
            'EncryptedKey': share.encrypted_key,
            'ShareType': share.share_type.value,
            'Permissions': [p.value for p in share.permissions],
            'CreatedAt': share.created_at.isoformat(),
            'ExpiresAt': share.expires_at.isoformat() if share.expires_at else None,
            'AccessedAt': share.accessed_at.isoformat() if share.accessed_at else None,
            'AccessCount': share.access_count,
            'MaxAccesses': share.max_accesses,
            'IsActive': share.is_active,
            'RevokedAt': share.revoked_at.isoformat() if share.revoked_at else None,
            # GSI for owner queries
            'GSI1_PK': f'USER#{share.owner_id}',
            'GSI1_SK': f'SHARE#CREATED#{share.share_id}'
        }
        
        # Set TTL if share expires
        if share.expires_at:
            # Add 1 day buffer for cleanup
            ttl = int((share.expires_at.timestamp())) + 86400
            item['TTL'] = ttl
        
        self.table.put_item(Item=item)
        logger.info(f"Created share {share.share_id} from {share.owner_id} to {share.recipient_id}")
    
    def get_share(self, share_id: str, recipient_id: str) -> Optional[Share]:
        """
        Get a share by ID and recipient.
        
        Args:
            share_id: Share ID
            recipient_id: Recipient user ID
            
        Returns:
            Share if found
        """
        response = self.table.get_item(
            Key={
                'PK': f'USER#{recipient_id}',
                'SK': f'SHARE#{share_id}'
            }
        )
        
        item = response.get('Item')
        if not item:
            return None
        
        return self._item_to_share(item)
    
    def get_shares_for_recipient(
        self,
        recipient_id: str,
        item_type: Optional[str] = None,
        active_only: bool = True
    ) -> List[Share]:
        """
        Get all shares for a recipient.
        
        Args:
            recipient_id: Recipient user ID
            item_type: Filter by item type
            active_only: Only return active shares
            
        Returns:
            List of shares
        """
        # Query all shares for recipient
        response = self.table.query(
            KeyConditionExpression=Key('PK').eq(f'USER#{recipient_id}') & 
                                 Key('SK').begins_with('SHARE#')
        )
        
        shares = []
        for item in response.get('Items', []):
            share = self._item_to_share(item)
            
            # Apply filters
            if active_only and not share.is_active:
                continue
            if item_type and share.item_type != item_type:
                continue
            
            # Check expiration
            if share.expires_at and share.expires_at < datetime.now(timezone.utc):
                continue
            
            # Check access limit
            if share.max_accesses and share.access_count >= share.max_accesses:
                continue
            
            shares.append(share)
        
        return shares
    
    def get_shares_by_owner(
        self,
        owner_id: str,
        item_type: Optional[str] = None,
        active_only: bool = True
    ) -> List[Share]:
        """
        Get all shares created by an owner.
        
        Args:
            owner_id: Owner user ID
            item_type: Filter by item type
            active_only: Only return active shares
            
        Returns:
            List of shares
        """
        # Query using GSI1
        response = self.table.query(
            IndexName='GSI1',
            KeyConditionExpression=Key('GSI1_PK').eq(f'USER#{owner_id}') & 
                                 Key('GSI1_SK').begins_with('SHARE#CREATED#')
        )
        
        shares = []
        for item in response.get('Items', []):
            share = self._item_to_share(item)
            
            # Apply filters
            if active_only and not share.is_active:
                continue
            if item_type and share.item_type != item_type:
                continue
            
            shares.append(share)
        
        return shares
    
    def update_share_access(self, share_id: str, recipient_id: str) -> bool:
        """
        Update share access count and timestamp.
        
        Args:
            share_id: Share ID
            recipient_id: Recipient user ID
            
        Returns:
            True if successful, False if share not found or exceeded limits
        """
        try:
            # Get current share
            share = self.get_share(share_id, recipient_id)
            if not share:
                return False
            
            # Check if share is still valid
            if not share.is_active:
                return False
            
            if share.expires_at and share.expires_at < datetime.now(timezone.utc):
                return False
            
            if share.max_accesses and share.access_count >= share.max_accesses:
                return False
            
            # Update access info
            response = self.table.update_item(
                Key={
                    'PK': f'USER#{recipient_id}',
                    'SK': f'SHARE#{share_id}'
                },
                UpdateExpression='SET AccessCount = AccessCount + :inc, AccessedAt = :now',
                ExpressionAttributeValues={
                    ':inc': 1,
                    ':now': datetime.now(timezone.utc).isoformat()
                },
                ReturnValues='ALL_NEW'
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating share access: {str(e)}")
            return False
    
    def revoke_share(self, share_id: str, owner_id: str) -> bool:
        """
        Revoke a share.
        
        Args:
            share_id: Share ID
            owner_id: Owner user ID (for verification)
            
        Returns:
            True if successful
        """
        try:
            # First get the share using GSI to find recipient
            response = self.table.query(
                IndexName='GSI1',
                KeyConditionExpression=Key('GSI1_PK').eq(f'USER#{owner_id}') & 
                                     Key('GSI1_SK').eq(f'SHARE#CREATED#{share_id}')
            )
            
            items = response.get('Items', [])
            if not items:
                return False
            
            item = items[0]
            recipient_id = item['RecipientId']
            
            # Update the share
            self.table.update_item(
                Key={
                    'PK': f'USER#{recipient_id}',
                    'SK': f'SHARE#{share_id}'
                },
                UpdateExpression='SET IsActive = :false, RevokedAt = :now',
                ExpressionAttributeValues={
                    ':false': False,
                    ':now': datetime.now(timezone.utc).isoformat()
                }
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error revoking share: {str(e)}")
            return False
    
    def _item_to_share(self, item: Dict[str, Any]) -> Share:
        """Convert DynamoDB item to Share model."""
        return Share(
            share_id=item['ShareId'],
            owner_id=item['OwnerId'],
            recipient_id=item['RecipientId'],
            item_type=item['ItemType'],
            item_id=item['ItemId'],
            encrypted_key=item['EncryptedKey'],
            share_type=ShareType(item['ShareType']),
            permissions=[SharePermission(p) for p in item.get('Permissions', ['read'])],
            created_at=datetime.fromisoformat(item['CreatedAt']),
            expires_at=datetime.fromisoformat(item['ExpiresAt']) if item.get('ExpiresAt') else None,
            accessed_at=datetime.fromisoformat(item['AccessedAt']) if item.get('AccessedAt') else None,
            access_count=item.get('AccessCount', 0),
            max_accesses=item.get('MaxAccesses'),
            is_active=item.get('IsActive', True),
            revoked_at=datetime.fromisoformat(item['RevokedAt']) if item.get('RevokedAt') else None
        )
