# Dev/Prod Deployment Architecture

## Overview
The AI Lifestyle App backend uses a phased deployment approach to handle the dependency between infrastructure and Docker images. This ensures resources are created in the correct order.

## Deployment Strategy

### Phased Deployment
The deployment happens in 3 phases to resolve the chicken-and-egg problem between ECR and Lambda:

1. **Phase 1: Base Infrastructure**
   - Creates ECR repository, Cognito User Pool, and DynamoDB tables
   - No Lambda functions deployed yet
   
2. **Phase 2: Docker Images**
   - Builds and pushes Docker images to the ECR repository
   - Images are tagged with environment and commit SHA
   
3. **Phase 3: Lambda Functions**
   - Deploys Lambda functions using the pushed images
   - Configures all environment variables and permissions

### GitHub Actions Workflow
The unified workflow (`deploy-backend-unified.yml`) handles all phases automatically:
- **Pull Request**: Deploys to `dev` environment
- **Merge to main**: Deploys to `prod` environment

## Deployment Flow

### Development Environment (dev)
- **Trigger**: Pull Request to main branch
- **Resources Created**:
  - ECR Repository: `lifestyle-app-dev`
  - Lambda Function: `api-handler-dev`
  - Cognito User Pool: `ai-lifestyle-users-dev`
  - DynamoDB Table: `users-dev`
- **Configuration**:
  - Log Level: DEBUG
  - CORS: * (allows all origins for testing)
  - API Endpoint: Will be created by API Gateway module

### Production Environment (prod)
- **Trigger**: Merge to main branch
- **Resources Created**:
  - ECR Repository: `lifestyle-app-prod`
  - Lambda Function: `api-handler-prod`
  - Cognito User Pool: `ai-lifestyle-users-prod`
  - DynamoDB Table: `users-prod`
- **Configuration**:
  - Log Level: INFO
  - CORS: https://ailifestyle.app only
  - API Endpoint: Will be created by API Gateway module

## Manual Deployment

For local testing or manual deployments:

```bash
# Deploy to dev environment
cd backend/scripts
./deploy-phased.sh dev

# Deploy to prod environment
./deploy-phased.sh prod $AWS_ACCOUNT_ID
```

## Architecture Decisions

### Single Lambda Approach
Instead of individual Lambda functions per endpoint, we use a single Lambda with internal routing:
- **Pros**: 
  - Reduced cold starts
  - Shared dependencies
  - Lower cost
  - Simpler deployment
- **Implementation**: `src/main.py` routes requests to appropriate handlers

### Shared ECR Repository
Each environment has one ECR repository with tagged images:
- `api-handler-dev-{commit-sha}`
- `api-handler-prod-{commit-sha}`

### Environment Isolation
Complete separation between environments:
- Different AWS resources (no sharing)
- Different Terraform state files
- Different IAM roles/policies
- No cross-environment access

## GitHub Actions Workflows

### deploy-backend-unified.yml
The main deployment workflow that:
1. Deploys base infrastructure with `deploy_lambda=false`
2. Builds and pushes Docker images to ECR
3. Deploys Lambda functions with `deploy_lambda=true`
4. Provides PR comments with deployment status

### Old Workflows (Deprecated)
- `deploy-backend.yml` - Only handles Terraform
- `build-lambda.yml` - Only handles Docker/Lambda

These are replaced by the unified workflow.

## Local Development

### Running Tests
```bash
cd backend
pytest tests/unit/test_register_user.py -v
```

### Building Docker Image Locally
```bash
cd backend
docker build -f Dockerfile.api-handler -t ai-lifestyle-api:local .
```

### Testing Lambda Locally
```bash
# Using AWS SAM CLI
sam local start-api --docker-file Dockerfile.api-handler
```

## Adding New Endpoints

1. Create handler in `src/{endpoint_name}/`
2. Import handler in `src/main.py`
3. Add route to the routes dictionary
4. Update `requirements.txt` if needed
5. Create PR to deploy to dev
6. After testing, merge to deploy to prod

## Monitoring

### CloudWatch Logs
- Log Groups: `/aws/lambda/api-handler-{env}`
- Structured logging with correlation IDs

### Metrics
- Lambda invocations, errors, duration
- Custom metrics for business events

### Alarms
- High error rate
- Throttling
- Long duration

## Security

### API Gateway
- Rate limiting: Configured per environment
- API keys: Optional for additional security
- WAF: Can be added for DDoS protection

### Lambda
- Least privilege IAM roles
- Environment-specific permissions
- No hardcoded secrets

### Data
- Encryption at rest (DynamoDB, S3)
- Encryption in transit (HTTPS only)
- No sensitive data in logs

## Cost Optimization

### Pay-per-use Services
- Lambda: Charged per invocation
- DynamoDB: On-demand pricing
- Cognito: Per monthly active user

### Cost Saving Strategies
- Single Lambda reduces overhead
- Shared ECR repository
- CloudWatch log retention limits
