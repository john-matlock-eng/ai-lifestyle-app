# Single-Table Repository Pattern

## Purpose
Base repository class for DynamoDB single-table design. All feature repositories should inherit from this.

## Base Repository

```python
"""
Base repository for single-table DynamoDB operations.
"""
import os
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

logger = Logger()


class SingleTableRepository:
    """
    Base repository implementing single-table DynamoDB patterns.
    
    All feature repositories should inherit from this class.
    """
    
    def __init__(self):
        """Initialize DynamoDB connection to the main table."""
        self.dynamodb = boto3.resource('dynamodb')
        
        # CRITICAL: Always use the main table
        self.table_name = os.environ.get('TABLE_NAME') or os.environ.get('MAIN_TABLE_NAME')
        
        if not self.table_name:
            raise ValueError("TABLE_NAME or MAIN_TABLE_NAME environment variable not set")
            
        self.table = self.dynamodb.Table(self.table_name)
        logger.info(f"Initialized repository with table: {self.table_name}")
    
    # Common key generation methods
    def _user_key(self, user_id: str) -> str:
        """Generate user partition key."""
        return f"USER#{user_id}"
    
    def _timestamp_key(self, timestamp: datetime) -> str:
        """Generate timestamp-based sort key component."""
        return timestamp.isoformat()
    
    # Generic CRUD operations
    def put_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """
        Put an item into the table.
        
        Args:
            item: Complete item dictionary with pk and sk
            
        Returns:
            The item that was stored
        """
        try:
            self.table.put_item(Item=item)
            logger.info(f"Stored item with pk={item.get('pk')}, sk={item.get('sk')}")
            return item
        except ClientError as e:
            logger.error(f"Failed to put item: {str(e)}")
            raise
    
    def get_item(self, pk: str, sk: str) -> Optional[Dict[str, Any]]:
        """
        Get a single item by primary key.
        
        Args:
            pk: Partition key
            sk: Sort key
            
        Returns:
            Item dictionary or None if not found
        """
        try:
            response = self.table.get_item(
                Key={'pk': pk, 'sk': sk}
            )
            return response.get('Item')
        except ClientError as e:
            logger.error(f"Failed to get item: {str(e)}")
            raise
    
    def query_by_pk(
        self,
        pk: str,
        sk_prefix: Optional[str] = None,
        limit: int = 100,
        last_evaluated_key: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[Dict[str, Any]], Optional[Dict[str, Any]]]:
        """
        Query items by partition key with optional SK prefix.
        
        Args:
            pk: Partition key
            sk_prefix: Optional SK prefix for filtering
            limit: Maximum items to return
            last_evaluated_key: For pagination
            
        Returns:
            Tuple of (items, last_evaluated_key)
        """
        try:
            key_condition = Key('pk').eq(pk)
            if sk_prefix:
                key_condition = key_condition & Key('sk').begins_with(sk_prefix)
            
            query_params = {
                'KeyConditionExpression': key_condition,
                'Limit': limit
            }
            
            if last_evaluated_key:
                query_params['ExclusiveStartKey'] = last_evaluated_key
            
            response = self.table.query(**query_params)
            
            return response.get('Items', []), response.get('LastEvaluatedKey')
            
        except ClientError as e:
            logger.error(f"Failed to query items: {str(e)}")
            raise
    
    def query_by_gsi(
        self,
        index_name: str,
        pk_value: str,
        sk_value: Optional[str] = None,
        sk_prefix: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Query items using a Global Secondary Index.
        
        Args:
            index_name: Name of the GSI (e.g., 'EmailIndex')
            pk_value: GSI partition key value
            sk_value: Exact GSI sort key value (optional)
            sk_prefix: GSI sort key prefix (optional)
            limit: Maximum items to return
            
        Returns:
            List of items
        """
        try:
            # Build key condition
            if index_name == 'EmailIndex':
                key_condition = Key('gsi1_pk').eq(pk_value)
                if sk_value:
                    key_condition = key_condition & Key('gsi1_sk').eq(sk_value)
                elif sk_prefix:
                    key_condition = key_condition & Key('gsi1_sk').begins_with(sk_prefix)
            else:
                raise ValueError(f"Unknown index: {index_name}")
            
            response = self.table.query(
                IndexName=index_name,
                KeyConditionExpression=key_condition,
                Limit=limit
            )
            
            return response.get('Items', [])
            
        except ClientError as e:
            logger.error(f"Failed to query GSI: {str(e)}")
            raise
    
    def update_item(
        self,
        pk: str,
        sk: str,
        updates: Dict[str, Any],
        condition: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Update an existing item.
        
        Args:
            pk: Partition key
            sk: Sort key
            updates: Dictionary of attributes to update
            condition: Optional condition expression
            
        Returns:
            Updated item or None if condition failed
        """
        try:
            # Build update expression
            update_parts = []
            expression_values = {}
            expression_names = {}
            
            for key, value in updates.items():
                safe_key = f"#{key}" if key in ['status', 'type'] else key
                if safe_key.startswith('#'):
                    expression_names[safe_key] = key
                    
                expression_values[f":{key}"] = value
                update_parts.append(f"{safe_key} = :{key}")
            
            update_params = {
                'Key': {'pk': pk, 'sk': sk},
                'UpdateExpression': f"SET {', '.join(update_parts)}",
                'ExpressionAttributeValues': expression_values,
                'ReturnValues': 'ALL_NEW'
            }
            
            if expression_names:
                update_params['ExpressionAttributeNames'] = expression_names
                
            if condition:
                update_params['ConditionExpression'] = condition
            else:
                # Default condition - item must exist
                update_params['ConditionExpression'] = 'attribute_exists(pk) AND attribute_exists(sk)'
            
            response = self.table.update_item(**update_params)
            return response.get('Attributes')
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                return None
            logger.error(f"Failed to update item: {str(e)}")
            raise
    
    def delete_item(self, pk: str, sk: str) -> bool:
        """
        Delete an item.
        
        Args:
            pk: Partition key
            sk: Sort key
            
        Returns:
            True if deleted, False if not found
        """
        try:
            self.table.delete_item(
                Key={'pk': pk, 'sk': sk},
                ConditionExpression='attribute_exists(pk) AND attribute_exists(sk)'
            )
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                return False
            logger.error(f"Failed to delete item: {str(e)}")
            raise
    
    def batch_get_items(self, keys: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """
        Get multiple items in a single request.
        
        Args:
            keys: List of {'pk': ..., 'sk': ...} dictionaries
            
        Returns:
            List of items found
        """
        if not keys:
            return []
            
        try:
            response = self.dynamodb.batch_get_item(
                RequestItems={
                    self.table_name: {
                        'Keys': keys
                    }
                }
            )
            
            return response.get('Responses', {}).get(self.table_name, [])
            
        except ClientError as e:
            logger.error(f"Failed to batch get items: {str(e)}")
            raise
```

## Feature Repository Example

```python
"""
Example feature repository inheriting from SingleTableRepository.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from uuid import uuid4

from .single_table_repository import SingleTableRepository
from ..models import Goal, GoalStatus


class GoalsRepository(SingleTableRepository):
    """Repository for goal-related operations."""
    
    def create_goal(self, user_id: str, goal_data: Dict[str, Any]) -> Goal:
        """Create a new goal for a user."""
        goal_id = str(uuid4())
        now = datetime.utcnow()
        
        # Build the item with proper keys
        item = {
            'pk': self._user_key(user_id),
            'sk': f'GOAL#{goal_id}',
            'EntityType': 'Goal',
            'gsi1_pk': f'GOALS#{goal_data["status"]}',
            'gsi1_sk': f'{now.isoformat()}#{goal_id}',
            'goal_id': goal_id,
            'user_id': user_id,
            'created_at': now.isoformat(),
            'updated_at': now.isoformat(),
            **goal_data
        }
        
        # Store in the single table
        self.put_item(item)
        
        # Return the model
        return Goal(goal_id=goal_id, user_id=user_id, **goal_data)
    
    def get_user_goals(self, user_id: str) -> List[Goal]:
        """Get all goals for a user."""
        items, _ = self.query_by_pk(
            pk=self._user_key(user_id),
            sk_prefix='GOAL#'
        )
        
        goals = []
        for item in items:
            if item.get('EntityType') == 'Goal':
                # Remove DynamoDB metadata
                self._clean_item(item)
                goals.append(Goal(**item))
        
        return goals
    
    def get_goals_by_status(self, status: GoalStatus) -> List[Goal]:
        """Get all goals with a specific status."""
        items = self.query_by_gsi(
            index_name='EmailIndex',
            pk_value=f'GOALS#{status.value}'
        )
        
        goals = []
        for item in items:
            if item.get('EntityType') == 'Goal':
                self._clean_item(item)
                goals.append(Goal(**item))
        
        return goals
    
    def update_goal_status(self, user_id: str, goal_id: str, status: GoalStatus) -> Optional[Goal]:
        """Update a goal's status."""
        updated = self.update_item(
            pk=self._user_key(user_id),
            sk=f'GOAL#{goal_id}',
            updates={
                'status': status.value,
                'updated_at': datetime.utcnow().isoformat(),
                'gsi1_pk': f'GOALS#{status.value}'
            }
        )
        
        if updated:
            self._clean_item(updated)
            return Goal(**updated)
        
        return None
    
    def _clean_item(self, item: Dict[str, Any]) -> None:
        """Remove DynamoDB metadata from item."""
        for field in ['pk', 'sk', 'EntityType', 'gsi1_pk', 'gsi1_sk', 'TTL']:
            item.pop(field, None)
```

## Usage in Service Layer

```python
from ..repositories import GoalsRepository
from ..models import CreateGoalRequest, Goal

class GoalsService:
    def __init__(self):
        self.repository = GoalsRepository()
    
    def create_goal(self, user_id: str, request: CreateGoalRequest) -> Goal:
        """Create a new goal."""
        goal_data = request.model_dump()
        return self.repository.create_goal(user_id, goal_data)
    
    def list_user_goals(self, user_id: str) -> List[Goal]:
        """List all goals for a user."""
        return self.repository.get_user_goals(user_id)
```

## Key Points

1. **Always inherit from SingleTableRepository**
2. **Use the main table via TABLE_NAME environment variable**
3. **Include EntityType field in all items**
4. **Use proper key prefixes (USER#, GOAL#, etc.)**
5. **Clean DynamoDB metadata before returning models**
6. **Use GSI for cross-partition queries**
7. **Never create feature-specific tables**
