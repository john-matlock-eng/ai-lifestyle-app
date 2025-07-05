# Playbook: API Implementation

## Purpose
Transform an OpenAPI contract operation into a production-ready Lambda function. This is your most frequent task - implementing endpoints exactly as specified.

## When to Use This Playbook
- Implementing any new API endpoint from `current-task.md`
- Refactoring existing endpoints to match contract changes
- Adding new operations to existing resources

## Prerequisites
- [ ] Contract operation exists in `contract/openapi.yaml`
- [ ] Task clearly references the operationId
- [ ] DynamoDB table or external dependencies are documented

## The Implementation Workflow

### Phase 1: Contract Analysis (15 min)

#### 1. Locate Your Operation
```bash
# Find your operationId in the contract
grep -n "operationId: getMealById" contract/openapi.yaml
```

#### 2. Extract Requirements
Document these elements from the contract:
```yaml
# Path parameters
/meals/{mealId}  # -> mealId: string (required)

# Query parameters
?include_nutrition=true  # -> include_nutrition: boolean (optional)

# Request body schema
$ref: '#/components/schemas/MealCreateRequest'

# Response schemas
200: $ref: '#/components/schemas/MealResponse'
404: $ref: '#/components/schemas/ErrorResponse'

# Security
security:
  - BearerAuth: []  # -> Requires authentication
```

### Phase 2: Project Structure (20 min)

#### Create Function Directory
```bash
# Function name = operationId in snake_case
mkdir -p backend/src/get_meal_by_id
cd backend/src/get_meal_by_id
```

#### Standard File Structure
Every Lambda function MUST have:
```
get_meal_by_id/
├── handler.py          # Lambda entry point
├── models.py           # Pydantic models (contract types)
├── service.py          # Business logic
├── repository.py       # Database operations
├── errors.py           # Custom exceptions
└── __init__.py         # Module initialization
```

### Phase 3: Model Definition (30 min)

#### models.py Template
```python
"""
Pydantic models for getMealById operation.
Auto-generated from contract/openapi.yaml
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, validator

# Request Models (if applicable)
class MealQueryParams(BaseModel):
    """Query parameters for meal retrieval"""
    include_nutrition: Optional[bool] = Field(False, description="Include nutrition data")
    
class MealPathParams(BaseModel):
    """Path parameters for meal retrieval"""
    meal_id: str = Field(..., min_length=1, max_length=128)
    
    @validator('meal_id')
    def validate_meal_id(cls, v):
        # Add any custom validation
        return v

# Response Models (match contract exactly)
class NutritionInfo(BaseModel):
    """Nutritional information for a meal"""
    calories: Decimal = Field(..., ge=0, le=10000)
    protein_g: Decimal = Field(..., ge=0)
    carbs_g: Decimal = Field(..., ge=0)
    fat_g: Decimal = Field(..., ge=0)
    
class MealResponse(BaseModel):
    """Complete meal information"""
    meal_id: str
    user_id: str
    name: str
    description: Optional[str] = None
    meal_type: str = Field(..., pattern="^(breakfast|lunch|dinner|snack)$")
    date: datetime
    nutrition: Optional[NutritionInfo] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }

# Error Models
class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    message: str
    request_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
```

### Phase 4: Repository Layer (30 min)

#### repository.py Template
```python
"""
Repository layer for meal data access.
Implements single-table DynamoDB patterns.
"""
import boto3
from boto3.dynamodb.conditions import Key
from typing import Optional, Dict, Any
import logging
from datetime import datetime

from .models import MealResponse
from .errors import MealNotFoundError, DatabaseError

logger = logging.getLogger(__name__)

class MealRepository:
    """Handles all meal-related database operations"""
    
    def __init__(self, table_name: str = None):
        self.dynamodb = boto3.resource('dynamodb')
        self.table_name = table_name or os.environ['MEALS_TABLE_NAME']
        self.table = self.dynamodb.Table(self.table_name)
    
    def get_meal_by_id(self, user_id: str, meal_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a meal by its ID.
        
        Args:
            user_id: The user who owns the meal
            meal_id: Unique meal identifier
            
        Returns:
            Meal data as dict or None if not found
            
        Raises:
            DatabaseError: On DynamoDB errors
        """
        try:
            response = self.table.get_item(
                Key={
                    'pk': f'USER#{user_id}',
                    'sk': f'MEAL#{meal_id}'
                }
            )
            
            item = response.get('Item')
            if not item:
                logger.info(f"Meal not found: {meal_id} for user: {user_id}")
                return None
                
            # Transform DynamoDB item to domain model
            return self._transform_meal_item(item)
            
        except ClientError as e:
            logger.error(f"DynamoDB error: {e.response['Error']['Message']}")
            raise DatabaseError(f"Failed to retrieve meal: {str(e)}")
    
    def _transform_meal_item(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Transform DynamoDB item to API model format"""
        return {
            'meal_id': item['sk'].split('#')[1],
            'user_id': item['pk'].split('#')[1],
            'name': item['name'],
            'description': item.get('description'),
            'meal_type': item['meal_type'],
            'date': item['date'],
            'nutrition': item.get('nutrition'),
            'created_at': item['created_at'],
            'updated_at': item['updated_at']
        }
```

### Phase 5: Service Layer (30 min)

#### service.py Template
```python
"""
Business logic for meal operations.
Orchestrates between repository and API.
"""
import logging
from typing import Optional

from .models import MealResponse, MealQueryParams
from .repository import MealRepository
from .errors import MealNotFoundError

logger = logging.getLogger(__name__)

class MealService:
    """Handles meal-related business logic"""
    
    def __init__(self, repository: MealRepository = None):
        self.repository = repository or MealRepository()
    
    def get_meal_by_id(
        self, 
        user_id: str, 
        meal_id: str, 
        query_params: MealQueryParams
    ) -> MealResponse:
        """
        Retrieve a meal with optional nutrition information.
        
        Args:
            user_id: Authenticated user ID
            meal_id: Meal identifier
            query_params: Query parameters including include_nutrition
            
        Returns:
            MealResponse with requested data
            
        Raises:
            MealNotFoundError: When meal doesn't exist
        """
        # Fetch meal from repository
        meal_data = self.repository.get_meal_by_id(user_id, meal_id)
        
        if not meal_data:
            raise MealNotFoundError(f"Meal {meal_id} not found")
        
        # Apply business logic based on query params
        if not query_params.include_nutrition:
            meal_data.pop('nutrition', None)
        
        # Validate and return
        return MealResponse(**meal_data)
```

### Phase 6: Lambda Handler (45 min)

#### handler.py Template
```python
"""
Lambda handler for getMealById operation.
Entry point for API Gateway integration.
"""
import json
import logging
import os
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths

from .models import MealPathParams, MealQueryParams, MealResponse, ErrorResponse
from .service import MealService
from .errors import MealNotFoundError, ValidationError, DatabaseError

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics()

# Initialize service
service = MealService()

@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle GET /meals/{mealId} requests.
    
    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context object
        
    Returns:
        API Gateway Lambda proxy response
    """
    try:
        # Extract and validate path parameters
        path_params = MealPathParams(
            meal_id=event['pathParameters']['mealId']
        )
        
        # Extract and validate query parameters
        query_params = MealQueryParams(
            include_nutrition=event.get('queryStringParameters', {}).get('include_nutrition', 'false').lower() == 'true'
        )
        
        # Extract user ID from authorizer context
        user_id = event['requestContext']['authorizer']['claims']['sub']
        
        # Log the request
        logger.info(
            "Getting meal",
            extra={
                "meal_id": path_params.meal_id,
                "user_id": user_id,
                "include_nutrition": query_params.include_nutrition
            }
        )
        
        # Call service layer
        meal = service.get_meal_by_id(
            user_id=user_id,
            meal_id=path_params.meal_id,
            query_params=query_params
        )
        
        # Record success metric
        metrics.add_metric(name="GetMealSuccess", unit=MetricUnit.Count, value=1)
        
        # Return successful response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-ID': context.request_id
            },
            'body': meal.json()
        }
        
    except ValidationError as e:
        logger.warning(f"Validation error: {str(e)}")
        error = ErrorResponse(
            error="ValidationError",
            message=str(e),
            request_id=context.request_id
        )
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': error.json()
        }
        
    except MealNotFoundError as e:
        logger.info(f"Meal not found: {str(e)}")
        error = ErrorResponse(
            error="NotFound",
            message=str(e),
            request_id=context.request_id
        )
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json'},
            'body': error.json()
        }
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        metrics.add_metric(name="GetMealError", unit=MetricUnit.Count, value=1)
        error = ErrorResponse(
            error="InternalServerError",
            message="An unexpected error occurred",
            request_id=context.request_id
        )
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': error.json()
        }
```

### Phase 7: Error Handling (15 min)

#### errors.py Template
```python
"""
Custom exceptions for meal operations.
"""

class MealError(Exception):
    """Base exception for meal operations"""
    pass

class ValidationError(MealError):
    """Raised when input validation fails"""
    pass

class MealNotFoundError(MealError):
    """Raised when a meal cannot be found"""
    pass

class DatabaseError(MealError):
    """Raised when database operations fail"""
    pass

class AuthorizationError(MealError):
    """Raised when user lacks permission"""
    pass
```

### Phase 8: Infrastructure (30 min)

#### Terraform Module Structure
Create `backend/terraform/services/meals/get_meal_by_id.tf`:

```hcl
# Lambda function for getMealById
module "get_meal_by_id" {
  source = "../../modules/lambda"
  
  function_name = "${var.environment}-get-meal-by-id"
  description   = "Retrieve a single meal by ID"
  
  # Runtime configuration
  runtime       = "python3.11"
  architecture  = "arm64"
  memory_size   = 256
  timeout       = 10
  
  # Code location
  source_path   = "../../../src/get_meal_by_id"
  
  # Environment variables
  environment_variables = {
    MEALS_TABLE_NAME = aws_dynamodb_table.meals.name
    LOG_LEVEL        = var.log_level
    ENVIRONMENT      = var.environment
  }
  
  # IAM permissions
  attach_policies = [
    aws_iam_policy.dynamodb_read_policy.arn
  ]
  
  # Tracing
  tracing_config = "Active"
  
  # Tags
  tags = local.common_tags
}

# API Gateway integration
resource "aws_apigatewayv2_integration" "get_meal_by_id" {
  api_id           = var.api_gateway_id
  integration_type = "AWS_PROXY"
  integration_uri  = module.get_meal_by_id.function_arn
  
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_meal_by_id" {
  api_id    = var.api_gateway_id
  route_key = "GET /meals/{mealId}"
  
  target = "integrations/${aws_apigatewayv2_integration.get_meal_by_id.id}"
  
  authorization_type = "JWT"
  authorizer_id      = var.authorizer_id
}

# CloudWatch Logs
resource "aws_cloudwatch_log_group" "get_meal_by_id" {
  name              = "/aws/lambda/${module.get_meal_by_id.function_name}"
  retention_in_days = var.log_retention_days
  
  tags = local.common_tags
}
```

### Phase 9: Testing Strategy (45 min)

Create comprehensive tests in `backend/tests/unit/test_get_meal_by_id.py`:

```python
"""
Unit tests for getMealById Lambda function.
"""
import pytest
import json
from datetime import datetime
from decimal import Decimal
from unittest.mock import Mock, patch

from src.get_meal_by_id.handler import lambda_handler
from src.get_meal_by_id.models import MealResponse, NutritionInfo
from src.get_meal_by_id.errors import MealNotFoundError

class TestGetMealById:
    """Test suite for meal retrieval"""
    
    @pytest.fixture
    def api_gateway_event(self):
        """Standard API Gateway event"""
        return {
            'pathParameters': {
                'mealId': 'meal-123'
            },
            'queryStringParameters': {
                'include_nutrition': 'true'
            },
            'requestContext': {
                'authorizer': {
                    'claims': {
                        'sub': 'user-456'
                    }
                }
            }
        }
    
    @pytest.fixture
    def lambda_context(self):
        """Mock Lambda context"""
        context = Mock()
        context.request_id = 'test-request-123'
        return context
    
    @pytest.fixture
    def sample_meal(self):
        """Sample meal data"""
        return {
            'meal_id': 'meal-123',
            'user_id': 'user-456',
            'name': 'Grilled Chicken Salad',
            'description': 'Healthy lunch option',
            'meal_type': 'lunch',
            'date': datetime.utcnow(),
            'nutrition': {
                'calories': Decimal('350'),
                'protein_g': Decimal('35'),
                'carbs_g': Decimal('20'),
                'fat_g': Decimal('15')
            },
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
    
    def test_get_meal_success(self, api_gateway_event, lambda_context, sample_meal):
        """Test successful meal retrieval"""
        with patch('src.get_meal_by_id.handler.service.get_meal_by_id') as mock_get:
            mock_get.return_value = MealResponse(**sample_meal)
            
            response = lambda_handler(api_gateway_event, lambda_context)
            
            assert response['statusCode'] == 200
            assert response['headers']['Content-Type'] == 'application/json'
            
            body = json.loads(response['body'])
            assert body['meal_id'] == 'meal-123'
            assert body['name'] == 'Grilled Chicken Salad'
            assert 'nutrition' in body
    
    def test_get_meal_not_found(self, api_gateway_event, lambda_context):
        """Test meal not found scenario"""
        with patch('src.get_meal_by_id.handler.service.get_meal_by_id') as mock_get:
            mock_get.side_effect = MealNotFoundError("Meal meal-123 not found")
            
            response = lambda_handler(api_gateway_event, lambda_context)
            
            assert response['statusCode'] == 404
            body = json.loads(response['body'])
            assert body['error'] == 'NotFound'
            assert 'meal-123' in body['message']
    
    def test_exclude_nutrition(self, api_gateway_event, lambda_context, sample_meal):
        """Test excluding nutrition data"""
        api_gateway_event['queryStringParameters']['include_nutrition'] = 'false'
        sample_meal.pop('nutrition')
        
        with patch('src.get_meal_by_id.handler.service.get_meal_by_id') as mock_get:
            mock_get.return_value = MealResponse(**sample_meal)
            
            response = lambda_handler(api_gateway_event, lambda_context)
            
            assert response['statusCode'] == 200
            body = json.loads(response['body'])
            assert 'nutrition' not in body
```

### Phase 10: Documentation (15 min)

Create `backend/src/get_meal_by_id/README.md`:

```markdown
# Get Meal By ID Lambda Function

## Overview
Implements the `GET /meals/{mealId}` endpoint as defined in `contract/openapi.yaml`.

## Architecture
```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐     ┌────────────┐
│ API Gateway │────▶│   Handler   │────▶│   Service    │────▶│ Repository │
└─────────────┘     └─────────────┘     └──────────────┘     └────────────┘
                           │                                           │
                           ▼                                           ▼
                    ┌─────────────┐                            ┌────────────┐
                    │   Models    │                            │  DynamoDB  │
                    └─────────────┘                            └────────────┘
```

## Environment Variables
- `MEALS_TABLE_NAME`: DynamoDB table name (required)
- `LOG_LEVEL`: Logging level (default: INFO)
- `ENVIRONMENT`: Deployment environment

## IAM Permissions Required
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/${MEALS_TABLE_NAME}"
    }
  ]
}
```

## Testing
```bash
# Unit tests
pytest tests/unit/test_get_meal_by_id.py

# Integration tests
pytest tests/integration/test_get_meal_by_id_integration.py

# Contract tests
npm run test:contract -- --grep "GET /meals/{mealId}"
```

## Monitoring
- CloudWatch Logs: `/aws/lambda/[env]-get-meal-by-id`
- Metrics: `GetMealSuccess`, `GetMealError`
- Traces: X-Ray enabled

## Error Scenarios
| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | ValidationError | Invalid meal ID format |
| 404 | NotFound | Meal doesn't exist |
| 500 | InternalServerError | Unexpected errors |
```

## Quality Checklist

Before marking the task complete, ensure:

### Code Quality
- [ ] All functions have type hints
- [ ] Pydantic models match contract exactly
- [ ] Error handling covers all edge cases
- [ ] Logging provides adequate debugging info
- [ ] No hardcoded values (use environment variables)

### Testing
- [ ] Unit tests achieve >90% coverage
- [ ] Integration tests verify DynamoDB operations
- [ ] Contract tests pass against OpenAPI spec
- [ ] Error scenarios are tested

### Infrastructure
- [ ] Lambda has appropriate memory/timeout
- [ ] IAM permissions follow least privilege
- [ ] CloudWatch logs have retention policy
- [ ] Monitoring/alerting is configured

### Documentation
- [ ] README explains the function's purpose
- [ ] Environment variables are documented
- [ ] Error codes are clearly defined
- [ ] Deployment steps are included

## Common Pitfalls to Avoid

1. **Mismatched Models**: Always copy field names/types exactly from contract
2. **Missing Validation**: Pydantic models must validate all inputs
3. **Poor Error Messages**: Be specific about what went wrong
4. **Inadequate Logging**: Log enough context to debug production issues
5. **Ignoring Edge Cases**: Handle missing optional fields gracefully

---

**Next Steps**: After implementation, update `backend/current-task.md` with your completion report and wait for the Frontend Agent to integrate.