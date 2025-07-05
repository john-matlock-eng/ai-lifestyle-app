# User Registration Lambda Function

## Overview
This Lambda function handles user registration for the AI Lifestyle App. It creates users in AWS Cognito and stores user profiles in DynamoDB.

## Architecture
The function follows Clean Architecture principles:
- `handler.py` - Lambda entry point with API Gateway integration
- `models.py` - Pydantic models for request/response validation
- `service.py` - Business logic layer
- `repository.py` - Data access layer for DynamoDB
- `cognito_client.py` - AWS Cognito integration
- `errors.py` - Custom exception classes

## Environment Variables
Required environment variables:
- `COGNITO_USER_POOL_ID` - AWS Cognito User Pool ID
- `COGNITO_CLIENT_ID` - AWS Cognito App Client ID
- `USERS_TABLE_NAME` - DynamoDB table name for user data
- `ENVIRONMENT` - Environment name (dev/staging/prod)
- `LOG_LEVEL` - Logging level (DEBUG/INFO/WARNING/ERROR)
- `CORS_ORIGIN` - Allowed CORS origin (default: *)

## IAM Permissions
The Lambda function requires the following IAM permissions:
- Cognito:
  - `cognito-idp:AdminCreateUser`
  - `cognito-idp:AdminSetUserPassword`
  - `cognito-idp:AdminGetUser`
  - `cognito-idp:AdminUpdateUserAttributes`
  - `cognito-idp:AdminUserGlobalSignOut`
  - `cognito-idp:AdminDeleteUser`
- DynamoDB:
  - `dynamodb:PutItem` on users table
  - `dynamodb:Query` on EmailIndex GSI

## Request Format
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "firstName": "Jane",
  "lastName": "Doe"
}
```

## Response Format
### Success (201)
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "message": "Registration successful. Please check your email to verify your account."
}
```

### User Already Exists (409)
```json
{
  "error": "USER_ALREADY_EXISTS",
  "message": "Email address is already registered",
  "request_id": "...",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Validation Error (400)
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "validation_errors": [
    {
      "field": "password",
      "message": "Password must contain at least one special character"
    }
  ],
  "request_id": "...",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Password Requirements
- Minimum 8 characters
- Maximum 128 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character

## Deployment

### Build Docker Image
```bash
cd backend/src/register_user
docker build -t register-user:latest .
```

### Push to ECR
```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URI

# Tag image
docker tag register-user:latest $ECR_URI/ai-lifestyle-auth-register-user:latest

# Push image
docker push $ECR_URI/ai-lifestyle-auth-register-user:latest
```

### Deploy with Terraform
```bash
cd backend/terraform/environments/dev
terraform apply -target=module.auth_service
```

## Testing

### Unit Tests
```bash
pytest tests/unit/test_register_user.py -v
```

### Integration Tests
```bash
pytest tests/integration/test_register_user_integration.py -v
```

### Local Testing
You can test the Lambda function locally using SAM CLI:
```bash
sam local invoke RegisterUserFunction -e events/register_user_event.json
```

## Monitoring
- CloudWatch Logs: Function logs with correlation IDs
- X-Ray: Distributed tracing enabled
- Custom Metrics:
  - `SuccessfulRegistrations` - Count of successful registrations
  - `DuplicateRegistrationAttempts` - Count of duplicate email attempts
  - `RegistrationErrors` - Count of registration errors
  - `UnexpectedErrors` - Count of unexpected errors

## Error Handling
The function implements comprehensive error handling:
1. Input validation with detailed error messages
2. Duplicate email detection
3. Cognito error handling
4. DynamoDB error handling
5. Automatic rollback on failure (removes partially created resources)

## Security Considerations
1. Passwords are never logged
2. Sensitive user data is not included in error responses
3. Rate limiting should be implemented at API Gateway level
4. All responses include request IDs for debugging
5. CORS headers are configurable via environment variable
