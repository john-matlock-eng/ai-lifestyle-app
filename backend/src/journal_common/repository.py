"""
Repository for Journal DynamoDB operations.

Implements single-table design patterns for journal entries.
"""

import os
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone
from decimal import Decimal
import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

from .models import JournalEntry, JournalStats, TemplateUsage

logger = Logger()


class JournalRepository:
    """Repository for Journal DynamoDB operations."""
    
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        # Use the MAIN table for single-table design
        self.table_name = os.environ.get('TABLE_NAME') or os.environ.get('MAIN_TABLE_NAME')
        
        if not self.table_name:
            raise ValueError("TABLE_NAME or MAIN_TABLE_NAME environment variable not set")
            
        self.table = self.dynamodb.Table(self.table_name)
        logger.info(f"Using main table: {self.table_name}")
    
    # Key generation methods
    def _user_key(self, user_id: str) -> str:
        """Generate user partition key."""
        return f"USER#{user_id}"
    
    def _journal_key(self, entry_id: str) -> str:
        """Generate journal entry sort key."""
        return f"JOURNAL#{entry_id}"
    
    def _journal_month_key(self, user_id: str, year_month: str) -> str:
        """Generate monthly journal GSI partition key."""
        return f"USER#{user_id}#JOURNAL#{year_month}"
    
    def _journal_stats_key(self) -> str:
        """Generate journal stats sort key."""
        return "JOURNAL#STATS"
    
    def _convert_floats_to_decimal(self, data: Any) -> Any:
        """Convert all float values to Decimal for DynamoDB compatibility."""
        if isinstance(data, float):
            # Convert float to Decimal, handling special cases
            if data == float('inf') or data == float('-inf') or data != data:  # NaN
                return None  # DynamoDB doesn't support infinity or NaN
            return Decimal(str(data))
        elif isinstance(data, dict):
            return {k: self._convert_floats_to_decimal(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._convert_floats_to_decimal(item) for item in data]
        else:
            return data
    
    def _convert_decimal_to_float(self, data: Any) -> Any:
        """Convert Decimal values back to float for response."""
        if isinstance(data, Decimal):
            return float(data)
        elif isinstance(data, dict):
            return {k: self._convert_decimal_to_float(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._convert_decimal_to_float(item) for item in data]
        else:
            return data
    
    # Journal CRUD operations
    def create_entry(self, entry: JournalEntry) -> JournalEntry:
        """Create a new journal entry."""
        try:
            # Convert entry to dict and handle float->Decimal conversion
            entry_data = entry.model_dump(mode='json')
            entry_data = self._convert_floats_to_decimal(entry_data)
            
            # Extract year-month for GSI
            year_month = entry.created_at.strftime("%Y-%m")
            
            item = {
                'pk': self._user_key(entry.user_id),
                'sk': self._journal_key(entry.entry_id),
                'EntityType': 'JournalEntry',
                'gsi1_pk': self._journal_month_key(entry.user_id, year_month),
                'gsi1_sk': entry.created_at.isoformat(),
                # Store all entry attributes
                **entry_data
            }
            
            self.table.put_item(
                Item=item,
                ConditionExpression='attribute_not_exists(pk) AND attribute_not_exists(sk)'
            )
            
            logger.info(f"Created journal entry {entry.entry_id} for user {entry.user_id}")
            return entry
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"Journal entry {entry.entry_id} already exists")
                raise ValueError(f"Journal entry {entry.entry_id} already exists")
            logger.error(f"Failed to create journal entry: {str(e)}")
            raise
    
    def get_entry(self, user_id: str, entry_id: str) -> Optional[JournalEntry]:
        """Get a journal entry by ID."""
        try:
            response = self.table.get_item(
                Key={
                    'pk': self._user_key(user_id),
                    'sk': self._journal_key(entry_id)
                }
            )
            
            if 'Item' not in response:
                return None
            
            item = response['Item']
            # Remove DynamoDB-specific fields
            item.pop('pk', None)
            item.pop('sk', None)
            item.pop('EntityType', None)
            item.pop('gsi1_pk', None)
            item.pop('gsi1_sk', None)
            
            # Convert decimals back to floats
            item = self._convert_decimal_to_float(item)
            
            return JournalEntry(**item)
            
        except Exception as e:
            logger.error(f"Failed to get journal entry: {str(e)}")
            raise
    
    def update_entry(self, user_id: str, entry_id: str, updates: Dict[str, Any]) -> JournalEntry:
        """Update a journal entry."""
        try:
            # Convert floats to decimals
            updates = self._convert_floats_to_decimal(updates)
            
            # Build update expression
            update_parts = []
            expression_values = {}
            expression_names = {}
            
            for key, value in updates.items():
                if key not in ['user_id', 'entry_id', 'created_at']:  # Don't update these fields
                    safe_key = f"#{key}"
                    expression_names[safe_key] = key
                    expression_values[f":{key}"] = value
                    update_parts.append(f"{safe_key} = :{key}")
            
            # Always update the updated_at timestamp
            expression_values[':updated_at'] = datetime.now(timezone.utc).isoformat()
            update_parts.append("updated_at = :updated_at")
            
            if not update_parts:
                raise ValueError("No fields to update")
            
            update_expression = "SET " + ", ".join(update_parts)
            
            response = self.table.update_item(
                Key={
                    'pk': self._user_key(user_id),
                    'sk': self._journal_key(entry_id)
                },
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_names,
                ExpressionAttributeValues=expression_values,
                ConditionExpression='attribute_exists(pk) AND attribute_exists(sk)',
                ReturnValues='ALL_NEW'
            )
            
            item = response['Attributes']
            # Remove DynamoDB-specific fields
            item.pop('pk', None)
            item.pop('sk', None)
            item.pop('EntityType', None)
            item.pop('gsi1_pk', None)
            item.pop('gsi1_sk', None)
            
            # Convert decimals back to floats
            item = self._convert_decimal_to_float(item)
            
            return JournalEntry(**item)
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"Journal entry {entry_id} not found")
                raise ValueError(f"Journal entry {entry_id} not found")
            logger.error(f"Failed to update journal entry: {str(e)}")
            raise
    
    def delete_entry(self, user_id: str, entry_id: str) -> bool:
        """Delete a journal entry."""
        try:
            self.table.delete_item(
                Key={
                    'pk': self._user_key(user_id),
                    'sk': self._journal_key(entry_id)
                },
                ConditionExpression='attribute_exists(pk) AND attribute_exists(sk)'
            )
            
            logger.info(f"Deleted journal entry {entry_id} for user {user_id}")
            return True
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                logger.error(f"Journal entry {entry_id} not found")
                return False
            logger.error(f"Failed to delete journal entry: {str(e)}")
            raise
    
    def list_user_entries(
        self,
        user_id: str,
        limit: int = 20,
        last_evaluated_key: Optional[Dict[str, Any]] = None,
        goal_id: Optional[str] = None
    ) -> Tuple[List[JournalEntry], Optional[Dict[str, Any]]]:
        """List journal entries for a user."""
        try:
            query_params = {
                'KeyConditionExpression': Key('pk').eq(self._user_key(user_id)) & Key('sk').begins_with('JOURNAL#'),
                'Limit': limit,
                'ScanIndexForward': False  # Newest first
            }
            
            if last_evaluated_key:
                query_params['ExclusiveStartKey'] = last_evaluated_key
            
            # Filter by goal_id if provided
            if goal_id:
                query_params['FilterExpression'] = Attr('linked_goal_ids').contains(goal_id)
            
            response = self.table.query(**query_params)
            
            entries = []
            for item in response.get('Items', []):
                # Skip stats items
                if item['sk'] == self._journal_stats_key():
                    continue
                    
                # Remove DynamoDB-specific fields
                item.pop('pk', None)
                item.pop('sk', None)
                item.pop('EntityType', None)
                item.pop('gsi1_pk', None)
                item.pop('gsi1_sk', None)
                
                # Convert decimals back to floats
                item = self._convert_decimal_to_float(item)
                
                entries.append(JournalEntry(**item))
            
            return entries, response.get('LastEvaluatedKey')
            
        except Exception as e:
            logger.error(f"Failed to list journal entries: {str(e)}")
            raise
    
    def get_user_stats(self, user_id: str) -> JournalStats:
        """Get journal statistics for a user."""
        try:
            # Get the stats item
            response = self.table.get_item(
                Key={
                    'pk': self._user_key(user_id),
                    'sk': self._journal_stats_key()
                }
            )
            
            if 'Item' in response:
                item = response['Item']
                # Remove DynamoDB-specific fields
                item.pop('pk', None)
                item.pop('sk', None)
                item.pop('EntityType', None)
                
                # Convert decimals back to floats
                item = self._convert_decimal_to_float(item)
                
                return JournalStats(**item)
            else:
                # Return default stats if none exist
                return JournalStats(
                    total_entries=0,
                    total_words=0,
                    entries_this_month=0,
                    entries_this_week=0,
                    current_streak=0,
                    longest_streak=0,
                    last_entry_date=None,
                    average_words_per_entry=0.0,
                    goals_tracked=0,
                    goals_completed=0,
                    template_usage=[]
                )
                
        except Exception as e:
            logger.error(f"Failed to get journal stats: {str(e)}")
            raise
    
    def update_user_stats(self, user_id: str, stats: JournalStats) -> None:
        """Update journal statistics for a user."""
        try:
            # Convert stats to dict and handle float->Decimal conversion
            stats_data = stats.model_dump(mode='json')
            stats_data = self._convert_floats_to_decimal(stats_data)
            
            item = {
                'pk': self._user_key(user_id),
                'sk': self._journal_stats_key(),
                'EntityType': 'JournalStats',
                'user_id': user_id,
                # Store all stats attributes
                **stats_data
            }
            
            self.table.put_item(Item=item)
            
            logger.info(f"Updated journal stats for user {user_id}")
            
        except Exception as e:
            logger.error(f"Failed to update journal stats: {str(e)}")
            raise