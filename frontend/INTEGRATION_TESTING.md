# AWS API Integration Testing Guide

## 🚀 Integration Status

The frontend is now configured to use the real AWS APIs for authentication!

### ✅ Deployed Endpoints (Now Live on AWS)
1. `GET /health` - Health check
2. `POST /auth/register` - User registration  
3. `POST /auth/login` - User login
4. `POST /auth/refresh` - Token refresh
5. `GET /users/profile` - Get user profile

### 🔧 Changes Made
1. **API Base URL Updated**: Changed from `http://localhost:4000/v1` to `https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com`
2. **MSW Mocks Disabled**: Commented out mocks for the 5 deployed endpoints

## 📋 Testing Checklist

### Prerequisites
1. **Restart Dev Server**: After the environment variable change
   ```bash
   npm run dev
   ```

### 1. Health Check Test
```javascript
// Open browser console and run:
fetch('https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/health')
  .then(r => r.json())
  .then(console.log)

// Expected: { status: 'healthy', timestamp: '...', version: '1.0.0' }
```

### 2. Registration Flow Test
1. Navigate to http://localhost:3000/register
2. Fill in the form:
   - Email: Use a unique email (e.g., `test_${Date.now()}@example.com`)
   - Password: Must have uppercase, lowercase, number, and special char (e.g., `TestPass123!`)
   - First Name: Letters only (e.g., `John`)
   - Last Name: Letters only (e.g., `Doe`)
3. Submit the form
4. **Expected**: Success page with email verification message
5. **Check console**: Should see successful API call to AWS

### 3. Login Flow Test  
1. Navigate to http://localhost:3000/login
2. Use the credentials from registration
3. Submit the form
4. **Expected**: 
   - JWT tokens stored in cookies
   - Redirect to dashboard
   - User profile data displayed

### 4. Dashboard Profile Test
1. After successful login, check the dashboard
2. **Expected**: Real user data displayed (name, email, etc.)
3. Open DevTools Network tab
4. **Verify**: GET request to `/users/profile` returns your user data

### 5. Token Refresh Test
1. Open DevTools Console
2. Run this to test token refresh:
   ```javascript
   import { refreshAccessToken } from './features/auth/utils/tokenManager';
   refreshAccessToken().then(console.log);
   ```
3. **Expected**: New access token returned

### 6. Protected Routes Test
1. Clear cookies/localStorage to logout
2. Try to access http://localhost:3000/dashboard
3. **Expected**: Redirect to login page
4. Login again
5. **Expected**: Can access dashboard

## 🐛 Troubleshooting

### CORS Errors
If you see CORS errors:
1. The backend should have CORS configured
2. Try using the browser in incognito mode
3. Clear all cookies/cache for localhost

### 401 Unauthorized
If you get 401 errors:
1. Check that the token format includes "Bearer " prefix
2. Verify tokens are being stored correctly
3. Check token expiration (1 hour for access token)

### Name Validation Errors
The backend only accepts letters, spaces, and hyphens in names:
- ✅ Valid: "John", "Mary-Jane", "De La Cruz"
- ❌ Invalid: "John123", "Test!", "User_1"

### Network Errors
If requests fail:
1. Verify the API Gateway URL is correct
2. Check if the Lambda functions are running
3. Look at CloudWatch logs for errors

## 📊 Expected API Responses

### Registration Success (201)
```json
{
  "userId": "uuid-here",
  "email": "user@example.com",
  "message": "Registration successful. Please check your email to verify your account."
}
```

### Login Success (200)
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "userId": "uuid-here",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailVerified": false,
    "mfaEnabled": false,
    "createdAt": "2025-01-07T...",
    "updatedAt": "2025-01-07T..."
  }
}
```

### Common Error Responses

#### Validation Error (400)
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "validation_errors": [
    {
      "field": "lastName",
      "message": "Last name can only contain letters, spaces, and hyphens"
    }
  ],
  "timestamp": "2025-01-07T..."
}
```

#### Duplicate Email (409)
```json
{
  "error": "EMAIL_EXISTS",
  "message": "An account with this email already exists",
  "timestamp": "2025-01-07T..."
}
```

## 🎯 Next Steps

Once all tests pass:
1. Report any issues found
2. Test edge cases (network failures, expired tokens)
3. Verify auto-refresh works before token expiry
4. Prepare for Week 2 features (2FA, password reset)

## 📝 Notes

- Email verification is implemented but NOT enforced (7-day grace period)
- MFA/2FA endpoints are still using MSW mocks (not deployed yet)
- Password reset endpoints are not implemented yet
- Session length: 1 hour access token, 30-day refresh token

---

**Report any integration issues immediately so they can be resolved quickly!**
