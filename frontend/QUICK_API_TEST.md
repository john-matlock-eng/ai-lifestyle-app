# Quick Integration Test Commands

Run these commands in your browser console to test the AWS API integration:

## 1. Test Health Check
```javascript
fetch('https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## 2. Test Registration (run this in console while on the site)
```javascript
const testEmail = `test_${Date.now()}@example.com`;
const testData = {
  email: testEmail,
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User'
};

fetch('https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
})
.then(r => r.json())
.then(data => {
  console.log('Registration successful:', data);
  console.log('Use these credentials to login:', testEmail, 'TestPass123!');
})
.catch(console.error)
```

## 3. Test Login (use email from registration)
```javascript
// Replace with the email from step 2
const loginData = {
  email: 'YOUR_TEST_EMAIL',
  password: 'TestPass123!'
};

fetch('https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(loginData)
})
.then(r => r.json())
.then(data => {
  if (data.accessToken) {
    console.log('Login successful!');
    console.log('Access token:', data.accessToken.substring(0, 20) + '...');
    console.log('User:', data.user);
    // Store for next test
    window.testAccessToken = data.accessToken;
    window.testRefreshToken = data.refreshToken;
  }
})
.catch(console.error)
```

## 4. Test Get Profile (after login)
```javascript
if (!window.testAccessToken) {
  console.error('Please run the login test first!');
} else {
  fetch('https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/users/profile', {
    headers: { 
      'Authorization': `Bearer ${window.testAccessToken}`
    }
  })
  .then(r => r.json())
  .then(data => {
    console.log('Profile retrieved:', data);
  })
  .catch(console.error)
}
```

## 5. Test Token Refresh
```javascript
if (!window.testRefreshToken) {
  console.error('Please run the login test first!');
} else {
  fetch('https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: window.testRefreshToken })
  })
  .then(r => r.json())
  .then(data => {
    console.log('Token refreshed!');
    console.log('New access token:', data.accessToken.substring(0, 20) + '...');
    window.testAccessToken = data.accessToken;
  })
  .catch(console.error)
}
```

## Expected Results:

✅ Health check returns: `{ status: 'healthy', ... }`
✅ Registration returns: `{ userId: "...", email: "...", message: "..." }`
✅ Login returns: `{ accessToken: "...", refreshToken: "...", user: {...} }`
✅ Profile returns: User data matching login response
✅ Refresh returns: `{ accessToken: "...", tokenType: "Bearer", expiresIn: 3600 }`

## Common Issues:

❌ CORS error? Backend should have CORS configured
❌ 400 error? Check name validation (letters only)
❌ 409 error? Email already registered
❌ 401 error? Token expired or invalid format
