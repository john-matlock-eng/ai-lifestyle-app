# First Time Deployment Instructions

Since this is your first deployment, follow these steps to handle the phased deployment correctly:

## 1. Fix IAM Permissions

The GitHub Actions role needs Cognito permissions. Ask your AWS administrator to:
1. Review the policy in `terraform/iam-policy-terraform-deployer.md`
2. Add the Cognito permissions to the `terraform-deployer-ai-lifestyle` role

## 2. Deploy in Phases

### Option A: Using GitHub Actions (Recommended)
The `deploy-backend-unified.yml` workflow handles this automatically.

### Option B: Manual Deployment
```bash
# Phase 1: Infrastructure only (no Lambda)
cd backend/terraform
terraform apply -var="deploy_lambda=false" -var="environment=dev" -var="aws_account_id=YOUR_ACCOUNT_ID"

# Phase 2: Build and push Docker images
cd ..
./scripts/deploy-phased.sh dev

# Phase 3: Deploy Lambda
cd terraform
terraform apply -var="deploy_lambda=true" -var="environment=dev" -var="aws_account_id=YOUR_ACCOUNT_ID"
```

## 3. Current Status

The Terraform configuration is set with `deploy_lambda = false` by default to allow the first phase to succeed.

## Common Issues

1. **Cognito Permission Error**: The IAM role needs the permissions listed in `iam-policy-terraform-deployer.md`
2. **Lambda Module Outputs**: Fixed - now using correct attribute names (`function_arn` not `lambda_function_arn`)
3. **ECR Repository Not Found**: Must complete Phase 1 before building images

## Next Steps

1. Get IAM permissions fixed
2. Run the deployment (it will only create ECR, Cognito, and DynamoDB)
3. Build and push Docker images
4. Re-run with `deploy_lambda=true`
