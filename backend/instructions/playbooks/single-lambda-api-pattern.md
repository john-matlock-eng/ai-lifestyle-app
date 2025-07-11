# Playbook: Single Lambda API Pattern

## Overview
This playbook documents the **actual** API implementation pattern used in the AI Lifestyle App. Unlike traditional serverless architectures with one Lambda per endpoint, this application uses a **single Lambda function** with an internal router pattern.

## Architecture Pattern

```
┌─────────────────┐
│   API Gateway   │
│  (All Routes)   │
└────────┬────────┘
         │ ALL requests
         ▼
┌─────────────────┐
│  Single Lambda  │
│  (api-handler)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│     main.py     │────▶│   Handler    │────▶│   Service    │
│    (Router)     │     │   Modules    │     │   Modules    │
└─────────────────┘     └──────────────┘     └──────────────┘
```

## Key Components

### 1. Main Router (`src/main.py`)
The central routing logic that maps API Gateway events to handler functions:

```python
# Route definition pattern
routes = {
    "GET /health": health_check_handler,
    "POST /auth/register": register_user_handler,
    "GET /goals": list_goals_handler,
    "POST /goals": create_goal_handler,
    "GET /goals/{goalId}": get_goal_handler,
    # ... all other routes
}
```

### 2. Module Structure
Each endpoint has its own module in `src/`:

```
src/
├── main.py                    # Central router
├── health.py                  # Simple single-file handlers
├── debug.py
├── goals_common/              # Shared modules
│   ├── __init__.py
│   ├── models.py
│   └── utils.py
├── create_goal/               # Complex handlers as packages
│   ├── __init__.py
│   ├── handler.py
│   ├── models.py
│   ├── service.py
│   └── repository.py
├── list_goals/
│   └── handler.py
└── ... (other endpoints)
```

### 3. Handler Pattern
Each handler follows this structure:

```python
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle specific endpoint logic.
    
    Args:
        event: API Gateway event (already routed by main.py)
        context: Lambda context
        
    Returns:
        API Gateway response format
    """
    try:
        # 1. Extract parameters
        body = json.loads(event.get('body', '{}'))
        path_params = event.get('pathParameters', {})
        query_params = event.get('queryStringParameters', {})
        
        # 2. Get user context (if authenticated)
        user_id = event.get('requestContext', {}).get('authorizer', {}).get('claims', {}).get('sub')
        
        # 3. Validate input
        request = YourRequestModel(**body)
        
        # 4. Execute business logic
        result = service.process_request(request, user_id)
        
        # 5. Return response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': os.environ.get('CORS_ORIGIN', '*')
            },
            'body': json.dumps(result.dict())
        }
        
    except ValidationError as e:
        return error_response(400, "Validation Error", str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return error_response(500, "Internal Server Error", "An error occurred")
```

## Implementation Steps

### Step 1: Add Route to main.py

```python
# In src/main.py, add your route to the routes dictionary:
routes = {
    # ... existing routes ...
    "POST /meals": create_meal_handler,  # Add this line
}

# Import the handler at the top:
from create_meal.handler import lambda_handler as create_meal_handler
```

### Step 2: Create Handler Module

For simple endpoints (single file):
```bash
# Create a single file handler
touch src/get_health_metrics.py
```

For complex endpoints (full module):
```bash
# Create module structure
mkdir -p src/create_meal
touch src/create_meal/__init__.py
touch src/create_meal/handler.py
touch src/create_meal/models.py
touch src/create_meal/service.py
```

### Step 3: Implement Handler

```python
# src/create_meal/handler.py
import json
import os
from typing import Dict, Any
from .models import CreateMealRequest, MealResponse
from .service import MealService

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle POST /meals requests"""
    # Implementation following the pattern above
```

### Step 4: Configure Infrastructure

The Terraform configuration handles all routes through the API Gateway module:

```hcl
# In terraform/main.tf, add route to API Gateway configuration:
module "api_gateway" {
  # ... existing config ...
  
  routes = {
    # ... existing routes ...
    "POST /meals" = {
      authorization_type = "JWT"  # or "NONE" for public endpoints
    }
  }
}
```

### Step 5: Environment Variables

Add any required environment variables to the Lambda configuration:

```hcl
# In terraform/main.tf, update api_lambda environment_variables:
environment_variables = {
  # ... existing variables ...
  MEALS_TABLE_NAME = module.meals_service.meals_table_name
}
```

## Deployment Process

### CI/CD Pipeline (GitHub Actions)

The deployment happens in 3 phases:

1. **Phase 1: Infrastructure** (`deploy_lambda=false`)
   - Creates/updates DynamoDB tables, S3 buckets, etc.
   - Creates ECR repository if needed

2. **Phase 2: Docker Build**
   - Builds single Docker image containing ALL handlers
   - Uses `Dockerfile.api-handler` which includes entire `src/` directory
   - Pushes to ECR

3. **Phase 3: Lambda Deployment** (`deploy_lambda=true`)
   - Deploys the Lambda function with new code
   - All routes become active

### Deployment Triggers

- **Pull Request**: Deploys to `dev` environment
- **Merge to main**: Deploys to `prod` environment

## Common Patterns

### 1. Shared Models
Place shared models in common modules:

```python
# src/goals_common/models.py
class Goal(BaseModel):
    goal_id: str
    title: str
    # ... shared goal model
```

### 2. Path Parameter Handling
main.py extracts path parameters for routes with variables:

```python
# For route: GET /goals/{goalId}
if len(path_parts) >= 3 and path_parts[1] == 'goals':
    goal_id = path_parts[2]
    event['pathParameters'] = {'goalId': goal_id}
```

### 3. Error Response Pattern
Consistent error responses across all handlers:

```python
def error_response(status_code: int, error: str, message: str) -> Dict[str, Any]:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': os.environ.get('CORS_ORIGIN', '*')
        },
        'body': json.dumps({
            'error': error,
            'message': message,
            'timestamp': datetime.utcnow().isoformat()
        })
    }
```

### 4. DynamoDB Single Table Pattern
All tables use composite keys:

```python
# Primary Key patterns:
PK: "USER#<user_id>"
SK: "GOAL#<goal_id>" | "ACTIVITY#<timestamp>" | "PROFILE"

# GSI patterns for queries:
GSI1PK: "STATUS#ACTIVE"
GSI1SK: "USER#<user_id>#<timestamp>"
```

## Best Practices

### DO ✅
- Keep handlers focused - business logic in service layer
- Use Pydantic for ALL input validation
- Return consistent error response format
- Log important operations with context
- Use environment variables for configuration
- Follow existing patterns in the codebase

### DON'T ❌
- Create separate Lambda functions (use the single Lambda pattern)
- Skip input validation
- Return different error formats
- Hardcode values
- Access DynamoDB directly from handlers (use repository pattern)
- Modify main.py routing logic without updating tests

## Testing Strategy

### Local Testing
```bash
# Test individual handler
python -m pytest tests/unit/test_create_meal.py

# Test with main.py routing
python -m pytest tests/integration/test_main_routing.py
```

### Integration Testing
```python
# Test the complete flow through main.py
def test_create_meal_through_router():
    event = {
        "httpMethod": "POST",
        "path": "/meals",
        "body": json.dumps({"name": "Test Meal"}),
        # ... other event properties
    }
    
    response = main.lambda_handler(event, context)
    assert response['statusCode'] == 201
```

## Troubleshooting

### Route Not Found (404)
1. Check route is added to `routes` dict in main.py
2. Verify import statement for handler
3. Check path parameter extraction logic if using variables

### Handler Import Errors
1. Ensure `__init__.py` exists in module directory
2. Check relative imports in handler
3. Verify all dependencies in requirements.txt

### Environment Variable Errors
1. Check variable added to Lambda configuration in Terraform
2. Verify variable name matches exactly
3. Check CloudWatch logs for actual values

## Quick Reference

### Add New Endpoint Checklist
- [ ] Add route to main.py routes dictionary
- [ ] Import handler in main.py
- [ ] Create handler module/file in src/
- [ ] Implement handler following standard pattern
- [ ] Add route to Terraform API Gateway configuration
- [ ] Add any new environment variables to Lambda config
- [ ] Add any new IAM policies for resource access
- [ ] Write unit tests for handler
- [ ] Update integration tests for routing
- [ ] Create PR - CI/CD handles deployment

### File Locations
- Router: `src/main.py`
- Handlers: `src/<endpoint_name>/handler.py`
- Models: `src/<endpoint_name>/models.py`
- Shared: `src/<feature>_common/`
- Tests: `tests/unit/test_<endpoint_name>.py`
- Terraform: `terraform/main.tf`

---

**Remember**: This is a single Lambda architecture. All endpoints are served by one Lambda function with main.py as the router. The CI/CD pipeline handles the complete deployment automatically.
