# 🚀 Next Steps: Deploy API Gateway

## Step 1: Deploy API Gateway

The API Gateway configuration is ready. Deploy it using one of these methods:

### Option A: GitHub Actions (Recommended)
Simply push your changes or create a PR. The `backend-deploy.yml` workflow will automatically deploy the API Gateway along with everything else.

### Option B: Manual Deployment
```bash
cd backend/terraform
terraform apply -var="environment=dev" -var="aws_account_id=$AWS_ACCOUNT_ID"
```

## Step 2: Get Your API Endpoint

After deployment completes:

```bash
# Get the API endpoint URL
terraform output api_endpoint

# You should see something like:
# https://abc123xyz.execute-api.us-east-1.amazonaws.com
```

## Step 3: Test the Registration Endpoint

### Using the Test Script (Easiest)
```bash
cd backend/scripts
chmod +x test-api.sh
./test-api.sh
```

### Using curl Manually
```bash
# Set your API endpoint
API_ENDPOINT="https://your-api-id.execute-api.us-east-1.amazonaws.com"

# Test health check
curl $API_ENDPOINT/health

# Test registration
curl -X POST $API_ENDPOINT/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Using Postman
1. Create a new POST request
2. URL: `https://your-api-id.execute-api.us-east-1.amazonaws.com/auth/register`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
}
```

## What Success Looks Like

### Successful Registration (201)
```json
{
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "email": "test@example.com",
    "message": "Registration successful. Please check your email to verify your account."
}
```

### Duplicate Email (409)
```json
{
    "error": "USER_ALREADY_EXISTS",
    "message": "Email address is already registered",
    "request_id": "...",
    "timestamp": "2025-07-01T..."
}
```

### Invalid Password (400)
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
    "request_id": "...",
    "timestamp": "2025-07-01T..."
}
```

## Verify in AWS Console

1. **API Gateway**
   - Go to API Gateway → APIs
   - Find `ai-lifestyle-dev`
   - Check Routes tab - should see all defined routes

2. **CloudWatch Logs**
   - Go to CloudWatch → Log groups
   - Check `/aws/lambda/api-handler-dev` for Lambda logs
   - Check `/aws/api-gateway/ai-lifestyle-dev` for API logs

3. **Cognito User Pool**
   - Go to Cognito → User pools
   - Find `ai-lifestyle-users-dev`
   - Check Users tab for newly registered users

4. **DynamoDB**
   - Go to DynamoDB → Tables
   - Find `users-dev`
   - Explore table items to see user records

## Troubleshooting

### "Forbidden" or "Not Found" errors
- Check that the API Gateway was deployed successfully
- Verify the endpoint URL is correct
- Ensure the route exists in API Gateway

### "Internal Server Error"
- Check CloudWatch logs for the Lambda function
- Look for permission issues or missing environment variables

### Registration succeeds but no email received
- Cognito uses AWS's default email service
- Check spam folder
- For production, configure SES for better deliverability

## Ready for Task B2?

Once you've confirmed registration is working:
1. ✅ API Gateway deployed
2. ✅ Registration endpoint tested
3. ✅ User created in Cognito
4. ✅ User record in DynamoDB

You're ready to implement the login endpoint!
