# Backend Scripts

This directory contains scripts for testing, deploying, and managing the AI Lifestyle App backend.

## Quick Start

1. **Check API Status**:
   ```powershell
   .\quick-validate.ps1
   ```

2. **Run Full Diagnostics**:
   ```powershell
   .\diagnose-api.ps1
   ```

3. **Deploy Latest Code**:
   ```powershell
   .\deploy-login-fix.ps1
   ```

## API Information

- **API URL**: `https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com`
- **API Gateway ID**: `3sfkg1mc0c`
- **AWS Region**: `us-east-1`

## Testing Scripts

### quick-validate.ps1
Quick validation test that checks:
- Health endpoint
- Registration validation
- Login endpoint availability

### test-registration-valid.ps1
Comprehensive registration testing:
- Valid user registration
- Duplicate email detection
- Password validation rules
- Name format validation
- Login with registered user

### test-login-fixed.ps1
Login endpoint testing:
- Valid credentials
- Invalid credentials
- Non-existent users
- Error handling

### test-api-quick.ps1
Basic API connectivity test:
- Health check
- Endpoint availability
- Error response validation

### test-api.ps1
Comprehensive API testing suite with interactive mode

## Diagnostic Scripts

### diagnose-api.ps1
Comprehensive system diagnostics:
- DNS resolution
- Lambda function status
- Recent Lambda logs
- API Gateway configuration
- ECR image status
- Connectivity tests

### check-deployment.ps1
Checks deployment status:
- Lambda configuration
- Environment variables
- Recent invocations

## Deployment Scripts

### deploy-login-fix.ps1
Deploys updated Lambda code:
- Builds Docker image
- Pushes to ECR
- Updates Lambda function
- Waits for deployment completion

### deploy-phased.sh
Phased deployment for infrastructure:
- Phase 1: Base infrastructure
- Phase 2: Docker images
- Phase 3: Lambda functions

## Usage Examples

### Full Testing Workflow
```powershell
# 1. Check if API is up
.\quick-validate.ps1

# 2. If issues, run diagnostics
.\diagnose-api.ps1

# 3. Deploy if needed
.\deploy-login-fix.ps1

# 4. Run full tests
.\test-registration-valid.ps1
.\test-login-fixed.ps1
```

### Troubleshooting Workflow
```powershell
# 1. Run diagnostics
.\diagnose-api.ps1

# 2. Check deployment status
.\check-deployment.ps1

# 3. View Lambda logs
aws logs tail /aws/lambda/api-handler-dev --since 10m

# 4. Deploy fixes if needed
.\deploy-login-fix.ps1
```

## Environment Variables

The scripts use these environment variables (with defaults):
- `AWS_REGION`: AWS region (default: us-east-1)
- `ENVIRONMENT`: Deployment environment (default: dev)

## Common Issues

### API Returns 502/503
- Lambda may not be deployed
- Lambda may be in error state
- Run `diagnose-api.ps1` for details

### Registration Works but Login Fails
- Cognito configuration issue
- Missing IAM permissions
- Check Lambda logs for details

### Cannot Connect to API
- DNS not resolving
- API Gateway not configured
- Lambda not deployed

## Script Requirements

- PowerShell 5.1 or later
- AWS CLI configured with credentials
- Docker installed (for deployment scripts)
- Internet connectivity

## Manual Testing with cURL

```bash
# Health check
curl https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/health

# Registration test
curl -X POST https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}'

# Login test
curl -X POST https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```
