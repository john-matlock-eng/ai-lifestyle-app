# MFA Setup Lambda Function

This Lambda function handles the MFA (Multi-Factor Authentication) setup for users.

## Overview

The MFA setup endpoint allows authenticated users to enable two-factor authentication using TOTP (Time-based One-Time Password). It generates a secret key and QR code that users can scan with their authenticator app.

## API Contract

### Endpoint: POST /auth/mfa/setup

**Authentication Required**: Yes (Bearer token)

**Request Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:** None

**Success Response (200):**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Error Responses:**

- **401 Unauthorized** - Missing or invalid authentication
```json
{
  "error": "UNAUTHORIZED",
  "message": "User authentication required",
  "request_id": "abc-123",
  "timestamp": "2024-01-20T10:00:00Z"
}
```

- **409 Conflict** - MFA already enabled
```json
{
  "error": "MFA_ALREADY_ENABLED",
  "message": "MFA is already enabled for this account",
  "request_id": "abc-123",
  "timestamp": "2024-01-20T10:00:00Z"
}
```

## Architecture

The function follows Clean Architecture principles:

```
setup_mfa/
├── handler.py          # Lambda entry point
├── service.py          # Business logic
├── repository.py       # DynamoDB operations
├── encryption.py       # Secret encryption utilities
├── models.py          # Pydantic models
├── errors.py          # Custom exceptions
├── Dockerfile         # Container configuration
└── requirements.txt   # Python dependencies
```

## Key Features

1. **TOTP Generation**: Uses pyotp to generate secure TOTP secrets
2. **QR Code Creation**: Generates QR codes for easy mobile app setup
3. **Secret Encryption**: Encrypts TOTP secrets before storing in DynamoDB
4. **Backup Codes**: Generates 8 backup codes for account recovery
5. **Idempotency**: Returns 409 if MFA is already enabled

## Security

- TOTP secrets are encrypted using AES-256-GCM before storage
- Encryption keys should be managed via AWS KMS in production
- Backup codes are stored separately and can only be used once
- All operations require valid JWT authentication

## Environment Variables

- `USERS_TABLE_NAME`: DynamoDB table name (default: 'users')
- `MFA_ENCRYPTION_KEY`: Key for encrypting secrets (use KMS in production)
- `ENVIRONMENT`: Deployment environment (dev/prod)
- `LOG_LEVEL`: Logging level (default: INFO)

## Data Storage

MFA data is stored in DynamoDB with the following structure:

```python
{
  'pk': 'USER#{user_id}',
  'sk': 'MFA#SECRET',
  'entity_type': 'MFA_SECRET',
  'encrypted_secret': '<encrypted_base64>',
  'iv': '<initialization_vector>',
  'backup_codes': ['ABCD-1234', 'EFGH-5678', ...],
  'backup_codes_used': [],
  'created_at': '2024-01-20T10:00:00Z',
  'updated_at': '2024-01-20T10:00:00Z'
}
```

## Testing

### Unit Tests

```bash
pytest tests/setup_mfa/
```

### Manual Testing

1. Get an access token by logging in
2. Call the endpoint:

```bash
curl -X POST https://api.ailifestyle.app/v1/auth/mfa/setup \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json"
```

3. Use the returned QR code or secret to set up your authenticator app

## Monitoring

### CloudWatch Metrics

- `MFASetupAttempts` - Total setup attempts
- `SuccessfulMFASetups` - Successful setups
- `MFAAlreadyEnabledErrors` - Attempts when already enabled
- `UnauthorizedMFASetupAttempts` - Unauthorized attempts
- `MFASetupErrors` - General errors
- `MFASetupSystemErrors` - System/unexpected errors

### CloudWatch Logs

Logs are written to: `/aws/lambda/setup-mfa-{environment}`

## Next Steps

After successful MFA setup, users must:
1. Scan the QR code with their authenticator app
2. Verify the setup using the `/auth/mfa/verify-setup` endpoint
3. Save backup codes in a secure location

## Related Endpoints

- `POST /auth/mfa/verify-setup` - Verify and enable MFA
- `POST /auth/mfa/verify` - Verify MFA code during login
- `POST /auth/mfa/disable` - Disable MFA

## Troubleshooting

### Common Issues

1. **"MFA already enabled"**: User has already set up MFA
2. **QR code not scanning**: Ensure authenticator app supports TOTP
3. **Invalid secret**: Secret may be corrupted, try setup again

### Debug Steps

1. Check CloudWatch logs for detailed errors
2. Verify JWT token is valid and contains user ID
3. Check DynamoDB for existing MFA records
4. Ensure encryption key is properly configured
