# Pattern: Error Handling

## Purpose
Define consistent error response patterns that provide clear, actionable information to API consumers while maintaining security.

## Error Response Structure

### Base Error Schema
```yaml
components:
  schemas:
    Error:
      type: object
      required:
        - error
        - message
        - timestamp
        - traceId
      properties:
        error:
          type: string
          description: Machine-readable error code
          example: "VALIDATION_ERROR"
        message:
          type: string
          description: Human-readable error message
          example: "The provided email address is invalid"
        timestamp:
          type: string
          format: date-time
          description: When the error occurred
        traceId:
          type: string
          description: Unique ID for tracing in logs
          example: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
        details:
          type: object
          description: Additional context (optional)
```

### Validation Error Schema
```yaml
ValidationError:
  allOf:
    - $ref: '#/components/schemas/Error'
    - type: object
      properties:
        error:
          type: string
          enum: ['VALIDATION_ERROR']
        fieldErrors:
          type: array
          items:
            type: object
            required: [field, message]
            properties:
              field:
                type: string
                description: Field that failed validation
                example: "email"
              message:
                type: string
                description: What's wrong with the field
                example: "Must be a valid email address"
              value:
                description: The invalid value (omit sensitive data)
                example: "not-an-email"
```

## HTTP Status Code Guide

### Success Codes (2xx)
| Code | When to Use | Example |
|------|-------------|---------|
| 200 | Successful GET, PUT, PATCH | Retrieved resource |
| 201 | Successful POST creating resource | Created new item |
| 202 | Accepted for async processing | Bulk import started |
| 204 | Successful DELETE or no content | Deleted resource |

### Client Error Codes (4xx)
| Code | When to Use | Error Code |
|------|-------------|------------|
| 400 | Invalid request syntax/data | `VALIDATION_ERROR` |
| 401 | Missing/invalid authentication | `UNAUTHORIZED` |
| 403 | Authenticated but forbidden | `FORBIDDEN` |
| 404 | Resource not found | `NOT_FOUND` |
| 409 | Conflict with current state | `CONFLICT` |
| 422 | Valid syntax but semantic errors | `BUSINESS_RULE_ERROR` |
| 429 | Too many requests | `RATE_LIMIT_EXCEEDED` |

### Server Error Codes (5xx)
| Code | When to Use | Error Code |
|------|-------------|------------|
| 500 | Unexpected server error | `INTERNAL_ERROR` |
| 502 | Bad gateway/upstream error | `UPSTREAM_ERROR` |
| 503 | Service temporarily unavailable | `SERVICE_UNAVAILABLE` |
| 504 | Gateway timeout | `GATEWAY_TIMEOUT` |

## Error Code Patterns

### Naming Convention
- SCREAMING_SNAKE_CASE
- Descriptive but concise
- Groupable by prefix

### Common Error Codes
```yaml
# Authentication/Authorization
UNAUTHORIZED              # No valid auth token
INVALID_TOKEN            # Token expired/malformed
FORBIDDEN                # Lacks permission
INSUFFICIENT_SCOPE       # Token lacks required scope

# Validation
VALIDATION_ERROR         # General validation failure
REQUIRED_FIELD_MISSING   # Missing required field
INVALID_FORMAT           # Wrong format (email, date, etc)
OUT_OF_RANGE            # Number outside valid range
TOO_LONG                # String exceeds max length
TOO_SHORT               # String below min length

# Resource Errors
NOT_FOUND               # Resource doesn't exist
ALREADY_EXISTS          # Duplicate resource
CONFLICT                # State conflict
STALE_DATA              # Optimistic lock failure

# Business Rules
BUSINESS_RULE_ERROR     # General business rule violation
INSUFFICIENT_FUNDS      # Not enough balance
QUOTA_EXCEEDED          # Over usage limits
INVALID_STATE_TRANSITION # Invalid workflow transition

# System Errors
INTERNAL_ERROR          # Unexpected server error
SERVICE_UNAVAILABLE     # Temporary outage
EXTERNAL_SERVICE_ERROR  # Third-party API failure
TIMEOUT                 # Operation timeout
```

## Error Response Examples

### 400 Bad Request
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request data",
  "timestamp": "2024-01-20T14:30:00Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "fieldErrors": [
    {
      "field": "email",
      "message": "Must be a valid email address",
      "value": "not-an-email"
    },
    {
      "field": "quantity",
      "message": "Must be between 1 and 9999",
      "value": 10000
    }
  ]
}
```

### 404 Not Found
```json
{
  "error": "NOT_FOUND",
  "message": "Meal not found",
  "timestamp": "2024-01-20T14:30:00Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "details": {
    "resource": "meal",
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### 409 Conflict
```json
{
  "error": "ALREADY_EXISTS",
  "message": "An item with this barcode already exists in your pantry",
  "timestamp": "2024-01-20T14:30:00Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "details": {
    "existingItemId": "987e6543-e21b-12d3-a456-426614174000",
    "barcode": "0123456789012"
  }
}
```

### 422 Unprocessable Entity
```json
{
  "error": "BUSINESS_RULE_ERROR",
  "message": "Cannot consume meal in the future",
  "timestamp": "2024-01-20T14:30:00Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "details": {
    "rule": "MEAL_DATE_IN_PAST",
    "providedDate": "2025-01-20T14:30:00Z",
    "currentDate": "2024-01-20T14:30:00Z"
  }
}
```

### 429 Too Many Requests
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please retry after 60 seconds.",
  "timestamp": "2024-01-20T14:30:00Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "details": {
    "limit": 100,
    "window": "1 minute",
    "retryAfter": 60
  }
}
```

### 503 Service Unavailable
```json
{
  "error": "EXTERNAL_SERVICE_ERROR",
  "message": "Product lookup service is temporarily unavailable",
  "timestamp": "2024-01-20T14:30:00Z",
  "traceId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "details": {
    "service": "OpenFood API",
    "retryAfter": 30
  }
}
```

## Implementation Patterns

### Lambda Error Handler
```python
from typing import Dict, Any, Optional
import json
import uuid
from datetime import datetime

class APIError(Exception):
    def __init__(
        self, 
        status_code: int, 
        error_code: str, 
        message: str, 
        details: Optional[Dict[str, Any]] = None
    ):
        self.status_code = status_code
        self.error_code = error_code
        self.message = message
        self.details = details
        super().__init__(message)

def create_error_response(error: APIError, trace_id: str) -> Dict[str, Any]:
    response = {
        "statusCode": error.status_code,
        "headers": {
            "Content-Type": "application/json",
            "X-Trace-Id": trace_id
        },
        "body": json.dumps({
            "error": error.error_code,
            "message": error.message,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "traceId": trace_id,
            **({"details": error.details} if error.details else {})
        })
    }
    return response

# Usage in Lambda handler
def lambda_handler(event, context):
    trace_id = str(uuid.uuid4())
    
    try:
        # Your business logic here
        result = process_request(event)
        return {
            "statusCode": 200,
            "headers": {"X-Trace-Id": trace_id},
            "body": json.dumps(result)
        }
    except APIError as e:
        return create_error_response(e, trace_id)
    except Exception as e:
        # Log the full error
        logger.exception(f"Unexpected error: {e}")
        # Return generic error to client
        generic_error = APIError(
            500, 
            "INTERNAL_ERROR", 
            "An unexpected error occurred"
        )
        return create_error_response(generic_error, trace_id)
```

### Common Error Definitions
```python
# errors.py
class NotFoundError(APIError):
    def __init__(self, resource: str, id: str):
        super().__init__(
            404,
            "NOT_FOUND",
            f"{resource.capitalize()} not found",
            {"resource": resource, "id": id}
        )

class ValidationError(APIError):
    def __init__(self, field_errors: List[Dict[str, str]]):
        super().__init__(
            400,
            "VALIDATION_ERROR",
            "Invalid request data",
            {"fieldErrors": field_errors}
        )

class ConflictError(APIError):
    def __init__(self, message: str, details: Dict[str, Any]):
        super().__init__(
            409,
            "CONFLICT",
            message,
            details
        )

class BusinessRuleError(APIError):
    def __init__(self, rule: str, message: str, details: Dict[str, Any]):
        super().__init__(
            422,
            "BUSINESS_RULE_ERROR",
            message,
            {"rule": rule, **details}
        )
```

## Security Considerations

### What NOT to Include in Errors
- ❌ Stack traces
- ❌ Internal server paths
- ❌ Database queries
- ❌ Sensitive user data
- ❌ Internal service names
- ❌ Implementation details

### What to Include
- ✅ Clear error codes
- ✅ Actionable messages
- ✅ Trace IDs for support
- ✅ Retry guidance
- ✅ Help links (if applicable)

## Error Handling in Frontend

### Type-Safe Error Handling
```typescript
interface APIError {
  error: string;
  message: string;
  timestamp: string;
  traceId: string;
  details?: Record<string, any>;
}

interface ValidationError extends APIError {
  error: 'VALIDATION_ERROR';
  fieldErrors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

// Type guard
function isValidationError(error: APIError): error is ValidationError {
  return error.error === 'VALIDATION_ERROR';
}

// Usage
try {
  const result = await apiClient.post('/meals', mealData);
} catch (error) {
  if (isValidationError(error)) {
    // Handle field-specific errors
    error.fieldErrors.forEach(fieldError => {
      setFieldError(fieldError.field, fieldError.message);
    });
  } else {
    // Handle general errors
    showToast(error.message);
  }
}
```

## Monitoring & Alerting

### Track Error Rates
```python
# CloudWatch custom metrics
cloudwatch.put_metric_data(
    Namespace='API/Errors',
    MetricData=[
        {
            'MetricName': 'ErrorCount',
            'Dimensions': [
                {'Name': 'ErrorCode', 'Value': error_code},
                {'Name': 'StatusCode', 'Value': str(status_code)},
                {'Name': 'Endpoint', 'Value': endpoint}
            ],
            'Value': 1,
            'Unit': 'Count'
        }
    ]
)
```

### Alert Thresholds
- 5xx errors > 1% → Page on-call
- 4xx errors > 10% → Alert team
- Specific error spike → Investigate

## Testing Error Scenarios

### Contract Tests for Errors
```yaml
# In OpenAPI spec
paths:
  /meals/{mealId}:
    get:
      responses:
        '404':
          description: Meal not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
              examples:
                notFound:
                  value:
                    error: "NOT_FOUND"
                    message: "Meal not found"
                    timestamp: "2024-01-20T14:30:00Z"
                    traceId: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
                    details:
                      resource: "meal"
                      id: "123e4567-e89b-12d3-a456-426614174000"
```

---

**Remember**: Good error handling turns frustrating failures into clear next steps. Every error should tell the user what went wrong and what they can do about it.