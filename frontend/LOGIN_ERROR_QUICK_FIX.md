# Quick Fix Guide for 400 Login Error

## The Issue
Your frontend is getting a 400 Bad Request error when trying to login to the backend API.

## Most Common Causes

### 1. ✅ CORS Not Enabled (Most Likely)
API Gateway needs CORS enabled for browser requests to work.

**Quick Fix in AWS Console:**
1. Go to API Gateway → Your API (`3sfkg1mc0c`)
2. Find `/auth/login` resource
3. Click "Actions" → "Enable CORS"
4. Deploy the API: "Actions" → "Deploy API"

### 2. ✅ Missing Stage in URL
Your API URL might be missing the stage name.

**Check your GitHub Secret:**
- Current: `https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com`
- Should be: `https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/dev` (or `/prod`, `/v1`, etc.)

### 3. ✅ Request Format Mismatch
The backend might expect different field names.

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
  "username": "user@example.com",  // 'username' instead of 'email'
  "password": "password123"
}
```

## Debug Tools Created

### 1. API Debugger Component
I've created a debug page you can use to test the API connection:

```typescript
// Add this route temporarily in App.tsx or your router:
import DebugPage from './pages/DebugPage';

// Add route:
<Route path="/debug" element={<DebugPage />} />
```

Then visit: `https://your-cloudfront-url/debug`

### 2. Check CloudWatch Logs
1. AWS Console → CloudWatch → Log Groups
2. Look for:
   - `/aws/api-gateway/your-api-name`
   - `/aws/lambda/your-auth-function`
3. Check the actual error details

## Immediate Actions

### Step 1: Enable CORS
```bash
# In AWS Console:
1. API Gateway → Your API
2. Select /auth/login → POST
3. Actions → Enable CORS
4. Actions → Deploy API → Select stage
```

### Step 2: Test with curl
```bash
# Test if the API works outside the browser:
curl -X POST https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}' \
  -v
```

### Step 3: Update API URL if needed
If you find the stage name is missing:
1. Go to GitHub → Settings → Secrets
2. Update `DEV_API_URL` to include the stage
3. Re-run the deployment workflow

## Expected API Gateway CORS Settings
```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
}
```

## Backend Lambda Fix (if needed)
If CORS headers aren't being returned, add this to your Lambda:

```javascript
exports.handler = async (event) => {
  // ... your logic
  
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(result)
  };
};
```

## Next Steps
1. Check CORS in API Gateway (this is usually the issue)
2. Verify the API URL includes the stage name
3. Use the debug page to test different endpoints
4. Check CloudWatch logs for detailed errors

The 400 error means your frontend is reaching the backend, so you're close! It's likely just a CORS or configuration issue.
