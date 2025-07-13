# CLAUDE.md - Backend Development Guide

This file provides guidance to Claude Code (claude.ai/code) when working with the backend code in this repository.

## Backend Architecture Overview

### Lambda Function Structure
Each API endpoint is implemented as a separate Lambda function in `backend/src/`:
- Pattern: `{action}_{resource}/handler.py` (e.g., `create_goal`, `list_journal_entries`)
- Each function has its own Dockerfile for containerized deployment
- Common code is shared via `*_common` modules (e.g., `goals_common`, `journal_common`)

### Key Components per Lambda Function
1. **handler.py** - Lambda entry point, handles API Gateway events
2. **service.py** - Business logic layer
3. **repository.py** - Data access layer (DynamoDB operations)
4. **models.py** - Pydantic models for request/response validation
5. **requirements.txt** - Function-specific dependencies
6. **Dockerfile** - Container definition for ECR deployment

## Common Patterns and Best Practices

### Error Handling
```python
from goals_common.errors import (
    ValidationError,
    NotFoundError,
    ConflictError,
    UnauthorizedError
)

# Use specific error types that map to HTTP status codes
raise NotFoundError(f"Goal {goal_id} not found")
```

### DynamoDB Single-Table Design
- Table name: `ai-lifestyle-{environment}`
- Primary Key: `PK` (partition key), `SK` (sort key)
- Key patterns:
  - User: `PK=USER#{user_id}`, `SK=PROFILE`
  - Goal: `PK=USER#{user_id}`, `SK=GOAL#{goal_id}`
  - Journal: `PK=USER#{user_id}`, `SK=JOURNAL#{entry_id}`
  - Activity: `PK=USER#{user_id}#{goal_id}`, `SK=ACTIVITY#{timestamp}`

### Pydantic Models
```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class GoalBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    
    class Config:
        # Enable CamelCase serialization for API responses
        alias_generator = lambda field_name: ''.join(
            word.capitalize() if i else word 
            for i, word in enumerate(field_name.split('_'))
        )
        populate_by_name = True
```

### Repository Pattern
```python
class GoalRepository:
    def __init__(self, table_name: str):
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(table_name)
    
    def create_goal(self, user_id: str, goal: Goal) -> Goal:
        # Implementation with proper error handling
        pass
```

## Testing Patterns

### Unit Tests
- Use pytest with fixtures for DynamoDB mocking
- Mock boto3 clients using `moto` library
- Test files follow pattern: `test_handler.py`, `test_service.py`

### Integration Tests
Located in `tests/integration/`:
- Test complete user journeys
- Use real DynamoDB Local for testing
- Validate API contract compliance

## Deployment Process

### Local Development
```bash
# Install dependencies
pip install -r requirements.txt -r requirements-dev.txt

# Run tests
pytest

# Format code
black . --line-length 100
isort .

# Lint
pylint src/
```

### Docker Build & Deploy
```bash
# Build specific Lambda function
docker build -f src/create_goal/Dockerfile -t create-goal .

# Deploy to ECR and update Lambda
make deploy-lambda FUNCTION=create-goal ENV=dev
```

### Terraform Infrastructure
- Infrastructure defined in `terraform/`
- Modules for each AWS service (Lambda, DynamoDB, Cognito, etc.)
- Service-specific infrastructure in `terraform/services/`

## Common Issues and Solutions

### Lambda Cold Starts
- Keep Lambda packages small
- Use Lambda Layers for shared dependencies
- Consider provisioned concurrency for critical endpoints

### DynamoDB Throttling
- Use on-demand billing mode for unpredictable workloads
- Implement exponential backoff
- Monitor consumed capacity

### API Gateway Integration
- Always return proper status codes
- Include CORS headers in responses
- Log request IDs for debugging

### Memory/Timeout Issues
- Default Lambda memory: 256MB (increase if needed)
- Default timeout: 30 seconds
- Monitor CloudWatch Logs for performance

## Environment Variables
Common environment variables used across Lambda functions:
- `TABLE_NAME` - DynamoDB table name
- `ENVIRONMENT` - dev/staging/prod
- `REGION` - AWS region
- `COGNITO_USER_POOL_ID` - For auth operations
- `LOG_LEVEL` - DEBUG/INFO/WARNING/ERROR

## Security Considerations

### Authentication
- All authenticated endpoints require JWT from Cognito
- Token validation handled by API Gateway
- User ID extracted from token claims

### Data Encryption
- Data encrypted at rest in DynamoDB
- Sensitive data should be encrypted client-side
- Never log sensitive information

### IAM Policies
- Follow principle of least privilege
- Each Lambda has specific IAM role
- No wildcard permissions in production

## Development Workflow Tips

1. **Creating New Endpoints**:
   - Add Lambda function in `src/`
   - Add route in `terraform/main.tf`
   - Update OpenAPI contract in `contract/openapi.yaml`
   - Create tests before implementation

2. **Modifying Existing Endpoints**:
   - Check for breaking changes
   - Update tests first
   - Update API documentation
   - Consider versioning for breaking changes

3. **Performance Optimization**:
   - Use DynamoDB batch operations
   - Implement caching where appropriate
   - Monitor X-Ray traces
   - Optimize Lambda package size

4. **Debugging**:
   - Use CloudWatch Logs Insights
   - Enable X-Ray tracing
   - Add correlation IDs to logs
   - Use structured logging (JSON)