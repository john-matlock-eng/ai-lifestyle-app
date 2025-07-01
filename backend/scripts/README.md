# Backend Scripts

This directory contains utility scripts for backend operations.

## Scripts

### deploy-phased.sh
Manually deploy the backend infrastructure in phases. This script mirrors what the GitHub Actions workflow does automatically.

```bash
# Make executable
chmod +x deploy-phased.sh

# Deploy to dev
./deploy-phased.sh dev

# Deploy to prod with specific AWS account
./deploy-phased.sh prod 123456789012
```

The script will:
1. Deploy base infrastructure (ECR, Cognito, DynamoDB)
2. Build and push Docker images
3. Deploy Lambda functions

## Requirements
- AWS CLI configured with appropriate credentials
- Docker installed and running
- Terraform 1.9+
- Bash shell
