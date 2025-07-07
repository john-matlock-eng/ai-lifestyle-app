# API Pattern Quick Reference for LLMs

## Architecture Overview
This application uses a **Single Lambda Pattern** where one Lambda function handles all API routes through a central router.

**Visual Diagram**: See `backend/instructions/architecture-diagram.md` for detailed architecture visualization.

## Key Files and Their Purposes

### 1. `src/main.py` - The Router
- Maps all API Gateway requests to handler functions
- Extracts path parameters for dynamic routes
- Returns 404 for unmatched routes

### 2. Handler Structure
```
src/
├── simple_endpoint.py         # Single-file handlers
└── complex_endpoint/          # Multi-file handlers
    ├── handler.py            # Lambda entry point
    ├── models.py             # Pydantic validation
    ├── service.py            # Business logic
    └── repository.py         # Database access
```

## Adding a New API Endpoint

### Step 1: Update Router
```python
# In src/main.py
from new_endpoint.handler import lambda_handler as new_endpoint_handler

routes = {
    # ... existing routes ...
    "POST /new-endpoint": new_endpoint_handler,
}
```

### Step 2: Create Handler
```python
# src/new_endpoint/handler.py
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    # 1. Parse input
    # 2. Validate with Pydantic
    # 3. Call service layer
    # 4. Return API Gateway response format
```

### Step 3: Update Infrastructure
```hcl
# In terraform/main.tf, add to api_gateway routes:
"POST /new-endpoint" = {
  authorization_type = "NONE"  # or "JWT"
}

# Add to api_lambda environment_variables if needed:
NEW_TABLE_NAME = module.new_service.table_name
```

## Standard Response Format
```python
# Success
{
    'statusCode': 200,
    'headers': {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': os.environ.get('CORS_ORIGIN', '*')
    },
    'body': json.dumps(response_data)
}

# Error
{
    'statusCode': 400,  # or 404, 500, etc.
    'headers': {...},
    'body': json.dumps({
        'error': 'ErrorType',
        'message': 'Human readable message',
        'timestamp': 'ISO timestamp'
    })
}
```

## Environment Variables
All configuration through environment variables:
- `ENVIRONMENT`: dev/prod
- `LOG_LEVEL`: DEBUG/INFO
- `*_TABLE_NAME`: DynamoDB table names
- `*_BUCKET`: S3 bucket names
- `CORS_ORIGIN`: Allowed CORS origin

## DynamoDB Patterns
Single table design with composite keys:
- PK: `USER#<user_id>` or `TYPE#<type>`
- SK: `RESOURCE#<resource_id>` or `METADATA`
- GSI for queries: `GSI1PK`, `GSI1SK`

## CI/CD Deployment
Automatic deployment via GitHub Actions:
- PR → Deploy to dev
- Merge to main → Deploy to prod
- No manual deployment needed

## Important Notes
1. **One Lambda Only**: Don't create separate Lambdas
2. **Router Required**: All routes must be in main.py
3. **Pydantic Models**: Match OpenAPI contract exactly
4. **Path Parameters**: Router extracts them automatically
5. **Error Handling**: Use consistent error response format
6. **Testing**: Test both handler and routing through main.py

## File Reference Paths
- Detailed implementation guide: `backend/instructions/playbooks/api-implementation.md`
- Single Lambda pattern details: `backend/instructions/playbooks/single-lambda-api-pattern.md`
- Example implementations: `backend/src/*/handler.py`
- Router logic: `backend/src/main.py`
- Infrastructure: `backend/terraform/main.tf`
