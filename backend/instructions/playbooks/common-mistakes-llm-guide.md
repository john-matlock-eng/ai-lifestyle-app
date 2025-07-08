# Common Mistakes to Avoid - LLM Guide

## ❌ Critical Mistakes

### 1. Creating Separate Lambda Functions
**WRONG**:
```hcl
module "goals_lambda" {
  source = "./modules/lambda-ecr"
  function_name = "goals-handler"
  # ...
}
```

**RIGHT**: Use the existing `api_lambda` - it handles ALL routes via main.py

### 2. Creating Separate API Gateway Integrations
**WRONG**:
```hcl
resource "aws_apigatewayv2_integration" "goals" {
  # Separate integration for goals
}
```

**RIGHT**: All routes use the same Lambda integration already configured

### 3. Missing Router Updates
**WRONG**: Creating handler without updating main.py

**RIGHT**: Always add route to main.py:
```python
routes = {
    "GET /new-endpoint": new_handler,
}
```

### 4. Wrong Import Pattern
**WRONG**:
```python
# In main.py
from src.create_goal.handler import lambda_handler  # Wrong path
```

**RIGHT**:
```python
from create_goal.handler import lambda_handler as create_goal_handler
```

### 5. Creating terraform.tfvars
**WRONG**: Creating terraform.tfvars for CI/CD

**RIGHT**: GitHub Actions handles all variables automatically. Only create terraform.tfvars.example

### 6. Manual Deployment Commands
**WRONG**: Telling users to run `terraform apply`

**RIGHT**: Create PR - GitHub Actions handles everything

### 7. 🔴 Creating Separate DynamoDB Tables
**WRONG**:
```hcl
module "feature_table" {
  source = "../../modules/dynamodb"
  table_name  = "${var.app_name}-feature"
  # Creating a new table for each feature
}
```

**RIGHT**: Use the SINGLE main table with proper key design:
```python
# In repository
self.table_name = os.environ['TABLE_NAME']  # The ONE table

# Use prefixes in keys
item = {
    'pk': f'USER#{user_id}',
    'sk': f'FEATURE#{item_id}',
    'EntityType': 'Feature'
}
```

### 8. Feature-Specific Table Environment Variables
**WRONG**:
```python
self.table_name = os.environ['GOALS_TABLE_NAME']
self.table_name = os.environ['MEALS_TABLE_NAME']
```

**RIGHT**:
```python
self.table_name = os.environ['TABLE_NAME']  # Always the same table
```

### 9. 🔴 Accessing CamelCase Fields in Pydantic Models
**WRONG**: When using `alias_generator=to_camel`, trying to access camelCase field names:
```python
# models.py
class CreateGoalRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)
    goal_pattern: str  # Python field name

# handler.py
pattern = request_data.goalPattern  # ❌ AttributeError!
```

**RIGHT**: Always use snake_case in Python code:
```python
pattern = request_data.goal_pattern  # ✅ Correct
# The model handles camelCase ↔ snake_case conversion automatically
```

**Remember**: 
- JSON input/output: camelCase (`goalPattern`)
- Python attributes: snake_case (`goal_pattern`)
- Use `model_dump_json(by_alias=True)` for camelCase output

### 10. 🔴 Adding Validations Not in Contract
**WRONG**: Backend adds restrictions beyond what the contract specifies:
```python
# Contract says: category: type: string (no enum)
valid_categories = ['fitness', 'nutrition', 'wellness']
if category not in valid_categories:
    raise ValidationError("Invalid category")  # ❌ Contract doesn't restrict!
```

**RIGHT**: Follow the contract exactly:
```python
# Contract says: category: type: string
# So accept ANY string
category = request.category  # ✅ Any string is valid per contract
```

**Remember**: 
- Contract descriptions like "(fitness, nutrition, wellness, etc.)" are EXAMPLES, not restrictions
- Only enforce validations explicitly specified in contract (enums, patterns, min/max)
- When contract says `type: string` with no enum, accept ANY string
- Contract is LAW - don't add "reasonable" restrictions not specified

### 11. 🔴 Not Converting Floats for DynamoDB
**WRONG**: Trying to save float values directly to DynamoDB:
```python
def create_goal(self, goal: Goal):
    item = {
        'pk': f'USER#{user_id}',
        **goal.model_dump()  # ❌ Contains float values!
    }
    self.table.put_item(Item=item)  # Error: Float types are not supported
```

**RIGHT**: Convert floats to Decimal before saving:
```python
from decimal import Decimal

def _convert_floats_to_decimal(self, data):
    if isinstance(data, float):
        return Decimal(str(data))
    elif isinstance(data, dict):
        return {k: self._convert_floats_to_decimal(v) for k, v in data.items()}
    # ... handle lists, etc.

def create_goal(self, goal: Goal):
    goal_data = goal.model_dump(mode='json')
    goal_data = self._convert_floats_to_decimal(goal_data)  # ✅ Convert!
    # Now safe to save to DynamoDB
```

**Remember**: 
- DynamoDB requires Decimal, not float
- API contract still uses float - conversion is only at DB layer
- Pydantic handles Decimal→float on read automatically

## ✅ Correct Patterns

### Adding New Endpoint
1. Update `src/main.py` routes dictionary
2. Create handler in `src/endpoint_name/`
3. Add route to terraform `api_gateway` module routes
4. Add environment variables to `api_lambda` if needed
5. Add IAM policies to `api_lambda` if needed
6. Create PR - let CI/CD deploy

### Path Parameters
The router handles extraction:
```python
# Route: GET /goals/{goalId}
# Router extracts goalId and adds to event['pathParameters']
```

### Environment Variables
Always add to the EXISTING api_lambda:
```hcl
module "api_lambda" {
  environment_variables = {
    # ... existing vars ...
    NEW_VAR = "value"  # Add here
  }
}
```

### IAM Policies
Add to the EXISTING api_lambda policies:
```hcl
module "api_lambda" {
  additional_policies = [
    # ... existing policies ...
    aws_iam_policy.new_policy.arn  # Add here
  ]
}
```

## Architecture Summary

```
API Gateway → Single Lambda (api-handler) → main.py router → Individual handlers
```

**NOT**:
```
API Gateway → Multiple Lambdas (one per endpoint)
```

## Quick Checklist
- [ ] Is there only ONE Lambda function (api_lambda)?
- [ ] Are ALL routes in the api_gateway routes configuration?
- [ ] Is main.py updated with the new route?
- [ ] Are all handlers imported in main.py?
- [ ] No manual terraform commands mentioned?
- [ ] No terraform.tfvars created (only .example)?
- [ ] PR-based deployment explained?

## Remember
- **One Lambda to rule them all** 🧙‍♂️
- **main.py is the router** 🔀
- **GitHub Actions deploys everything** 🚀
- **No manual terraform needed** 🚫
