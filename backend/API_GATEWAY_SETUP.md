# Adding API Gateway

## What We're Doing

We're adding API Gateway to expose your Lambda function as HTTP endpoints. This will make your authentication API publicly accessible.

## Changes Made

### 1. Created API Gateway Module
- `terraform/modules/api-gateway/` - Reusable API Gateway configuration
- HTTP API (v2) for cost efficiency
- CORS configuration for browser access
- CloudWatch logging enabled
- Rate limiting configured (100 req/s default)

### 2. Updated Main Terraform
Added API Gateway to `terraform/main.tf` with:
- All authentication routes defined
- CORS configured (allow all origins for dev)
- JWT authorizer ready but disabled (for future)
- Proper Lambda integration

### 3. Created Test Script
- `scripts/test-api.sh` - Easy testing of all endpoints

## Deployment Steps

1. **Deploy the API Gateway**:
   ```bash
   cd backend/terraform
   terraform apply -var="environment=dev" -var="aws_account_id=$AWS_ACCOUNT_ID"
   ```

2. **Get the API Endpoint**:
   ```bash
   terraform output api_endpoint
   ```

3. **Test the Endpoints**:
   ```bash
   cd ../scripts
   chmod +x test-api.sh
   ./test-api.sh
   ```

## Routes Created

### Public Endpoints (No Auth Required)
- `GET /health` - Health check
- `POST /auth/register` - User registration ✅
- `POST /auth/login` - User login (not implemented yet)
- `POST /auth/refresh` - Token refresh (not implemented yet)
- `POST /auth/password/reset-request` - Password reset
- `POST /auth/password/reset-confirm` - Password reset confirm
- `POST /auth/email/verify` - Email verification

### Protected Endpoints (Auth Required - Currently Disabled)
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile
- `POST /auth/mfa/setup` - Setup 2FA
- `POST /auth/mfa/verify-setup` - Verify 2FA setup
- `POST /auth/mfa/verify` - Verify 2FA code
- `POST /auth/mfa/disable` - Disable 2FA

## What to Expect

After deployment, you'll get an API endpoint like:
```
https://abc123.execute-api.us-east-1.amazonaws.com
```

You can then access your endpoints:
- `https://abc123.execute-api.us-east-1.amazonaws.com/health`
- `https://abc123.execute-api.us-east-1.amazonaws.com/auth/register`

## Testing with curl

```bash
# Health check
curl https://your-api-id.execute-api.us-east-1.amazonaws.com/health

# Register a user
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## Monitoring

Check these in AWS Console:
- **API Gateway**: See all routes and integrations
- **CloudWatch Logs**: `/aws/api-gateway/ai-lifestyle-dev`
- **CloudWatch Metrics**: Request count, latency, errors

## Next Steps

1. Deploy and test the API Gateway
2. Verify registration works end-to-end
3. Implement login endpoint (Task B2)
4. Add JWT authorization to protected routes
