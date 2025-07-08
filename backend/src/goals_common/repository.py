"""
Repository base class for Goals DynamoDB operations.

Provides common database access patterns for the Enhanced Goal System.
"""

import os
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError
from aws_lambda_powertools import Logger

from .models import Goal, GoalActivity, GoalPattern, GoalStatus

logger = Logger()


class GoalsRepository:
    """Base repository for Goals DynamoDB operations."""
    
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
    
    def _goal_key(self, goal_id: str) -> str:
        """Generate goal sort key."""
        return f"GOAL#{goal_id}"
    
    def _activity_key(self, goal_id: str, timestamp: datetime) -> str:
        """Generate activity sort key."""
        return f"ACTIVITY#{goal_id}#{timestamp.isoformat()}"
    
    def _status_key(self, status: str) -> str:
        """Generate status GSI1 partition key."""
        return f"STATUS#{status}"
    
    # Note: Additional GSI patterns can be added as needed
    # For now, we're using the main table's existing GSI structure
    
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
    
    # Goal CRUD operations
    def create_goal(self, goal: Goal) -> Goal:
        """Create a new goal."""
        try:
            # Convert goal to dict and handle float->Decimal conversion
            goal_data = goal.model_dump(mode='json')
            goal_data = self._convert_floats_to_decimal(goal_data)
            
            item = {
                'pk': self._user_key(goal.user_id),
                'sk': self._goal_key(goal.goal_id),
                'EntityType': 'Goal',
                'gsi1_pk': self._status_key(goal.status.value),
                'gsi1_sk': goal.created_at.isoformat(),
                # Store all goal attributes
                **goal_data
            }
            
            # Add TTL for draft goals (auto-delete after 30 days)
            if goal.status == GoalStatus.DRAFT:
                item['TTL'] = int((datetime.utcnow() + timedelta(days=30)).timestamp())
            
            self.table.put_item(
                Item=item,
                ConditionExpression='attribute_not_exists(pk) AND attribute_not_exists(sk)'
            )
            
            logger.info(f"Created goal {goal.goal_id} for user {goal.user_id}")
            return goal
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                raise ValueError(f"Goal {goal.goal_id} already exists")
            raise
    
    def get_goal(self, user_id: str, goal_id: str) -> Optional[Goal]:
        """Get a specific goal."""
        try:
            response = self.table.get_item(
                Key={
                    'pk': self._user_key(user_id),
                    'sk': self._goal_key(goal_id)
                }
            )
            
            if 'Item' not in response:
                return None
            
            item = response['Item']
            # Remove DynamoDB-specific fields
            for field in ['pk', 'sk', 'EntityType', 'gsi1_pk', 'gsi1_sk', 'TTL']:
                item.pop(field, None)
            
            return Goal(**item)
            
        except Exception as e:
            logger.error(f"Error getting goal {goal_id}: {str(e)}")
            raise
    
    def update_goal(self, user_id: str, goal_id: str, updates: Dict[str, Any]) -> Optional[Goal]:
        """Update a goal."""
        try:
            # Build update expression
            update_parts = []
            expression_values = {}
            expression_names = {}
            
            for key, value in updates.items():
                if key not in ['user_id', 'goal_id', 'created_at']:  # Immutable fields
                    safe_key = f"#{key}"
                    expression_names[safe_key] = key
                    expression_values[f":{key}"] = self._convert_floats_to_decimal(value)
                    update_parts.append(f"{safe_key} = :{key}")
            
            # Always update the updated_at timestamp
            expression_values[':updated_at'] = datetime.utcnow().isoformat()
            update_parts.append('updated_at = :updated_at')
            
            # Update GSI keys if status changed
            if 'status' in updates:
                expression_values[':gsi1pk'] = self._status_key(updates['status'])
                update_parts.append('gsi1_pk = :gsi1pk')
            
            response = self.table.update_item(
                Key={
                    'pk': self._user_key(user_id),
                    'sk': self._goal_key(goal_id)
                },
                UpdateExpression=f"SET {', '.join(update_parts)}",
                ExpressionAttributeValues=expression_values,
                ExpressionAttributeNames=expression_names if expression_names else None,
                ConditionExpression='attribute_exists(pk) AND attribute_exists(sk)',
                ReturnValues='ALL_NEW'
            )
            
            item = response['Attributes']
            # Remove DynamoDB-specific fields
            for field in ['pk', 'sk', 'EntityType', 'gsi1_pk', 'gsi1_sk', 'TTL']:
                item.pop(field, None)
            
            return Goal(**item)
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
                return None
            raise
    
    def delete_goal(self, user_id: str, goal_id: str) -> bool:
        """Delete a goal (actually archives it)."""
        try:
            # Archive instead of delete
            return self.update_goal(
                user_id, 
                goal_id, 
                {
                    'status': GoalStatus.ARCHIVED.value,
                    'archived_at': datetime.utcnow().isoformat()
                }
            ) is not None
            
        except Exception as e:
            logger.error(f"Error archiving goal {goal_id}: {str(e)}")
            return False
    
    def list_user_goals(
        self,
        user_id: str,
        status: Optional[GoalStatus] = None,
        category: Optional[str] = None,
        limit: int = 20,
        last_evaluated_key: Optional[Dict[str, Any]] = None
    ) -> Tuple[List[Goal], Optional[Dict[str, Any]]]:
        """List user's goals with optional filtering."""
        try:
            if status:
                # Query by status using GSI1  
                query_params = {
                    'IndexName': 'EmailIndex',  # Using the existing GSI
                    'KeyConditionExpression': Key('gsi1_pk').eq(self._status_key(status.value)),
                    'FilterExpression': Attr('user_id').eq(user_id),
                    'Limit': limit
                }
            else:
                # Query all user goals
                query_params = {
                    'KeyConditionExpression': Key('pk').eq(self._user_key(user_id)) & Key('sk').begins_with('GOAL#'),
                    'Limit': limit
                }
            
            if last_evaluated_key:
                query_params['ExclusiveStartKey'] = last_evaluated_key
            
            response = self.table.query(**query_params)
            
            goals = []
            for item in response['Items']:
                # Only process Goal entities
                if item.get('EntityType') == 'Goal' or item.get('sk', '').startswith('GOAL#'):
                    # Remove DynamoDB-specific fields
                    for field in ['pk', 'sk', 'EntityType', 'gsi1_pk', 'gsi1_sk', 'TTL']:
                        item.pop(field, None)
                    goals.append(Goal(**item))
            
            return goals, response.get('LastEvaluatedKey')
            
        except Exception as e:
            logger.error(f"Error listing goals for user {user_id}: {str(e)}")
            raise
    
    # Activity operations
    def log_activity(self, activity: GoalActivity) -> GoalActivity:
        """Log a goal activity."""
        try:
            # Convert activity to dict and handle float->Decimal conversion
            activity_data = activity.model_dump(mode='json')
            activity_data = self._convert_floats_to_decimal(activity_data)
            
            item = {
                'pk': self._user_key(activity.user_id),
                'sk': self._activity_key(activity.goal_id, activity.logged_at),
                'EntityType': 'GoalActivity',
                'gsi1_pk': f"GOAL#{activity.goal_id}",
                'gsi1_sk': activity.logged_at.isoformat(),
                **activity_data
            }
            
            # Add TTL for activities (auto-delete after 1 year)
            item['TTL'] = int((datetime.utcnow() + timedelta(days=365)).timestamp())
            
            self.table.put_item(Item=item)
            
            logger.info(f"Logged activity for goal {activity.goal_id}")
            return activity
            
        except Exception as e:
            logger.error(f"Error logging activity: {str(e)}")
            raise
    
    def get_goal_activities(
        self,
        user_id: str,
        goal_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 50
    ) -> List[GoalActivity]:
        """Get activities for a specific goal."""
        try:
            # Build the sort key condition
            sk_condition = Key('sk').begins_with(f"ACTIVITY#{goal_id}#")
            
            if start_date and end_date:
                sk_start = f"ACTIVITY#{goal_id}#{start_date.isoformat()}"
                sk_end = f"ACTIVITY#{goal_id}#{end_date.isoformat()}"
                sk_condition = Key('sk').between(sk_start, sk_end)
            
            response = self.table.query(
                KeyConditionExpression=Key('pk').eq(self._user_key(user_id)) & sk_condition,
                ScanIndexForward=False,  # Most recent first
                Limit=limit
            )
            
            activities = []
            for item in response['Items']:
                # Remove DynamoDB-specific fields
                for field in ['pk', 'sk', 'EntityType', 'gsi1_pk', 'gsi1_sk', 'TTL']:
                    item.pop(field, None)
                activities.append(GoalActivity(**item))
            
            return activities
            
        except Exception as e:
            logger.error(f"Error getting activities for goal {goal_id}: {str(e)}")
            raise
    
    def get_user_activities_by_date(
        self,
        user_id: str,
        date: datetime,
        limit: int = 100
    ) -> List[GoalActivity]:
        """Get all user activities for a specific date."""
        try:
            # Query all user's activities and filter by date
            # In a real implementation, you might want to add a GSI for date-based queries
            date_str = date.strftime('%Y-%m-%d')
            
            response = self.table.query(
                KeyConditionExpression=Key('pk').eq(self._user_key(user_id)) & Key('sk').begins_with('ACTIVITY#'),
                FilterExpression=Attr('activity_date').begins_with(date_str),
                Limit=limit
            )
            
            activities = []
            for item in response['Items']:
                if item.get('EntityType') == 'GoalActivity' or item.get('sk', '').startswith('ACTIVITY#'):
                    # Remove DynamoDB-specific fields
                    for field in ['pk', 'sk', 'EntityType', 'gsi1_pk', 'gsi1_sk', 'TTL']:
                        item.pop(field, None)
                    activities.append(GoalActivity(**item))
            
            return activities
            
        except Exception as e:
            logger.error(f"Error getting activities for date {date}: {str(e)}")
            raise
    
    # Batch operations
    def batch_get_goals(self, user_id: str, goal_ids: List[str]) -> List[Goal]:
        """Get multiple goals in a single request."""
        if not goal_ids:
            return []
        
        try:
            keys = [
                {
                    'pk': self._user_key(user_id),
                    'sk': self._goal_key(goal_id)
                }
                for goal_id in goal_ids
            ]
            
            response = self.dynamodb.batch_get_item(
                RequestItems={
                    self.table_name: {
                        'Keys': keys
                    }
                }
            )
            
            goals = []
            for item in response['Responses'].get(self.table_name, []):
                # Remove DynamoDB-specific fields
                for field in ['pk', 'sk', 'EntityType', 'gsi1_pk', 'gsi1_sk', 'TTL']:
                    item.pop(field, None)
                goals.append(Goal(**item))
            
            return goals
            
        except Exception as e:
            logger.error(f"Error batch getting goals: {str(e)}")
            raise
