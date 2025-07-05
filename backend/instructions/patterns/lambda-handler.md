# Pattern: Lambda Handler

## Purpose
Standardized entry point for all Lambda functions implementing API operations. This pattern ensures consistent error handling, logging, and response formatting.

## When to Use
- Every Lambda function that handles API Gateway requests
- Both synchronous and asynchronous operations
- All REST API endpoints

## The Pattern

### Basic Structure
```python
"""
Lambda handler for [operationId] operation.
[Brief description of what this endpoint does]
"""
import json
import logging
import os
from typing import Dict, Any
from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.logging import correlation_paths

# Import your models and services
from .models import RequestModel, ResponseModel, ErrorResponse
from .service import YourService
from .errors import ValidationError, NotFoundError, AuthorizationError

# Initialize AWS Lambda Powertools
logger = Logger()
tracer = Tracer()
metrics = Metrics()

# Initialize service (outside handler for connection reuse)
service = YourService()

@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)
@tracer.capture_lambda_handler
@metrics.log_metrics
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle [HTTP_METHOD] [path] requests.
    
    Args:
        event: API Gateway Lambda proxy event
        context: Lambda context object
        
    Returns:
        API Gateway Lambda proxy response
    """
    try:
        # 1. Extract user context
        user_id = extract_user_id(event)
        
        # 2. Parse and validate input
        request_data = parse_request(event)
        
        # 3. Log the operation
        logger.info(
            f"Processing {event['httpMethod']} request",
            extra={
                "user_id": user_id,
                "path": event['path'],
                "request_id": context.request_id
            }
        )
        
        # 4. Execute business logic
        result = service.process_request(user_id, request_data)
        
        # 5. Record success metric
        metrics.add_metric(name="OperationSuccess", unit=MetricUnit.Count, value=1)
        
        # 6. Return successful response
        return create_response(200, result)
        
    except ValidationError as e:
        logger.warning(f"Validation error: {str(e)}")
        return create_error_response(400, "ValidationError", str(e), context.request_id)
        
    except NotFoundError as e:
        logger.info(f"Resource not found: {str(e)}")
        return create_error_response(404, "NotFound", str(e), context.request_id)
        
    except AuthorizationError as e:
        logger.warning(f"Authorization failed: {str(e)}")
        return create_error_response(403, "Forbidden", str(e), context.request_id)
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        metrics.add_metric(name="OperationError", unit=MetricUnit.Count, value=1)
        return create_error_response(
            500, 
            "InternalServerError", 
            "An unexpected error occurred", 
            context.request_id
        )
```

### Helper Functions
```python
def extract_user_id(event: Dict[str, Any]) -> str:
    """Extract authenticated user ID from event"""
    try:
        return event['requestContext']['authorizer']['claims']['sub']
    except KeyError:
        raise AuthorizationError("User not authenticated")

def parse_request(event: Dict[str, Any]) -> RequestModel:
    """Parse and validate request data"""
    # For GET requests with query parameters
    if event['httpMethod'] == 'GET':
        query_params = event.get('queryStringParameters') or {}
        path_params = event.get('pathParameters') or {}
        return RequestModel(**{**query_params, **path_params})
    
    # For POST/PUT requests with body
    elif event['httpMethod'] in ['POST', 'PUT', 'PATCH']:
        try:
            body = json.loads(event['body'])
            return RequestModel(**body)
        except json.JSONDecodeError:
            raise ValidationError("Invalid JSON in request body")
    
    else:
        raise ValidationError(f"Unsupported HTTP method: {event['httpMethod']}")

def create_response(status_code: int, data: Any) -> Dict[str, Any]:
    """Create standardized API response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  # Configure based on environment
            'Cache-Control': 'no-cache'
        },
        'body': data.json() if hasattr(data, 'json') else json.dumps(data)
    }

def create_error_response(
    status_code: int, 
    error_type: str, 
    message: str, 
    request_id: str
) -> Dict[str, Any]:
    """Create standardized error response"""
    error = ErrorResponse(
        error=error_type,
        message=message,
        request_id=request_id
    )
    return create_response(status_code, error)
```

## Advanced Patterns

### Pattern 1: Async Operations
```python
@tracer.capture_method
async def process_async_operation(data: Dict[str, Any]) -> str:
    """Handle async operations with SQS/EventBridge"""
    # Send to queue
    sqs = boto3.client('sqs')
    message_id = str(uuid.uuid4())
    
    sqs.send_message(
        QueueUrl=os.environ['PROCESSING_QUEUE_URL'],
        MessageBody=json.dumps({
            'id': message_id,
            'data': data,
            'timestamp': datetime.utcnow().isoformat()
        })
    )
    
    return message_id
```

### Pattern 2: Batch Operations
```python
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle batch operations with partial success"""
    results = []
    errors = []
    
    for record in event['Records']:
        try:
            result = process_single_record(record)
            results.append(result)
        except Exception as e:
            errors.append({
                'record': record['id'],
                'error': str(e)
            })
    
    # Return partial success
    return {
        'statusCode': 207,  # Multi-Status
        'body': json.dumps({
            'successful': len(results),
            'failed': len(errors),
            'errors': errors
        })
    }
```

### Pattern 3: File Uploads
```python
def handle_file_upload(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle file uploads with S3 presigned URLs"""
    # Validate file metadata
    file_metadata = json.loads(event['body'])
    validate_file_metadata(file_metadata)
    
    # Generate presigned URL
    s3 = boto3.client('s3')
    key = f"uploads/{user_id}/{uuid.uuid4()}/{file_metadata['filename']}"
    
    presigned_url = s3.generate_presigned_url(
        'put_object',
        Params={
            'Bucket': os.environ['UPLOAD_BUCKET'],
            'Key': key,
            'ContentType': file_metadata['content_type']
        },
        ExpiresIn=3600
    )
    
    return {
        'upload_url': presigned_url,
        'file_key': key,
        'expires_in': 3600
    }
```

## Environment Variables
Always use environment variables for configuration:
```python
# Required environment variables
ENVIRONMENT = os.environ['ENVIRONMENT']  # dev, staging, prod
TABLE_NAME = os.environ['TABLE_NAME']
LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')

# Optional with defaults
TIMEOUT_SECONDS = int(os.environ.get('TIMEOUT_SECONDS', '30'))
MAX_RETRIES = int(os.environ.get('MAX_RETRIES', '3'))
```

## Performance Optimizations

### 1. Connection Reuse
```python
# Initialize outside handler for reuse across invocations
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    # Use pre-initialized resources
    response = table.get_item(...)
```

### 2. Lazy Loading
```python
# Only import heavy dependencies when needed
def process_image(image_data):
    from PIL import Image  # Import only when processing images
    return Image.open(image_data)
```

### 3. Response Streaming
```python
# For large responses, use streaming
def lambda_handler(event, context):
    def generate_large_dataset():
        for item in fetch_items_in_batches():
            yield json.dumps(item) + '\n'
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/x-ndjson',
            'Transfer-Encoding': 'chunked'
        },
        'body': generate_large_dataset(),
        'isBase64Encoded': False
    }
```

## Security Best Practices

### 1. Input Validation
```python
# Always validate input at the edge
from pydantic import validator

class RequestModel(BaseModel):
    email: str
    age: int
    
    @validator('email')
    def validate_email(cls, v):
        if not '@' in v:
            raise ValueError('Invalid email format')
        return v.lower()
    
    @validator('age')
    def validate_age(cls, v):
        if v < 0 or v > 150:
            raise ValueError('Invalid age')
        return v
```

### 2. Output Sanitization
```python
# Remove sensitive data from responses
def sanitize_user_data(user: Dict[str, Any]) -> Dict[str, Any]:
    """Remove sensitive fields before returning"""
    sensitive_fields = ['password', 'ssn', 'credit_card']
    return {k: v for k, v in user.items() if k not in sensitive_fields}
```

### 3. Rate Limiting
```python
# Implement rate limiting
def check_rate_limit(user_id: str, operation: str) -> bool:
    """Check if user has exceeded rate limit"""
    key = f"rate_limit:{user_id}:{operation}"
    current = redis_client.incr(key)
    
    if current == 1:
        redis_client.expire(key, 60)  # 1 minute window
    
    return current <= MAX_REQUESTS_PER_MINUTE
```

## Testing the Handler

### Unit Test Template
```python
class TestLambdaHandler:
    """Test suite for Lambda handler"""
    
    @pytest.fixture
    def api_gateway_event(self):
        """Mock API Gateway event"""
        return {
            'httpMethod': 'GET',
            'path': '/resource/123',
            'pathParameters': {'id': '123'},
            'queryStringParameters': {'include': 'details'},
            'headers': {'Authorization': 'Bearer token'},
            'requestContext': {
                'authorizer': {
                    'claims': {'sub': 'user-123'}
                }
            }
        }
    
    def test_successful_request(self, api_gateway_event, mock_service):
        """Test successful request handling"""
        mock_service.process_request.return_value = {'data': 'test'}
        
        response = lambda_handler(api_gateway_event, mock_context())
        
        assert response['statusCode'] == 200
        assert 'data' in json.loads(response['body'])
```

## Monitoring and Observability

### 1. Structured Logging
```python
# Log with consistent structure
logger.info(
    "Operation completed",
    extra={
        "operation": "create_meal",
        "user_id": user_id,
        "duration_ms": duration,
        "item_count": len(items),
        "status": "success"
    }
)
```

### 2. Custom Metrics
```python
# Track business metrics
metrics.add_metric(
    name="MealCreated",
    unit=MetricUnit.Count,
    value=1
)

metrics.add_metadata("meal_type", meal.meal_type)
metrics.add_metadata("has_nutrition", meal.nutrition is not None)
```

### 3. Distributed Tracing
```python
# Add custom segments for debugging
@tracer.capture_method
def fetch_user_preferences(user_id: str) -> Dict[str, Any]:
    """Fetch user preferences with tracing"""
    tracer.put_annotation("user_id", user_id)
    
    # Your logic here
    preferences = get_from_cache_or_db(user_id)
    
    tracer.put_metadata("cache_hit", preferences.from_cache)
    return preferences
```

## Common Anti-Patterns to Avoid

### ❌ Don't Do This:
```python
# 1. Catching all exceptions without logging
except:
    pass

# 2. Hardcoding configuration
table = dynamodb.Table('prod-meals-table')

# 3. Synchronous waiting in Lambda
time.sleep(5)  # Never do this

# 4. Large in-memory operations
all_users = list(table.scan()['Items'])  # Can cause OOM

# 5. Missing error details
return {'statusCode': 500, 'body': 'Error'}  # Too vague
```

### ✅ Do This Instead:
```python
# 1. Log all exceptions with context
except Exception as e:
    logger.error(f"Operation failed: {str(e)}", exc_info=True)
    raise

# 2. Use environment variables
table = dynamodb.Table(os.environ['TABLE_NAME'])

# 3. Use async operations
asyncio.create_task(process_later(data))

# 4. Use pagination
paginator = table.scan(PaginationConfig={'PageSize': 100})

# 5. Provide helpful error messages
return {
    'statusCode': 500,
    'body': json.dumps({
        'error': 'InternalServerError',
        'message': 'Failed to process meal data',
        'request_id': context.request_id
    })
}
```

---

**Remember**: The Lambda handler is the first line of defense. Make it robust, observable, and fast. Every millisecond counts in serverless!