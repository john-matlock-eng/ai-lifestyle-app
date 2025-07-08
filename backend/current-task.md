# Backend Current Tasks - 🏗️ ARCHITECTURE: Single Table Design Fix

## 🔄 Completion Report: Contract Compliance Fix for Goals API
**Status**: ✅ Complete - Fixed camelCase/snake_case mismatch
**Date**: 2025-01-08  
**Time Spent**: 1 hour

### Contract Violation Fixed
- **Issue**: Validation error showed field names in snake_case (`goal_pattern`, `target.target_type`) while OpenAPI contract specifies camelCase (`goalPattern`, `targetType`)
- **Root Cause**: Pydantic models were not configured to handle camelCase serialization/deserialization
- **Solution**: Added `ConfigDict` with `alias_generator=to_camel` to all Goal-related models

### What I Fixed
- ✅ Updated all Goal models to use camelCase aliases via Pydantic's `alias_generator`
- ✅ Made `targetType` default to `"exact"` as specified in contract  
- ✅ Made `schedule` optional in `CreateGoalRequest` to match contract
- ✅ Made `status` optional in `CreateGoalRequest` (defaults to ACTIVE in service)
- ✅ Fixed service to not access non-existent fields (`rewards`, `metadata` in request)
- ✅ Ensured proper field name handling throughout the stack

### Contract Compliance
- [✓] Request accepts camelCase fields as specified in OpenAPI
- [✓] Response returns camelCase fields as specified in OpenAPI
- [✓] Internal Python code uses snake_case (Pythonic)
- [✓] `targetType` has default value matching contract
- [✓] All required/optional fields match contract exactly

### Technical Implementation
```python
# Added to all API models:
model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

# This enables:
# - Input: {"goalPattern": "recurring"} -> goal_pattern internally
# - Output: goal_pattern -> {"goalPattern": "recurring"} in response
```

### Files Modified
1. `src/goals_common/models.py`:
   - Added ConfigDict to: GoalTarget, GoalSchedule, GoalContext, GoalProgress
   - Added ConfigDict to: GoalRewards, Goal, CreateGoalRequest, UpdateGoalRequest
   - Made targetType default to EXACT
   - Made schedule optional in Goal model

2. `src/create_goal/service.py`:
   - Fixed Goal construction to use snake_case internally
   - Removed access to non-existent request fields
   - Proper default handling for optional fields

### Next Deployment
This fix will resolve the validation errors. The API will now:
1. Accept requests with camelCase fields (per contract)
2. Validate required fields correctly
3. Apply proper defaults for optional fields
4. Return responses with camelCase fields (per contract)

### Additional Fixes Applied

#### Fix 1: AttributeError with camelCase field names
- **Issue**: AttributeError: 'CreateGoalRequest' object has no attribute 'goalPattern'
- **Root Cause**: When using `alias_generator=to_camel`, Pydantic converts camelCase JSON to snake_case Python attributes
- **Solution**: Updated all Python code to use snake_case attributes
- **Files Fixed**:
  - `src/create_goal/handler.py` - Line 136: Changed `request_data.goalPattern` to `request_data.goal_pattern`
  - `src/create_goal/handler.py` - Line 146: Changed `goal.goalId` to `goal.goal_id`

#### Fix 2: ValidationInfo error in Pydantic v2
- **Issue**: 'pydantic_core._pydantic_core.ValidationInfo' object has no attribute 'get'
- **Root Cause**: Using Pydantic v1 validator syntax in v2
- **Solution**: Updated Goal model to use `@model_validator` for cross-field validation
- **Files Fixed**:
  - `src/goals_common/models.py` - Changed `@field_validator('target')` to `@model_validator(mode='after')`
  - Updated validator to use `self` instead of `values` parameter

#### Fix 3: Service layer field access
- **Issue**: Service using camelCase field names when accessing model attributes
- **Root Cause**: Copy-paste from old code or contract
- **Solution**: Updated all field access to use snake_case
- **Files Fixed**:
  - `src/create_goal/service.py`:
    - Line 83: `goal.goalPattern` → `goal.goal_pattern`
    - Line 162: `goal.target.targetDate` → `goal.target.target_date`
    - Line 167: `goal.goalPattern` → `goal.goal_pattern` with enum comparison
    - Line 180: `goal.userId` → `goal.user_id`
#### Fix 4: Removed Category Validation (Contract Compliance)
- **Issue**: "Invalid category. Must be one of: fitness, nutrition, wellness..."
- **Root Cause**: Backend was enforcing category restrictions not specified in the contract
- **Contract Says**: `category: type: string` - no enum restriction, just examples "fitness, nutrition, wellness, etc."
- **Solution**: Removed hardcoded category validation to comply with contract
- **Files Fixed**:
  - `src/create_goal/service.py` - Removed category validation from `_validate_business_rules`

#### Fix 5: DynamoDB Float to Decimal Conversion
- **Issue**: "Float types are not supported. Use Decimal types instead."
- **Root Cause**: DynamoDB doesn't support Python float types, only Decimal for numeric values
- **Solution**: Added `_convert_floats_to_decimal` helper method in repository
- **Files Fixed**:
  - `src/goals_common/repository.py`:
    - Added `_convert_floats_to_decimal` method to recursively convert floats
    - Updated `create_goal` to convert data before saving
    - Updated `update_goal` to convert update values
    - Updated `log_activity` to convert activity data

**Note**: This is a DynamoDB-specific requirement. The API still accepts and returns float values per the OpenAPI contract - the conversion only happens at the database layer.

---

## 🔄 Previous Report: Single Table Design Fix & JWT Auth
**Status**: ✅ Complete - Ready for Deployment
**Date**: 2025-01-07  
**Time Spent**: 3 hours

### What I Fixed
- ✅ Removed separate DynamoDB tables from goals service module
- ✅ Updated Lambda environment variables to use single TABLE_NAME
- ✅ Updated IAM policies to reference the main table instead of goals tables
- ✅ Updated GoalsRepository to use single-table design patterns
- ✅ Fixed all DynamoDB field names (pk, sk, gsi1_pk, etc.)
- ✅ Removed terraform outputs for non-existent goals tables
- ✅ Enabled JWT authorization for all protected endpoints
- ✅ Fixed UNAUTHORIZED errors on goals endpoints

### Architecture Compliance
- [✓] Single table design implemented correctly
- [✓] Uses existing `users` table for all entities
- [✓] Maintains proper access patterns with USER# and GOAL# prefixes
- [✓] GSI usage aligned with existing table structure

### Technical Changes
1. **Terraform Infrastructure**:
   - Commented out DynamoDB table creation in `services/goals/main.tf`
   - Updated environment variables in `main.tf` to use TABLE_NAME
   - Renamed IAM policy from `goals_dynamodb_access` to `main_table_dynamodb_access`
   - Removed table-specific outputs, added `main_table_name` output

2. **Repository Code**:
   - Updated to use TABLE_NAME environment variable
   - Changed all field names from uppercase (PK, SK) to lowercase (pk, sk)
   - Updated GSI field names to match existing table structure
   - Removed GSI2 usage (not present in current table)
   - Added EntityType field for entity discrimination

### Remaining Infrastructure
- ✅ S3 bucket for goal attachments (kept)
- ✅ EventBridge rules for processing (kept)
- ✅ SNS/SQS for notifications (kept)
- ✅ Monitoring module (kept)

### Implementation Complete ✅

**Step 1 (Completed)**: State Cleanup
- ✅ Commented out all references to goals_service module
- ✅ Deployed successfully to remove tables from state

**Step 2 (Completed)**: Infrastructure Restoration
- ✅ Uncommented goals_service module
- ✅ Uncommented GOAL_ATTACHMENTS_BUCKET env var
- ✅ Uncommented goals_s3_access policy and reference  
- ✅ Uncommented goal_attachments_bucket_name output
- ✅ Fixed outputs.tf in goals service to remove table references
- ✅ Commented out monitoring module (incompatible with single Lambda pattern)

**Step 3 (Just Completed)**: JWT Authorization
- ✅ Enabled JWT authorizer: `enable_jwt_authorizer = true`
- ✅ Updated all goals endpoints to use `authorization_type = "JWT"`
- ✅ Updated user profile endpoints to use JWT
- ✅ Updated MFA endpoints (except verify) to use JWT

**Result**: 
- ✅ Goals use single-table DynamoDB design
- ✅ JWT authentication properly configured
- ✅ S3 bucket for attachments
- ✅ EventBridge rules for processing
- ✅ SNS/SQS for notifications
- ⚠️ NO monitoring (needs redesign)

### Next Steps

**Deploy and Test**:
1. **Create PR** with:
   - Restored goals_service module
   - JWT authorization enabled for protected endpoints
2. **CI/CD will deploy** the updated configuration
3. **Test goals endpoints**:
   - Login first to get JWT token
   - Use token in Authorization header: `Bearer <token>`
4. **Verify** single table design is working
5. **Confirm** S3 bucket and EventBridge rules exist

### Future Improvements
- **Update Monitoring**: Create a monitoring solution that works with the single Lambda pattern
  - Monitor the api-handler function with path-based metrics
  - Track goals operations via CloudWatch Logs Insights
  - Use custom metrics for business KPIs

### Summary

The implementation is now complete:
- ✅ Single-table DynamoDB design properly implemented
- ✅ JWT authentication enabled for all protected endpoints
- ✅ Goals use the main `users` table with proper key design
- ✅ S3 bucket available for goal attachments
- ✅ Event processing infrastructure in place
- ✅ All repository code updated to use TABLE_NAME
- ✅ LLM instructions updated to prevent future violations

**Ready for deployment and testing with JWT authentication!**

### LLM Instructions Updated
To prevent future violations, I've updated the backend instructions:

1. **Added Critical Section** in `instructions.md`:
   - Clear single-table design rules
   - Access pattern examples
   - Repository implementation guidelines
   - Infrastructure dos and don'ts

2. **Created New Playbook** `playbooks/dynamodb-single-table-patterns.md`:
   - Complete guide for single-table design
   - Common access patterns
   - Anti-patterns to avoid
   - Migration checklist

3. **Updated Common Mistakes** `playbooks/common-mistakes-llm-guide.md`:
   - Added sections on table creation mistakes
   - Feature-specific environment variable mistakes

4. **Created Pattern Template** `patterns/single-table-repository.md`:
   - Base repository class for inheritance
   - Feature repository example
   - Proper key design patterns

These updates ensure all future LLM agents will follow the single-table design pattern correctly.

## 🚨 CRITICAL: Fix Single Table Design Violation

### Architecture Decision: Use the EXISTING `users` table for ALL entities ✅

Good news! The `users` table already exists with the correct structure for single-table design:
- Primary Key: `pk` (partition key) and `sk` (sort key)
- GSI1: `gsi1_pk` and `gsi1_sk` 
- This is your MAIN table for everything!

### Required Changes - Step by Step

#### 1. Remove Goals Service Tables ❌
The `goals_service` module creates separate tables. We need to remove these.

**Option A - Quick Fix**: Comment out the goals_service module in `terraform/main.tf`:
```hcl
# COMMENT OUT THIS ENTIRE BLOCK:
# module "goals_service" {
#   source = "./services/goals"
#   ...
# }
```

**Option B - Proper Fix**: Update the goals service to not create tables:
- Edit `terraform/services/goals/main.tf`
- Remove the DynamoDB table resources
- Keep only the S3 bucket for attachments

#### 2. Update Lambda Environment Variables 🔧
In `terraform/main.tf`, update the api_lambda environment variables:
```hcl
environment_variables = {
  ENVIRONMENT          = var.environment
  LOG_LEVEL            = var.environment == "prod" ? "INFO" : "DEBUG"
  COGNITO_USER_POOL_ID = module.cognito.user_pool_id
  COGNITO_CLIENT_ID    = module.cognito.user_pool_client_id
  USERS_TABLE_NAME     = module.users_table.table_name
  
  # CHANGE THESE:
  TABLE_NAME           = module.users_table.table_name  # Main table for everything!
  MAIN_TABLE_NAME      = module.users_table.table_name  # Same table
  
  # KEEP THIS for S3:
  GOAL_ATTACHMENTS_BUCKET = module.goals_service.goal_attachments_bucket_name
  
  CORS_ORIGIN          = var.environment == "prod" ? "https://ailifestyle.app" : "https://d3qx4wyq22oaly.cloudfront.net"
}
```

#### 3. Update Goals Repository Code 📝
Update `src/goals/repository/goals_repository.py`:

```python
import os
from datetime import datetime
from typing import List, Optional
import boto3
from boto3.dynamodb.conditions import Key, Attr

class GoalsRepository:
    def __init__(self):
        # Use the MAIN table, not a separate goals table
        self.table_name = os.environ['TABLE_NAME']  # This is the users table!
        dynamodb = boto3.resource('dynamodb')
        self.table = dynamodb.Table(self.table_name)
    
    def create_goal(self, user_id: str, goal: Goal) -> Goal:
        """Create a goal using single-table design patterns"""
        
        # Single table pattern: USER#id as PK, GOAL#id as SK
        item = {
            'pk': f'USER#{user_id}',
            'sk': f'GOAL#{goal.goal_id}',
            
            # GSI1 for querying by status
            'gsi1_pk': f'GOALS#{goal.status.upper()}',
            'gsi1_sk': f'{goal.created_at}#{goal.goal_id}',
            
            # Entity type for filtering
            'EntityType': 'Goal',
            
            # Goal attributes
            'GoalId': goal.goal_id,
            'UserId': user_id,
            'Title': goal.title,
            'Description': goal.description,
            'Category': goal.category,
            'GoalPattern': goal.goal_pattern,
            'Status': goal.status,
            'Target': goal.target.dict(),
            'CreatedAt': goal.created_at,
            'UpdatedAt': goal.updated_at,
            
            # Optional fields
            'Schedule': goal.schedule.dict() if goal.schedule else None,
            'Context': goal.context.dict() if goal.context else None,
            'Rewards': goal.rewards.dict() if goal.rewards else None,
        }
        
        self.table.put_item(Item=item)
        return goal
    
    def get_user_goals(self, user_id: str, status: Optional[str] = None) -> List[Goal]:
        """Get all goals for a user"""
        
        # Query using the primary key
        response = self.table.query(
            KeyConditionExpression=Key('pk').eq(f'USER#{user_id}') & 
                                 Key('sk').begins_with('GOAL#')
        )
        
        goals = []
        for item in response['Items']:
            # Convert DynamoDB item back to Goal object
            if status and item.get('Status') != status:
                continue
            goals.append(self._item_to_goal(item))
        
        return goals
    
    def log_activity(self, user_id: str, goal_id: str, activity: Activity) -> Activity:
        """Log an activity for a goal"""
        
        # Activities use a time-based sort key
        timestamp = activity.logged_at.isoformat()
        
        item = {
            'pk': f'USER#{user_id}',
            'sk': f'ACTIVITY#{goal_id}#{timestamp}',
            
            # GSI1 for querying by goal
            'gsi1_pk': f'GOAL#{goal_id}',
            'gsi1_sk': f'ACTIVITY#{timestamp}',
            
            'EntityType': 'Activity',
            'ActivityId': activity.activity_id,
            'GoalId': goal_id,
            'UserId': user_id,
            'Value': activity.value,
            'Unit': activity.unit,
            'ActivityType': activity.activity_type,
            'ActivityDate': activity.activity_date,
            'LoggedAt': timestamp,
            
            # Optional fields
            'Note': activity.note,
            'Context': activity.context.dict() if activity.context else None,
        }
        
        self.table.put_item(Item=item)
        return activity
```

#### 4. Update the Users Table GSIs 🔍
The users table needs additional GSIs for goal queries. Add to `terraform/main.tf`:

```hcl
module "users_table" {
  source = "./modules/dynamodb"

  table_name  = "ai-lifestyle-main"  # Better name than just "users"
  environment = var.environment

  hash_key = {
    name = "pk"
    type = "S"
  }

  range_key = {
    name = "sk"
    type = "S"
  }

  global_secondary_indexes = [
    {
      name            = "GSI1"
      hash_key        = "gsi1_pk"
      range_key       = "gsi1_sk"
      projection_type = "ALL"
    },
    {
      name            = "GSI2"  # Add for date queries
      hash_key        = "gsi2_pk"
      range_key       = "gsi2_sk"
      projection_type = "ALL"
    },
    {
      name            = "GSI3"  # Add for status queries
      hash_key        = "gsi3_pk"
      range_key       = "gsi3_sk"
      projection_type = "INCLUDE"
      projection_attributes = ["Status", "Title", "UpdatedAt"]
    }
  ]

  additional_attributes = [
    { name = "gsi1_pk", type = "S" },
    { name = "gsi1_sk", type = "S" },
    { name = "gsi2_pk", type = "S" },
    { name = "gsi2_sk", type = "S" },
    { name = "gsi3_pk", type = "S" },
    { name = "gsi3_sk", type = "S" }
  ]
}
```

#### 5. Update IAM Policies 🔐
Update the goals DynamoDB policy to reference the main table:

```hcl
resource "aws_iam_policy" "goals_dynamodb_access" {
  name        = "ai-lifestyle-main-table-${var.environment}"
  description = "Policy for Lambda to access main DynamoDB table"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          module.users_table.table_arn,
          "${module.users_table.table_arn}/*"
        ]
      }
    ]
  })
}
```

### Access Patterns Reference 📊

```python
# Users
PK: USER#123                SK: PROFILE
PK: USER#123                SK: SETTINGS

# Goals  
PK: USER#123                SK: GOAL#456
GSI1PK: GOALS#ACTIVE        GSI1SK: 2024-01-07#456

# Activities
PK: USER#123                SK: ACTIVITY#456#2024-01-07T10:00:00Z
GSI1PK: GOAL#456           GSI1SK: ACTIVITY#2024-01-07T10:00:00Z

# Future: Journal Entries
PK: USER#123                SK: JOURNAL#2024-01-07#789
GSI1PK: JOURNALS#2024-01    GSI1SK: 2024-01-07#789

# Future: Meals
PK: USER#123                SK: MEAL#2024-01-07#breakfast
GSI2PK: USER#123#MEALS      GSI2SK: 2024-01-07T08:00:00Z
```

### Deployment Steps 🚀

1. **Update Terraform configuration** (remove goals tables, update variables)
2. **Run `terraform plan`** to see changes
3. **Run `terraform apply`** to update infrastructure
4. **Update repository code** to use single-table patterns
5. **Deploy new Lambda code**
6. **Test all endpoints**

### Benefits We're Preserving ✨
- **Atomic operations**: Update user stats and goals in one transaction
- **Cost efficiency**: One table with on-demand billing
- **Query flexibility**: Rich access patterns with GSIs
- **Future proof**: All features use the same table

---

**Decision**: Single table design is mandatory ✅
**Table to use**: The existing `users` table (rename to `ai-lifestyle-main`)
**Next steps**: Update Terraform, then code

**Updated**: 2025-01-07 by PM Agent