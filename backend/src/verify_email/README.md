# Email Verification Lambda Function

This Lambda function handles email verification for the AI Lifestyle App.

## Overview

The email verification endpoint allows users to confirm their email addresses using a verification token sent to their email. Per PM decision, we implement a 7-day grace period but do NOT enforce email verification for MVP - users can still login even with unverified emails.

## API Contract

### Endpoint: POST /auth/email/verify

**Request Body:**
```json
{
  "token": "email@example.com:123456"
}
```

**Success Response (200):**
```json
{
  "message": "Email successfully verified. You can now access all features of the app."
}
```

**Error Responses:**

- **400 Bad Request** - Invalid or expired token
```json
{
  "error": "INVALID_TOKEN",
  "message": "Invalid verification code",
  "request_id": "abc-123",
  "timestamp": "2024-01-20T10:00:00Z"
}
```

- **400 Bad Request** - Token expired
```json
{
  "error": "TOKEN_EXPIRED",
  "message": "Verification code has expired. Please request a new one.",
  "details": {
    "help": "Please request a new verification email"
  },
  "request_id": "abc-123",
  "timestamp": "2024-01-20T10:00:00Z"
}
```

## Architecture

The function follows Clean Architecture principles:

```
verify_email/
├── handler.py          # Lambda entry point
├── service.py          # Business logic orchestration
├── cognito_client.py   # AWS Cognito integration
├── repository.py       # DynamoDB operations
├── models.py          # Pydantic request/response models
├── errors.py          # Custom exception types
├── Dockerfile         # Container configuration
└── requirements.txt   # Python dependencies
```

## Key Features

1. **Token Validation**: Validates verification tokens from email
2. **Cognito Integration**: Confirms user signup in Cognito
3. **Database Updates**: Updates email verification status in DynamoDB
4. **Audit Trail**: Records verification events for compliance
5. **Idempotent**: Returns success even if already verified
6. **Security**: Doesn't reveal user existence on errors

## Token Format

For MVP, we use a simple token format: `email:code`
- Example: `user@example.com:123456`

In production, this should be replaced with:
- JWT tokens with expiration
- Encrypted tokens
- UUID-based tokens stored in database

## Environment Variables

- `COGNITO_USER_POOL_ID`: Cognito User Pool ID
- `COGNITO_CLIENT_ID`: Cognito App Client ID
- `USERS_TABLE_NAME`: DynamoDB table name (default: 'users')
- `ENVIRONMENT`: Deployment environment (dev/prod)
- `LOG_LEVEL`: Logging level (default: INFO)

## Deployment

1. Build the Docker image:
```bash
docker build -t verify-email:latest .
```

2. Tag and push to ECR:
```bash
docker tag verify-email:latest $ECR_URI/verify-email:latest
docker push $ECR_URI/verify-email:latest
```

3. Deploy with Terraform:
```bash
terraform apply -target=module.verify_email_lambda
```

## Testing

### Manual Testing

1. Register a new user to receive verification email
2. Extract the verification code from email
3. Call the verification endpoint:

```bash
curl -X POST https://api.ailifestyle.app/v1/auth/email/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "user@example.com:123456"
  }'
```

### Unit Tests

Run unit tests:
```bash
pytest tests/verify_email/
```

## Monitoring

### CloudWatch Metrics

- `EmailVerificationAttempts` - Total verification attempts
- `SuccessfulEmailVerifications` - Successful verifications
- `InvalidVerificationTokens` - Invalid token attempts
- `ExpiredVerificationTokens` - Expired token attempts
- `AlreadyVerifiedEmails` - Already verified attempts
- `UserNotFoundVerifications` - User not found errors
- `EmailVerificationErrors` - General errors
- `EmailVerificationSystemErrors` - System/unexpected errors

### CloudWatch Logs

Logs are written to: `/aws/lambda/verify-email-{environment}`

Key log entries:
- Email verification success
- Invalid token attempts
- Expired tokens
- System errors

## Security Considerations

1. **No User Enumeration**: Error messages don't reveal if user exists
2. **Token Security**: Tokens should be single-use and time-limited
3. **Rate Limiting**: Should be implemented at API Gateway level
4. **Audit Trail**: All verification attempts are logged

## Future Improvements

1. **Token Enhancement**:
   - Use JWT or encrypted tokens
   - Store tokens in database with expiration
   - Implement token rotation

2. **Rate Limiting**:
   - Limit verification attempts per email
   - Implement exponential backoff

3. **Email Template**:
   - Use AWS SES with custom templates
   - Support multiple languages
   - Include user's name in email

4. **Monitoring**:
   - Add CloudWatch alarms
   - Implement X-Ray tracing
   - Create dashboards

## Troubleshooting

### Common Issues

1. **"Invalid token" error**:
   - Check token format (email:code)
   - Verify code hasn't expired
   - Ensure email matches registration

2. **"Already verified" response**:
   - This is expected - endpoint is idempotent
   - User can proceed to login

3. **Database errors**:
   - Check DynamoDB table exists
   - Verify IAM permissions
   - Check table name in environment variables

### Debug Steps

1. Check CloudWatch logs for detailed errors
2. Verify Cognito User Pool configuration
3. Ensure Lambda has correct IAM permissions:
   - cognito-idp:ConfirmSignUp
   - cognito-idp:AdminGetUser
   - dynamodb:UpdateItem
   - dynamodb:Query
   - dynamodb:PutItem

## Related Documentation

- [Authentication Overview](../README.md)
- [User Registration](../register_user/README.md)
- [Login Flow](../login_user/README.md)
- [API Documentation](../../API_DOCUMENTATION.md)
