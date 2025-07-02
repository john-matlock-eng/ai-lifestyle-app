# Get User Profile Lambda Function

## Overview
This Lambda function handles user profile retrieval for the AI Lifestyle App. It validates JWT access tokens and returns comprehensive user profile information including preferences and settings.

## API Contract

### Request
```http
GET /users/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...
```

### Success Response (200)
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "emailVerified": true,
  "mfaEnabled": false,
  "phoneNumber": "+1234567890",
  "dateOfBirth": "1990-01-01",
  "timezone": "America/New_York",
  "preferences": {
    "units": "metric",
    "language": "en-US",
    "notifications": {
      "email": true,
      "push": true,
      "sms": false
    },
    "dietaryRestrictions": ["vegetarian", "gluten-free"],
    "fitnessGoals": ["weight-loss", "endurance"]
  },
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-01-01T12:00:00Z"
}
```

### Error Responses

#### Unauthorized (401)
```json
{
  "error": "UNAUTHORIZED",
  "message": "Invalid or missing authentication token",
  "request_id": "req_123456",
  "timestamp": "2025-01-01T10:00:00Z"
}
```

#### Token Expired (401)
```json
{
  "error": "TOKEN_EXPIRED",
  "message": "Access token has expired",
  "request_id": "req_123456",
  "timestamp": "2025-01-01T10:00:00Z"
}
```

#### User Not Found (404)
```json
{
  "error": "USER_NOT_FOUND",
  "message": "User not found",
  "request_id": "req_123456",
  "timestamp": "2025-01-01T10:00:00Z"
}
```

## Architecture

### Clean Architecture Layers
1. **Handler Layer** (`handler.py`)
   - Lambda entry point
   - Authorization header extraction
   - Error mapping to HTTP status codes
   - Metrics and logging

2. **Service Layer** (`service.py`)
   - Business logic orchestration
   - Token validation coordination
   - Profile enrichment with Cognito data

3. **Infrastructure Layer**
   - **CognitoClient** (`cognito_client.py`): JWT token validation
   - **UserRepository** (`repository.py`): DynamoDB data access

4. **Models** (`models.py`)
   - Pydantic models for validation
   - Type safety and data transformation
   - API contract enforcement

### Key Features
- **JWT Token Validation**: Validates access tokens with AWS Cognito
- **Comprehensive Profile Data**: Returns all user information including preferences
- **Clean Architecture**: Separation of concerns with clear boundaries
- **Error Handling**: Specific error types for different scenarios
- **Observability**: AWS Lambda Powertools for logging, tracing, and metrics
- **Type Safety**: Full type hints and Pydantic validation

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `COGNITO_USER_POOL_ID` | AWS Cognito User Pool ID | Yes |
| `COGNITO_CLIENT_ID` | AWS Cognito App Client ID | Yes |
| `USERS_TABLE_NAME` | DynamoDB table name for users | Yes |
| `ENVIRONMENT` | Deployment environment (dev/prod) | No |
| `LOG_LEVEL` | Logging level (DEBUG/INFO/ERROR) | No |

## Authentication Flow

1. **Client sends request** with Authorization header containing JWT
2. **Lambda extracts token** from Authorization header
3. **Token validation** with Cognito GetUser API
4. **User ID extraction** from token claims
5. **Database lookup** using user ID
6. **Response formatting** with complete profile data

## Data Model

### User Profile Fields
- **Basic Information**: userId, email, firstName, lastName
- **Account Status**: emailVerified, mfaEnabled
- **Contact**: phoneNumber (optional)
- **Personal**: dateOfBirth, timezone (optional)
- **Preferences**: units, language, notifications, dietary restrictions, fitness goals
- **Timestamps**: createdAt, updatedAt

### Preferences Structure
```json
{
  "units": "metric|imperial",
  "language": "ISO 639-1 format (e.g., en-US)",
  "notifications": {
    "email": true,
    "push": true,
    "sms": false
  },
  "dietaryRestrictions": ["vegan", "vegetarian", "gluten-free", ...],
  "fitnessGoals": ["weight-loss", "muscle-gain", "endurance", ...]
}
```

## Security Considerations

1. **Token Validation**: Every request validates the JWT with Cognito
2. **No Caching**: User data is always fetched fresh (no stale data)
3. **Secure Headers**: Proper WWW-Authenticate headers on 401 responses
4. **Request Tracking**: All requests have unique IDs for audit trails
5. **No Sensitive Data in Logs**: Only user IDs and emails are logged

## Metrics

The following CloudWatch metrics are emitted:
- `GetUserProfileRequests`: Total profile requests
- `SuccessfulProfileRetrievals`: Successful retrievals
- `UnauthorizedRequests`: Missing or invalid tokens
- `ExpiredTokenRequests`: Expired token attempts
- `UserNotFoundErrors`: Users not in database
- `DatabaseErrors`: DynamoDB failures
- `GetUserProfileErrors`: General errors

## Error Handling

| Error Type | HTTP Status | Description |
|------------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid token |
| TOKEN_EXPIRED | 401 | Access token expired |
| USER_NOT_FOUND | 404 | User doesn't exist in database |
| DATABASE_ERROR | 503 | DynamoDB unavailable |
| CONFIGURATION_ERROR | 500 | Missing environment variables |
| INTERNAL_ERROR | 500 | Unexpected errors |

## Testing

### Unit Tests
```bash
python -m pytest tests/test_get_user_profile.py -v
```

### Integration Test
```bash
# Set environment variables
export COGNITO_USER_POOL_ID=your-pool-id
export COGNITO_CLIENT_ID=your-client-id
export USERS_TABLE_NAME=users-dev

# Run integration test
python tests/integration/test_profile_integration.py
```

### Local Testing with SAM
```bash
sam local start-api --env-vars env.json
```

### Test with cURL
```bash
# Get access token first (from login endpoint)
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR..."

# Get user profile
curl -X GET https://api.example.com/users/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## Deployment

### Build Docker Image
```bash
docker build -t get-user-profile:latest .
```

### Push to ECR
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URI
docker tag get-user-profile:latest $ECR_URI/get-user-profile:latest
docker push $ECR_URI/get-user-profile:latest
```

### Deploy with Terraform
The Lambda is deployed as part of the auth service infrastructure.

## Troubleshooting

### Common Issues

1. **"Missing Authorization header"**
   - Ensure Authorization header is sent
   - Format: `Authorization: Bearer <token>`

2. **"Access token has expired"**
   - Access tokens expire after 1 hour
   - Use refresh token endpoint to get new token

3. **"User not found"**
   - User exists in Cognito but not DynamoDB
   - Check data consistency between services

4. **"Database error"**
   - Check DynamoDB table exists
   - Verify IAM permissions for Lambda

## Performance Considerations

1. **Latency**: ~100-200ms typical response time
2. **Cognito Rate Limits**: GetUser has limits, implement caching if needed
3. **DynamoDB**: Using primary key lookup for O(1) performance
4. **Cold Starts**: Container image may have 1-2s cold start

## Future Enhancements

1. **Response Caching**: Cache profile data with short TTL
2. **Batch Operations**: Get multiple profiles in one request
3. **Partial Updates**: Support PATCH for profile updates
4. **Activity History**: Include last login, last activity
5. **Avatar Support**: Profile picture URLs

## Dependencies

- `boto3`: AWS SDK for Cognito and DynamoDB
- `pydantic`: Data validation and serialization
- `aws-lambda-powertools`: Logging, tracing, and metrics
- `python-dateutil`: Date/time handling
