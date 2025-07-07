# Environment Configuration Fix

## Issue
The `generate-env.sh` script was failing in CI/CD because it was trying to read Terraform outputs that might not be available yet.

## Solution
Updated the CI/CD workflow to create the .env.production file directly with placeholder values instead of relying on Terraform outputs during the build process.

## Changes Made

### 1. Updated CI/CD Workflow
Instead of running `generate-env.sh`, the workflow now creates the .env.production file directly:

```yaml
- name: Generate environment config
  working-directory: frontend
  run: |
    cat > .env.production << EOF
    VITE_ENVIRONMENT=dev
    VITE_APP_NAME=AI Lifestyle App - Development
    VITE_API_URL=https://api-dev.example.com
    VITE_COGNITO_REGION=us-east-1
    VITE_COGNITO_USER_POOL_ID=placeholder
    VITE_COGNITO_CLIENT_ID=placeholder
    VITE_ENABLE_MSW=false
    VITE_DEBUG=false
    EOF
```

### 2. Created Alternative Scripts
- **generate-env.sh**: Enhanced version that handles missing Terraform state
- **generate-env-simple.sh**: Simplified version that doesn't require Terraform

## Why This Approach?

1. **Reliability**: The build process doesn't depend on Terraform state being available
2. **Flexibility**: Easy to update values without running Terraform
3. **Speed**: No need to query Terraform outputs during build
4. **Placeholder Values**: The frontend can build with placeholder values and be updated later

## Next Steps

Once the backend is deployed and you have actual values for:
- API Gateway URL
- Cognito User Pool ID
- Cognito Client ID

You can update the workflow to use the actual values instead of placeholders.

## Local Development

For local development, create a `.env.local` file in the frontend directory:

```bash
VITE_ENVIRONMENT=dev
VITE_APP_NAME=AI Lifestyle App - Development
VITE_API_URL=http://localhost:3001
VITE_COGNITO_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=your-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_ENABLE_MSW=true
VITE_DEBUG=true
```
