# Token Refresh Lambda Function

## Overview
This Lambda function handles token refresh operations for the AI Lifestyle App authentication system. It uses AWS Cognito's refresh token flow to issue new access tokens when the current one expires.

## API Contract

### Request
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

### Success Response (200)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR...",
  "tokenType": "Bearer",
  "expiresIn": 3600
}
```

### Error Responses

#### Invalid Token (401)
```json
{
  "error": "INVALID_TOKEN",
  "message": "The provided refresh token is invalid",
  "request_id": "req_123456",
  "timestamp": "2025-01-02T10:00:00Z"
}
```

#### Expired Token (401)
```json
{
  "error": "TOKEN_EXPIRED",
  "message": "Refresh token has expired",
  "request_id": "req_123456",
  "timestamp": "2025-01-02T10:00:00Z"
}
```

#### Revoked Token (401)
```json
{
  "error": "TOKEN_REVOKED",
  "message": "Refresh token has been revoked",
  "request_id": "req_123456",
  "timestamp": "2025-01-02T10:00:00Z"
}
```

## Architecture

### Clean Architecture Layers
1. **Handler Layer** (`handler.py`)
   - Lambda entry point
   - Request/response handling
   - Error mapping to HTTP status codes

2. **Service Layer** (`service.py`)
   - Business logic
   - Token refresh orchestration
   - Optional token validation

3. **Infrastructure Layer** (`cognito_client.py`)
   - AWS Cognito integration
   - Token refresh API calls
   - Error translation

4. **Models** (`models.py`)
   - Pydantic models for validation
   - Type safety
   - API contract enforcement

### Key Features
- **Automatic Validation**: Pydantic models ensure request/response compliance
- **Comprehensive Error Handling**: Specific error types for different failure scenarios
- **Security**: No sensitive data logged, secure token handling
- **Observability**: AWS Lambda Powertools for logging, tracing, and metrics
- **Clean Architecture**: Separation of concerns with clear layer boundaries

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `COGNITO_USER_POOL_ID` | AWS Cognito User Pool ID | Yes |
| `COGNITO_CLIENT_ID` | AWS Cognito App Client ID | Yes |
| `COGNITO_CLIENT_SECRET` | App Client Secret (if configured) | No |
| `ENVIRONMENT` | Deployment environment (dev/prod) | No |
| `LOG_LEVEL` | Logging level (DEBUG/INFO/ERROR) | No |

## Token Lifecycle

1. **User logs in** → Receives access token (1 hour) and refresh token (30 days)
2. **Access token expires** → Frontend detects 401 response
3. **Frontend calls refresh endpoint** → Sends refresh token
4. **Lambda validates refresh token** → Calls Cognito refresh API
5. **Cognito returns new access token** → Lambda returns to frontend
6. **Frontend updates stored token** → Continues making API calls

## Security Considerations

1. **Token Storage**: Frontend should securely store refresh tokens
2. **Token Rotation**: Consider implementing refresh token rotation for enhanced security
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **HTTPS Only**: All token operations must use HTTPS
5. **Token Expiry**: Access tokens expire in 1 hour, refresh tokens in 30 days

## Metrics

The following CloudWatch metrics are emitted:
- `TokenRefreshAttempts`: Total refresh attempts
- `SuccessfulTokenRefreshes`: Successful refreshes
- `InvalidTokenRefreshes`: Invalid token errors
- `ExpiredTokenRefreshes`: Expired token errors
- `RevokedTokenRefreshes`: Revoked token errors
- `TokenRefreshErrors`: General errors

## Testing

### Unit Tests
```bash
python -m pytest tests/test_refresh_token.py -v
```

### Integration Test
```bash
# Set environment variables
export COGNITO_USER_POOL_ID=your-pool-id
export COGNITO_CLIENT_ID=your-client-id

# Run integration test
python tests/integration/test_refresh_integration.py
```

### Local Testing with SAM
```bash
sam local start-api --env-vars env.json
```

## Deployment

### Build Docker Image
```bash
docker build -t refresh-token:latest .
```

### Push to ECR
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_URI
docker tag refresh-token:latest $ECR_URI/refresh-token:latest
docker push $ECR_URI/refresh-token:latest
```

### Deploy with Terraform
The Lambda is deployed as part of the auth service infrastructure.

## Troubleshooting

### Common Issues

1. **"Invalid refresh token" error**
   - Check token format and encoding
   - Verify token hasn't been tampered with
   - Ensure using correct Cognito User Pool

2. **"Token expired" error**
   - Refresh tokens expire after 30 days
   - User must login again to get new tokens

3. **"Configuration error"**
   - Verify environment variables are set
   - Check IAM permissions for Lambda
   - Ensure Cognito User Pool exists

4. **Rate limiting**
   - Cognito has built-in rate limits
   - Implement exponential backoff on client

## Contract Compliance Note

**IMPORTANT**: This implementation follows the OpenAPI contract exactly. The contract specifies that the refresh response should only include `accessToken`, `tokenType`, and `expiresIn`. 

If token rotation is required (returning a new refresh token), the OpenAPI contract must be updated first before modifying this implementation.
