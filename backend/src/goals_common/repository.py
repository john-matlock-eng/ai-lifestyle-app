"""
Repository base class for Goals DynamoDB operations.

Provides common database access patterns for the Enhanced Goal System.
"""

import os
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
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
        self.table_name = os.environ.get('GOALS_TABLE_NAME')
        self.aggregations_table_name = os.environ.get('GOAL_AGGREGATIONS_TABLE_NAME')
        
        if not self.table_name:
            raise ValueError("GOALS_TABLE_NAME environment variable not set")
            
        self.table = self.dynamodb.Table(self.table_name)
        self.aggregations_table = None
        if self.aggregations_table_name:
            self.aggregations_table = self.dynamodb.Table(self.aggregations_table_name)
    
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
    
    def _user_category_key(self, user_id: str, category: str) -> str:
        """Generate user category GSI1 partition key."""
        return f"USER#{user_id}#CATEGORY#{category}"
    
    def _date_key(self, date: datetime) -> str:
        """Generate date GSI2 partition key."""
        return f"DATE#{date.strftime('%Y-%m-%d')}"
    
    def _user_date_key(self, user_id: str, date: datetime) -> str:
        """Generate user date GSI2 partition key."""
        return f"USER#{user_id}#DATE#{date.strftime('%Y-%m-%d')}"
    
    # Goal CRUD operations
    def create_goal(self, goal: Goal) -> Goal:
        """Create a new goal."""
        try:
            item = {
                'PK': self._user_key(goal.user_id),
                'SK': self._goal_key(goal.goal_id),
                'Type': 'GOAL',
                'GSI1PK': self._status_key(goal.status.value),
                'GSI1SK': goal.created_at.isoformat(),
                'GSI2PK': self._user_category_key(goal.user_id, goal.category),
                'GSI2SK': goal.created_at.isoformat(),
                **goal.model_dump(mode='json')
            }
            
            # Add TTL for draft goals (auto-delete after 30 days)
            if goal.status == GoalStatus.DRAFT:
                item['TTL'] = int((datetime.utcnow() + timedelta(days=30)).timestamp())
            
            self.table.put_item(
                Item=item,
                ConditionExpression='attribute_not_exists(PK) AND attribute_not_exists(SK)'
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
                    'PK': self._user_key(user_id),
                    'SK': self._goal_key(goal_id)
                }
            )
            
            if 'Item' not in response:
                return None
            
            item = response['Item']
            # Remove DynamoDB-specific fields
            for field in ['PK', 'SK', 'Type', 'GSI1PK', 'GSI1SK', 'GSI2PK', 'GSI2SK', 'TTL']:
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
                    expression_values[f":{key}"] = value
                    update_parts.append(f"{safe_key} = :{key}")
            
            # Always update the updated_at timestamp
            expression_values[':updated_at'] = datetime.utcnow().isoformat()
            update_parts.append('updated_at = :updated_at')
            
            # Update GSI keys if status or category changed
            if 'status' in updates:
                expression_values[':gsi1pk'] = self._status_key(updates['status'])
                update_parts.append('GSI1PK = :gsi1pk')
            
            if 'category' in updates:
                expression_values[':gsi2pk'] = self._user_category_key(user_id, updates['category'])
                update_parts.append('GSI2PK = :gsi2pk')
            
            response = self.table.update_item(
                Key={
                    'PK': self._user_key(user_id),
                    'SK': self._goal_key(goal_id)
                },
                UpdateExpression=f"SET {', '.join(update_parts)}",
                ExpressionAttributeValues=expression_values,
                ExpressionAttributeNames=expression_names if expression_names else None,
                ConditionExpression='attribute_exists(PK) AND attribute_exists(SK)',
                ReturnValues='ALL_NEW'
            )
            
            item = response['Attributes']
            # Remove DynamoDB-specific fields
            for field in ['PK', 'SK', 'Type', 'GSI1PK', 'GSI1SK', 'GSI2PK', 'GSI2SK', 'TTL']:
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
                    'IndexName': 'GSI1',
                    'KeyConditionExpression': Key('GSI1PK').eq(self._status_key(status.value)),
                    'FilterExpression': Attr('user_id').eq(user_id),
                    'Limit': limit
                }
            elif category:
                # Query by category using GSI2
                query_params = {
                    'IndexName': 'GSI2',
                    'KeyConditionExpression': Key('GSI2PK').eq(self._user_category_key(user_id, category)),
                    'Limit': limit
                }
            else:
                # Query all user goals
                query_params = {
                    'KeyConditionExpression': Key('PK').eq(self._user_key(user_id)) & Key('SK').begins_with('GOAL#'),
                    'Limit': limit
                }
            
            if last_evaluated_key:
                query_params['ExclusiveStartKey'] = last_evaluated_key
            
            response = self.table.query(**query_params)
            
            goals = []
            for item in response['Items']:
                # Remove DynamoDB-specific fields
                for field in ['PK', 'SK', 'Type', 'GSI1PK', 'GSI1SK', 'GSI2PK', 'GSI2SK', 'TTL']:
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
            item = {
                'PK': self._user_key(activity.user_id),
                'SK': self._activity_key(activity.goal_id, activity.logged_at),
                'Type': 'ACTIVITY',
                'GSI2PK': self._user_date_key(activity.user_id, activity.activity_date),
                'GSI2SK': activity.logged_at.isoformat(),
                **activity.model_dump(mode='json')
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
            sk_condition = Key('SK').begins_with(f"ACTIVITY#{goal_id}#")
            
            if start_date and end_date:
                sk_start = f"ACTIVITY#{goal_id}#{start_date.isoformat()}"
                sk_end = f"ACTIVITY#{goal_id}#{end_date.isoformat()}"
                sk_condition = Key('SK').between(sk_start, sk_end)
            
            response = self.table.query(
                KeyConditionExpression=Key('PK').eq(self._user_key(user_id)) & sk_condition,
                ScanIndexForward=False,  # Most recent first
                Limit=limit
            )
            
            activities = []
            for item in response['Items']:
                # Remove DynamoDB-specific fields
                for field in ['PK', 'SK', 'Type', 'GSI2PK', 'GSI2SK', 'TTL']:
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
            response = self.table.query(
                IndexName='GSI2',
                KeyConditionExpression=Key('GSI2PK').eq(self._user_date_key(user_id, date)),
                Limit=limit
            )
            
            activities = []
            for item in response['Items']:
                if item.get('Type') == 'ACTIVITY':
                    # Remove DynamoDB-specific fields
                    for field in ['PK', 'SK', 'Type', 'GSI2PK', 'GSI2SK', 'TTL']:
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
                    'PK': self._user_key(user_id),
                    'SK': self._goal_key(goal_id)
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
                for field in ['PK', 'SK', 'Type', 'GSI1PK', 'GSI1SK', 'GSI2PK', 'GSI2SK', 'TTL']:
                    item.pop(field, None)
                goals.append(Goal(**item))
            
            return goals
            
        except Exception as e:
            logger.error(f"Error batch getting goals: {str(e)}")
            raise
