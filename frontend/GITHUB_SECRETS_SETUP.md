# GitHub Secrets Setup for Frontend CI/CD

## Overview
The frontend CI/CD workflow now uses GitHub secrets to manage environment-specific configuration values. This provides better security and flexibility compared to hardcoding values in the workflow file.

## Required Secrets

### Development Environment
- `DEV_API_URL` - The API Gateway URL for your dev backend
- `DEV_COGNITO_USER_POOL_ID` - Cognito User Pool ID for dev
- `DEV_COGNITO_CLIENT_ID` - Cognito App Client ID for dev

### Production Environment  
- `PROD_API_URL` - The API Gateway URL for your production backend
- `PROD_COGNITO_USER_POOL_ID` - Cognito User Pool ID for production
- `PROD_COGNITO_CLIENT_ID` - Cognito App Client ID for production

### Shared Secrets (Already Set)
- `AWS_ACCOUNT_ID` - Your AWS account ID (already configured for OIDC)

## How to Set Up GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its name and value

### Example Values

#### Development Secrets
```
Name: DEV_API_URL
Value: https://abc123dev.execute-api.us-east-1.amazonaws.com/v1

Name: DEV_COGNITO_USER_POOL_ID  
Value: us-east-1_AbCdEfGhI

Name: DEV_COGNITO_CLIENT_ID
Value: 1234567890abcdefghijklmnop
```

#### Production Secrets
```
Name: PROD_API_URL
Value: https://xyz789prod.execute-api.us-east-1.amazonaws.com/v1

Name: PROD_COGNITO_USER_POOL_ID
Value: us-east-1_XyZ123456  

Name: PROD_COGNITO_CLIENT_ID
Value: abcdefghijklmnop1234567890
```

## Getting Backend Values

### Option 1: From AWS Console
1. **API Gateway URL**: 
   - Go to AWS Console → API Gateway
   - Select your API
   - Go to Stages → Select your stage
   - Copy the Invoke URL

2. **Cognito Values**:
   - Go to AWS Console → Cognito
   - Select your User Pool
   - Copy the User Pool ID
   - Go to App Integration → App Clients
   - Copy the Client ID

### Option 2: From Backend Terraform Outputs
If your backend was deployed with Terraform:
```bash
cd backend/terraform
terraform output api_endpoint
terraform output cognito_user_pool_id
terraform output cognito_client_id
```

## Benefits of Using Secrets

1. **Security**: Sensitive values are not exposed in code
2. **Flexibility**: Easy to update without changing workflow files
3. **Environment Separation**: Different values for dev/prod
4. **No Code Changes**: Update backend URLs without committing changes
5. **Access Control**: Only repository admins can view/modify secrets

## Testing Your Setup

After adding the secrets:
1. Create a pull request to trigger the dev deployment
2. Check the "Generate environment config" step in the workflow
3. Verify that the values show as `***` (masked) in the logs
4. The actual values will be used in the build

## Temporary Values

If your backend isn't deployed yet, you can use temporary values:
```
DEV_API_URL=https://api-dev.example.com
DEV_COGNITO_USER_POOL_ID=temp-dev-pool-id
DEV_COGNITO_CLIENT_ID=temp-dev-client-id
```

The frontend will build successfully with these placeholders, and you can update them later when the backend is ready.

## Local Development

For local development, create a `.env.local` file:
```env
VITE_ENVIRONMENT=dev
VITE_APP_NAME=AI Lifestyle App - Development
VITE_API_URL=http://localhost:3001
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=your-dev-pool-id
VITE_COGNITO_CLIENT_ID=your-dev-client-id
VITE_ENABLE_MSW=true
VITE_DEBUG=true
```

This file is git-ignored and won't be committed to the repository.
