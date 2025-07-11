# Login User Lambda Function

This Lambda function handles user authentication for the AI Lifestyle App.

## Overview

The login endpoint authenticates users with their email and password, returning JWT tokens for API access. It supports Multi-Factor Authentication (MFA) and includes comprehensive security features.

## Features

- Email/password authentication via AWS Cognito
- JWT token generation (access and refresh tokens)
- MFA support (returns session token when MFA is required)
- Failed login attempt tracking
- Account locking after too many failed attempts
- Comprehensive audit logging
- IP address tracking for security

## API Contract

### Request
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### Response (Success - No MFA)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailVerified": true,
    "mfaEnabled": false,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### Response (MFA Required)
```json
{
  "sessionToken": "temp-session-id",
  "mfaRequired": true,
  "tokenType": "Bearer"
}
```

### Error Responses

#### 401 - Invalid Credentials
```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "request_id": "req_123",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

#### 429 - Too Many Attempts
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Too many login attempts. Please try again later.",
  "request_id": "req_123",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Architecture

The function follows Clean Architecture principles:

```
login_user/
├── handler.py          # Lambda entry point
├── models.py           # Pydantic models (request/response)
├── service.py          # Business logic
├── repository.py       # DynamoDB operations
├── cognito_client.py   # AWS Cognito wrapper
├── errors.py           # Custom exceptions
├── Dockerfile          # Container definition
└── requirements.txt    # Python dependencies
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `COGNITO_USER_POOL_ID` | AWS Cognito User Pool ID | Yes |
| `COGNITO_CLIENT_ID` | AWS Cognito App Client ID | Yes |
| `COGNITO_CLIENT_SECRET` | AWS Cognito App Client Secret | No |
| `USERS_TABLE_NAME` | DynamoDB users table name | Yes |
| `ENVIRONMENT` | Deployment environment (dev/prod) | No |
| `LOG_LEVEL` | Logging level (DEBUG/INFO/ERROR) | No |

## IAM Permissions

The Lambda execution role requires:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cognito-idp:InitiateAuth",
        "cognito-idp:GetUser",
        "cognito-idp:AdminGetUser",
        "cognito-idp:AdminUpdateUserAttributes"
      ],
      "Resource": "arn:aws:cognito-idp:*:*:userpool/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:UpdateItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/users-*",
        "arn:aws:dynamodb:*:*:table/users-*/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

## Security Features

1. **Password Security**: Passwords are never logged or stored
2. **Rate Limiting**: Prevents brute force attacks (5 attempts per 15 minutes)
3. **Failed Login Tracking**: Monitors failed attempts for security alerts
4. **Account Locking**: Temporarily locks accounts after too many failures
5. **Audit Logging**: Records all login attempts with IP addresses
6. **MFA Support**: Integrates with TOTP-based 2FA

## Monitoring

The function emits the following CloudWatch metrics:
- `LoginAttempts`: Total login attempts
- `SuccessfulLogins`: Successful authentications
- `FailedLogins`: Failed authentication attempts
- `LockedAccounts`: Accounts locked due to failures
- `RateLimitExceeded`: Rate limit violations
- `LoginErrors`: Unexpected errors

## Testing

### Unit Tests
```bash
cd backend/src/login_user
python -m pytest tests/
```

### Integration Tests
Use the provided PowerShell test script:
```powershell
cd backend/scripts
./test-api.ps1 -ApiEndpoint "https://your-api.execute-api.region.amazonaws.com/v1"
```

## Local Development

1. Set up environment variables:
```bash
export COGNITO_USER_POOL_ID="us-east-1_xxxxx"
export COGNITO_CLIENT_ID="xxxxx"
export USERS_TABLE_NAME="users-dev"
```

2. Build the Docker image:
```bash
docker build -t login-user:latest .
```

3. Run locally with SAM:
```bash
sam local start-api
```

## Deployment

The function is deployed via GitHub Actions on push to main:

1. Docker image is built and pushed to ECR
2. Lambda function is updated with new image
3. Environment variables are configured via Terraform

## Troubleshooting

### Common Issues

1. **"Invalid credentials" for valid user**
   - Check if user exists in Cognito
   - Verify user is confirmed (email verified)
   - Check if account is locked

2. **"Configuration error" response**
   - Verify all environment variables are set
   - Check IAM permissions

3. **MFA-related errors**
   - Ensure MFA is properly configured in Cognito
   - Verify TOTP time sync

### Debugging

Enable debug logging:
```bash
export LOG_LEVEL="DEBUG"
```

Check CloudWatch Logs:
- Log group: `/aws/lambda/login-user-{environment}`
- Look for correlation IDs to trace requests

## Related Documentation

- [User Registration](../register_user/README.md)
- [Token Refresh](../refresh_token/README.md)
- [MFA Setup](../setup_mfa/README.md)
- [OpenAPI Contract](../../../contract/openapi.yaml)
