# AI Lifestyle App - Backend API Documentation

## Base URL
```
https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com
```

## Available Endpoints

### 1. Health Check
Check if the API is running.

**Request:**
```http
GET /health
```

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-02T00:00:00Z"
}
```

---

### 2. User Registration
Create a new user account.

**Request:**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "Jane",
  "lastName": "Doe"
}
```

**Validation Rules:**
- Email: Valid email format, must be unique
- Password: Min 8 chars, must include uppercase, lowercase, number, and special character
- Names: Letters, spaces, and hyphens only (no numbers or special characters)

**Success Response (201):**
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "email": "user@example.com",
  "message": "Registration successful. Please check your email to verify your account."
}
```

**Error Responses:**

*Validation Error (400):*
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
  "request_id": "abc-123",
  "timestamp": "2025-07-02T00:00:00Z"
}
```

*Email Already Exists (409):*
```json
{
  "error": "USER_ALREADY_EXISTS",
  "message": "Email address is already registered",
  "request_id": "abc-123",
  "timestamp": "2025-07-02T00:00:00Z"
}
```

---

### 3. User Login
Authenticate and get access tokens.

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "emailVerified": true,
    "mfaEnabled": false,
    "createdAt": "2025-07-01T00:00:00Z",
    "updatedAt": "2025-07-02T00:00:00Z"
  }
}
```

**MFA Required Response (200):**
```json
{
  "sessionToken": "temp-session-123",
  "mfaRequired": true,
  "tokenType": "Bearer"
}
```
*Note: MFA verification endpoint not yet implemented*

**Error Responses:**

*Invalid Credentials (401):*
```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "request_id": "abc-123",
  "timestamp": "2025-07-02T00:00:00Z"
}
```

*Account Not Verified (403):*
```json
{
  "error": "ACCOUNT_NOT_VERIFIED",
  "message": "Please verify your email address before logging in",
  "request_id": "abc-123",
  "timestamp": "2025-07-02T00:00:00Z"
}
```

---

## Authentication

After successful login, include the access token in subsequent requests:

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Error Response Format

All errors follow this format:
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "details": { ... },  // Optional
  "request_id": "unique-id",
  "timestamp": "2025-07-02T00:00:00Z"
}
```

## Common Status Codes
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (invalid credentials)
- 403: Forbidden (account not verified)
- 409: Conflict (resource already exists)
- 429: Too Many Requests (rate limited)
- 500: Internal Server Error

## CORS
CORS is enabled for all origins in development. No special headers needed.

## Rate Limiting
Not currently enforced, but the API will return 429 status codes when implemented.

## Testing

PowerShell test scripts are available in `/backend/scripts/`:
```powershell
# Quick API validation
.\quick-validate.ps1

# Test registration flow
.\test-registration-valid.ps1

# Test login flow
.\test-login-fixed.ps1
```

## Coming Soon
- POST /auth/refresh - Refresh access token
- POST /auth/verify-email - Verify email address
- GET /users/profile - Get user profile
- PUT /users/profile - Update user profile
- POST /auth/mfa/verify - Verify MFA code
- POST /auth/password/reset - Request password reset

## Support
For issues or questions, check:
1. CloudWatch Logs (AWS Console)
2. `/backend/scripts/diagnose-api.ps1` for diagnostics
3. OpenAPI contract at `/contract/openapi.yaml`
