# Frontend Deployment - Backend Integration Requirements

## Overview
The frontend is being deployed to AWS S3 + CloudFront. We need to coordinate with the backend team to ensure proper CORS configuration and environment-specific settings.

## Frontend URLs

### Development
- **CloudFront URL**: Will be generated dynamically (format: `https://[distribution-id].cloudfront.net`)
- **PR Preview URLs**: Each PR will get its own CloudFront distribution

### Production
- **Custom Domain**: `app.ailifestyle.example.com` (update as needed)
- **CloudFront Fallback**: `https://[distribution-id].cloudfront.net`

## CORS Configuration Required

The backend API Gateway needs to allow the following origins:

### Development Environment
```json
{
  "AllowedOrigins": [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:4173",
    "https://*.cloudfront.net"
  ],
  "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "AllowedHeaders": ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"],
  "ExposeHeaders": ["x-amzn-RequestId", "x-amzn-ErrorType"],
  "MaxAge": 3600,
  "AllowCredentials": true
}
```

### Production Environment
```json
{
  "AllowedOrigins": [
    "https://app.ailifestyle.example.com",
    "https://www.app.ailifestyle.example.com"
  ],
  "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  "AllowedHeaders": ["Content-Type", "Authorization", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"],
  "ExposeHeaders": ["x-amzn-RequestId", "x-amzn-ErrorType"],
  "MaxAge": 3600,
  "AllowCredentials": true
}
```

## Environment Variables Needed

The frontend needs the following environment variables from the backend:

1. **API_URL**: The API Gateway endpoint URL
2. **COGNITO_USER_POOL_ID**: Cognito User Pool ID
3. **COGNITO_CLIENT_ID**: Cognito App Client ID
4. **COGNITO_REGION**: AWS region for Cognito (usually us-east-1)

## Deployment Process

1. **Infrastructure First**: Backend deploys API Gateway and Cognito
2. **Share Outputs**: Backend provides the required environment variables
3. **Update Frontend Config**: Update the `terraform/environments/*.tfvars` files with the backend values
4. **Deploy Frontend**: Run the frontend deployment

## GitHub Actions Integration

The frontend uses GitHub Actions for CI/CD:
- **Pull Requests**: Deploy to dev environment with unique URL
- **Main Branch**: Deploy to production
- **PR Closure**: Cleanup dev environment

## Security Considerations

1. **API Keys**: Never commit API keys or secrets
2. **HTTPS Only**: All traffic is forced to HTTPS via CloudFront
3. **S3 Bucket**: Not publicly accessible, only CloudFront can access
4. **CloudFront OAC**: Using Origin Access Control for secure S3 access

## Testing Integration

To test the full integration:

1. Deploy backend to dev environment
2. Update frontend dev.tfvars with backend outputs
3. Create a PR to trigger frontend dev deployment
4. Test the following:
   - Authentication flow (login/register)
   - API calls (ensure no CORS errors)
   - WebSocket connections (if applicable)
   - File uploads (if applicable)

## Monitoring

Both teams should monitor:
- CloudWatch logs for API Gateway
- CloudFront access logs
- Browser console for CORS errors
- Network tab for failed requests

## Contact

Frontend deployment issues: [Frontend Team]
Backend API issues: [Backend Team]
Infrastructure: [DevOps Team]
