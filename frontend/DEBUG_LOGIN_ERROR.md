# Frontend-Backend Integration Debugging Guide

## Current Issue: 400 Bad Request on Login

### Error Details
- **URL**: `https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/login`
- **Status**: 400 Bad Request
- **Method**: POST

### Common Causes & Solutions

## 1. CORS Configuration
The most common cause for 400 errors in API Gateway is CORS misconfiguration.

**Check in AWS Console:**
1. Go to API Gateway → Your API
2. Select the `/auth/login` resource
3. Click on "Actions" → "Enable CORS"
4. Ensure these settings:
   - Access-Control-Allow-Origin: `*` (or your CloudFront URL)
   - Access-Control-Allow-Headers: `Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token`
   - Access-Control-Allow-Methods: `GET,POST,OPTIONS`

**Or add to your backend Lambda:**
```javascript
const response = {
  statusCode: 200,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
  },
  body: JSON.stringify(result)
};
```

## 2. API Path Mismatch
The frontend is calling `/auth/login` but the backend might expect a different path.

**Verify in API Gateway:**
- Check if the path is `/auth/login` or `/v1/auth/login` or something else
- Update your GitHub secret `DEV_API_URL` to include the stage name if needed:
  - Wrong: `https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com`
  - Right: `https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/dev`
  - Or: `https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/v1`

## 3. Request Body Format
The backend might be expecting a different request format.

**Frontend sends:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Backend might expect:**
```json
{
  "username": "user@example.com",  // Note: 'username' instead of 'email'
  "password": "password123"
}
```

## 4. Content-Type Header
Ensure the API Gateway is configured to accept `application/json`.

## Quick Debugging Steps

### 1. Test with curl
```bash
curl -X POST https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  -v
```

### 2. Check CloudWatch Logs
1. Go to AWS Console → CloudWatch → Log Groups
2. Find your API Gateway or Lambda logs
3. Look for the actual error message

### 3. Enable API Gateway Logging
1. Go to API Gateway → Your API → Stages → Your Stage
2. Enable CloudWatch Logs
3. Set Log Level to "INFO" or "ERROR"

### 4. Check API Gateway Method Request
1. Go to your `/auth/login` POST method
2. Check "Method Request" settings
3. Ensure "Request Validator" is set properly
4. Check if there are required headers or query parameters

## Temporary Frontend Fix

While debugging, you can add better error logging to the frontend:

```typescript
// In authService.ts, update the login method:
async login(data: LoginFormData & { rememberMe?: boolean }): Promise<LoginResponse | MfaRequiredResponse> {
  try {
    console.log('Login request:', { email: data.email }); // Don't log password
    const { data: response } = await apiClient.post<LoginResponse | MfaRequiredResponse>('/auth/login', {
      email: data.email,
      password: data.password,
    });
    console.log('Login response:', response);
    // ... rest of the code
  } catch (error) {
    console.error('Login error details:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    throw error;
  }
}
```

## Most Likely Solution

Based on the error, the most likely issues are:
1. **CORS not enabled** on the API Gateway
2. **Stage name missing** from the API URL
3. **Request format mismatch** (email vs username)

Start by checking these three items first!
