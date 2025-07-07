# DynamoDB Single-Table Design Playbook

## 🎯 Purpose
This playbook ensures all features use the SINGLE DynamoDB table following established patterns. **NEVER create separate tables for features.**

## 🏗️ Architecture Overview

### The One Table
```
Table Name: Retrieved from TABLE_NAME environment variable
Partition Key: pk (string)
Sort Key: sk (string)
GSI1: gsi1_pk, gsi1_sk (EmailIndex)
```

### Why Single Table?
1. **Atomic Transactions**: Update multiple entity types in one transaction
2. **Cost Efficiency**: One table with on-demand billing
3. **Query Flexibility**: Rich access patterns with GSIs
4. **Simplified Operations**: One table to monitor, backup, and scale

## 📋 Implementation Checklist

### ✅ When Adding a New Feature
1. **Design Access Patterns First**
   - List all queries your feature needs
   - Map them to PK/SK combinations
   - Determine if existing GSIs suffice

2. **Use Proper Key Design**
   ```python
   # Primary patterns
   PK: USER#<userId>           # User owns the data
   SK: <ENTITY>#<id>           # Entity type and ID
   
   # GSI patterns for queries
   GSI1PK: <ENTITY>#<STATUS>   # Query by status
   GSI1SK: <timestamp>#<id>    # Sort by time
   ```

3. **Add EntityType Field**
   ```python
   {
       'pk': 'USER#123',
       'sk': 'GOAL#456',
       'EntityType': 'Goal',    # Always include this
       'gsi1_pk': 'GOALS#ACTIVE',
       'gsi1_sk': '2024-01-07T10:00:00Z#456',
       # ... other attributes
   }
   ```

## 🔧 Repository Implementation Pattern

### Base Repository Template
```python
import os
import boto3
from typing import Optional, List, Dict, Any
from boto3.dynamodb.conditions import Key, Attr
from aws_lambda_powertools import Logger

logger = Logger()

class SingleTableRepository:
    """Base repository for single-table DynamoDB operations."""
    
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.table_name = os.environ.get('TABLE_NAME') or os.environ.get('MAIN_TABLE_NAME')
        
        if not self.table_name:
            raise ValueError("TABLE_NAME environment variable not set")
            
        self.table = self.dynamodb.Table(self.table_name)
        logger.info(f"Using table: {self.table_name}")
```

### Feature-Specific Repository
```python
from datetime import datetime
from typing import Optional, List
from .base import SingleTableRepository
from ..models import Goal, GoalStatus

class GoalsRepository(SingleTableRepository):
    """Repository for goal operations using single-table design."""
    
    def create_goal(self, user_id: str, goal: Goal) -> Goal:
        """Create a new goal."""
        item = {
            'pk': f'USER#{user_id}',
            'sk': f'GOAL#{goal.goal_id}',
            'EntityType': 'Goal',
            'gsi1_pk': f'GOALS#{goal.status.value}',
            'gsi1_sk': f'{goal.created_at.isoformat()}#{goal.goal_id}',
            **goal.model_dump(mode='json')
        }
        
        self.table.put_item(
            Item=item,
            ConditionExpression='attribute_not_exists(pk) AND attribute_not_exists(sk)'
        )
        return goal
    
    def get_user_goals(self, user_id: str) -> List[Goal]:
        """Get all goals for a user."""
        response = self.table.query(
            KeyConditionExpression=Key('pk').eq(f'USER#{user_id}') & 
                                 Key('sk').begins_with('GOAL#')
        )
        
        goals = []
        for item in response['Items']:
            # Filter by EntityType for safety
            if item.get('EntityType') == 'Goal':
                # Remove DynamoDB metadata
                for field in ['pk', 'sk', 'EntityType', 'gsi1_pk', 'gsi1_sk']:
                    item.pop(field, None)
                goals.append(Goal(**item))
        
        return goals
    
    def query_goals_by_status(self, status: GoalStatus) -> List[Goal]:
        """Query all goals with a specific status."""
        response = self.table.query(
            IndexName='EmailIndex',  # Using existing GSI
            KeyConditionExpression=Key('gsi1_pk').eq(f'GOALS#{status.value}')
        )
        
        goals = []
        for item in response['Items']:
            if item.get('EntityType') == 'Goal':
                # Clean and convert
                for field in ['pk', 'sk', 'EntityType', 'gsi1_pk', 'gsi1_sk']:
                    item.pop(field, None)
                goals.append(Goal(**item))
        
        return goals
```

## 📊 Common Access Patterns

### 1. User-Owned Entities
```python
# Get all items for a user
PK = USER#<userId>
SK = begins_with(<ENTITY>#)

# Examples:
PK = USER#123, SK = begins_with(GOAL#)      # All user's goals
PK = USER#123, SK = begins_with(MEAL#)      # All user's meals
PK = USER#123, SK = begins_with(ACTIVITY#)  # All user's activities
```

### 2. Time-Based Queries
```python
# Activities on a specific date
PK = USER#<userId>
SK = begins_with(ACTIVITY#<goalId>#2024-01-07)

# Meals for a date range
PK = USER#<userId>
SK = between(MEAL#2024-01-01, MEAL#2024-01-31)
```

### 3. Status/Category Queries (Using GSI)
```python
# All active goals across users
GSI1PK = GOALS#ACTIVE

# User's items by category
GSI1PK = USER#<userId>#CATEGORY#<category>
```

### 4. Related Entity Queries
```python
# All activities for a goal (using GSI)
GSI1PK = GOAL#<goalId>
GSI1SK = begins_with(ACTIVITY#)
```

## 🚫 Anti-Patterns to Avoid

### ❌ Creating Separate Tables
```hcl
# WRONG - Never do this!
module "feature_table" {
  source = "../../modules/dynamodb"
  table_name = "${var.app_name}-feature"
  # ...
}
```

### ❌ Feature-Specific Table Names
```python
# WRONG
self.table_name = os.environ['FEATURE_TABLE_NAME']

# CORRECT
self.table_name = os.environ['TABLE_NAME']
```

### ❌ Missing EntityType
```python
# WRONG - No way to distinguish entity types
item = {
    'pk': 'USER#123',
    'sk': 'GOAL#456',
    'title': 'My Goal'
}

# CORRECT - Always include EntityType
item = {
    'pk': 'USER#123',
    'sk': 'GOAL#456',
    'EntityType': 'Goal',
    'title': 'My Goal'
}
```

## 🔍 Debugging Tips

### Check Table Structure
```python
# In repository init, log the table description
table_desc = self.table.describe()
logger.info(f"Table KeySchema: {table_desc['Table']['KeySchema']}")
logger.info(f"Table GSIs: {table_desc['Table'].get('GlobalSecondaryIndexes', [])}")
```

### Query Debugging
```python
# Log the exact query being performed
logger.info(f"Querying with PK={pk}, SK begins_with {sk_prefix}")

# Check returned items before processing
logger.info(f"Query returned {len(response['Items'])} items")
for item in response['Items']:
    logger.debug(f"Item keys: pk={item.get('pk')}, sk={item.get('sk')}, type={item.get('EntityType')}")
```

## 🎯 Migration Checklist

If you accidentally created separate tables:

1. **Stop all writes** to the separate table
2. **Export data** from separate table
3. **Transform keys** to single-table format
4. **Import to main table** with proper keys
5. **Update repository** to use main table
6. **Update infrastructure** to remove separate table
7. **Test thoroughly** before switching traffic

## 📚 Additional Resources

- [Single Table Design Best Practices](https://www.alexdebrie.com/posts/dynamodb-single-table/)
- [DynamoDB Patterns](https://www.dynamodbguide.com/single-table-design)
- AWS re:Invent talks on DynamoDB design

---

**Remember**: Every entity belongs in the ONE table. Design your access patterns first, then implement. When in doubt, check existing patterns in the codebase.
