# Frontend Integration Guide - AI Lifestyle App

## Quick Start

### API Base URL
```
https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com
```

### Available Endpoints
1. `GET /health` - Check API status
2. `POST /auth/register` - Create new account  
3. `POST /auth/login` - Login and get tokens

## Integration Examples

### 1. Registration

```javascript
const register = async (userData) => {
  const response = await fetch('https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName
    })
  });

  const data = await response.json();

  if (!response.ok) {
    // Handle errors
    if (response.status === 400 && data.validation_errors) {
      // Show validation errors to user
      console.error('Validation errors:', data.validation_errors);
    } else if (response.status === 409) {
      // Email already exists
      console.error('Email already registered');
    }
    throw new Error(data.message || 'Registration failed');
  }

  // Success! 
  // data = { userId, email, message }
  return data;
};
```

### 2. Login

```javascript
const login = async (email, password) => {
  const response = await fetch('https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Invalid email or password');
    }
    throw new Error(data.message || 'Login failed');
  }

  // Check if MFA is required
  if (data.mfaRequired) {
    // Store session token and redirect to MFA page
    // Note: MFA verification endpoint not ready yet
    return { mfaRequired: true, sessionToken: data.sessionToken };
  }

  // Success! Store tokens securely
  // data = { accessToken, refreshToken, expiresIn, user }
  localStorage.setItem('accessToken', data.accessToken);
  localStorage.setItem('refreshToken', data.refreshToken);
  
  return data;
};
```

### 3. Making Authenticated Requests

```javascript
const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Example: Get user profile (endpoint coming soon)
const getUserProfile = async () => {
  const response = await fetch('https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/users/profile', {
    headers: getAuthHeaders()
  });
  
  if (response.status === 401) {
    // Token expired - need to refresh (endpoint coming soon)
    // For now, redirect to login
    redirectToLogin();
  }
  
  return response.json();
};
```

## Form Validation Rules

### Registration Form
```javascript
const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Valid email required'
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Min 8 chars with uppercase, lowercase, number, and special character'
  },
  firstName: {
    required: true,
    pattern: /^[a-zA-Z\s-]+$/,
    maxLength: 50,
    message: 'Letters, spaces, and hyphens only'
  },
  lastName: {
    required: true,
    pattern: /^[a-zA-Z\s-]+$/,
    maxLength: 50,
    message: 'Letters, spaces, and hyphens only'
  }
};
```

## Error Handling

### Standard Error Response
```javascript
{
  "error": "ERROR_CODE",
  "message": "Human readable message",
  "request_id": "abc-123",
  "timestamp": "2025-07-02T00:00:00Z"
}
```

### Validation Error Response
```javascript
{
  "error": "VALIDATION_ERROR",
  "message": "Validation failed",
  "validation_errors": [
    {
      "field": "password",
      "message": "Password must contain at least one special character"
    }
  ]
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Invalid input (400)
- `USER_ALREADY_EXISTS` - Email taken (409)
- `INVALID_CREDENTIALS` - Wrong email/password (401)
- `ACCOUNT_NOT_VERIFIED` - Need email verification (403)
- `RATE_LIMIT_EXCEEDED` - Too many attempts (429)

## Token Management

### Storage Recommendations
```javascript
// Option 1: localStorage (simple but less secure)
localStorage.setItem('accessToken', token);

// Option 2: sessionStorage (more secure, clears on tab close)
sessionStorage.setItem('accessToken', token);

// Option 3: httpOnly cookie (most secure, needs backend support)
// Not yet implemented

// Option 4: In-memory (very secure, lost on refresh)
window.authTokens = { accessToken, refreshToken };
```

### Token Expiry
- Access Token: 1 hour
- Refresh Token: 30 days

**Note**: Token refresh endpoint coming soon. For now, redirect to login when token expires.

## CORS
No CORS issues - API allows all origins in development.

## Testing Your Integration

### 1. Test Data
```javascript
const testUser = {
  email: `test.${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};
```

### 2. API Test Scripts
Available in `/backend/scripts/`:
- `quick-validate.ps1` - Quick health check
- `test-registration-valid.ps1` - Test registration
- `test-login-fixed.ps1` - Test login

### 3. Manual Testing
Use Postman, Insomnia, or curl to test endpoints directly.

## Coming Soon

These endpoints are not ready yet but will be needed:

1. **Token Refresh** - `POST /auth/refresh`
   - Needed to keep users logged in
   - ETA: 2-3 days

2. **Email Verification** - `POST /auth/verify-email`
   - Needed to activate accounts
   - ETA: 2-3 days

3. **Get User Profile** - `GET /users/profile`
   - Needed to display user info
   - ETA: 2-3 days

## UI/UX Recommendations

1. **Registration**
   - Show password requirements upfront
   - Real-time validation feedback
   - Clear error messages for duplicate emails

2. **Login**
   - "Remember me" checkbox (store refresh token)
   - "Forgot password" link (coming soon)
   - Handle MFA flow (show code input when needed)

3. **General**
   - Show loading states during API calls
   - Handle network errors gracefully
   - Auto-logout on 401 errors

## Questions?

- API Documentation: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- OpenAPI Contract: [../contract/openapi.yaml](../contract/openapi.yaml)
- Test Scripts: [/backend/scripts/](./scripts/)

Happy coding! 🚀
