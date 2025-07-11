# Frontend Deployment Setup Guide

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** installed (v1.0+)
3. **AWS CLI** configured
4. **Node.js** (v18+) and npm
5. **Backend deployed** and API URL available

## Quick Start

### 1. Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd ai-lifestyle-app/frontend

# Install dependencies
npm install
```

### 2. Configure Terraform Backend

First, create the S3 bucket and DynamoDB table for Terraform state (one-time setup):

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket ai-lifestyle-app-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket ai-lifestyle-app-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name ai-lifestyle-app-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

### 3. Get Backend Configuration

Contact the backend team to get:
- API Gateway URL
- Cognito User Pool ID
- Cognito Client ID

### 4. Update Environment Configuration

Edit `terraform/environments/dev.tfvars`:

```hcl
# Update these values with actual backend outputs
api_url              = "https://your-api-id.execute-api.us-east-1.amazonaws.com"
cognito_user_pool_id = "us-east-1_xxxxxxxxx"
cognito_client_id    = "xxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 5. Deploy Infrastructure

```bash
cd terraform

# Initialize Terraform
terraform init -backend-config=backend-dev.conf

# Review the plan
terraform plan -var-file=environments/dev.tfvars

# Apply the configuration
terraform apply -var-file=environments/dev.tfvars

# Note the outputs, especially the CloudFront URL
```

### 6. Build and Deploy Frontend

```bash
# Generate environment config
chmod +x generate-env.sh
./generate-env.sh dev

# Build the frontend
cd ..
npm run build

# Deploy to S3
cd terraform
chmod +x deploy.sh
./deploy.sh dev
```

## Automated Deployment (GitHub Actions)

### Setup GitHub Secrets

Add these secrets to your GitHub repository:

For Development:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

For Production:
- `AWS_ACCESS_KEY_ID_PROD`
- `AWS_SECRET_ACCESS_KEY_PROD`

### Deployment Flow

1. **Pull Request**: Automatically deploys to dev environment
2. **Merge to Main**: Automatically deploys to production
3. **PR Closed**: Automatically cleans up dev environment

## Manual Commands

### Invalidate CloudFront Cache

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

### Check Deployment Status

```bash
cd terraform
terraform output
```

### Destroy Infrastructure

```bash
cd terraform
terraform destroy -var-file=environments/dev.tfvars
```

## Troubleshooting

### CORS Errors
- Check that the backend has whitelisted your CloudFront domain
- Verify the API URL is correct in your environment config
- Check browser console for specific CORS error messages

### 404 Errors on Routes
- This is normal for SPAs. The CloudFront distribution is configured to return index.html for 404s
- If you're still seeing issues, check the custom error pages configuration

### Build Errors
- Ensure you're using Node.js 18+
- Run `npm ci` to get a clean install
- Check that all environment variables are set

### Deployment Errors
- Verify AWS credentials are configured correctly
- Check that the S3 bucket name is unique
- Ensure you have the necessary AWS permissions

## Cost Optimization

For development environments:
- CloudFront: ~$0.01 per 10,000 requests
- S3: ~$0.023 per GB per month
- Data transfer: First 1GB free, then ~$0.09 per GB

To minimize costs:
- Use `PriceClass_100` for dev (fewer edge locations)
- Disable CloudFront logging for dev
- Set appropriate cache headers to reduce requests

## Next Steps

1. **Custom Domain**: Update `domain_name` in prod.tfvars
2. **Monitoring**: Set up CloudWatch alarms
3. **WAF**: Add AWS WAF for additional security
4. **CI/CD**: Customize GitHub Actions workflow as needed
