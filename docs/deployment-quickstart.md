# AWS Deployment Quickstart Guide

## 🚀 Overview
This guide provides step-by-step instructions to deploy the AI Lifestyle App authentication system to AWS.

## 📋 Prerequisites

### Required Tools
```bash
# Install required tools
brew install terraform awscli node

# Install Python for Lambda development
brew install python@3.11

# Verify installations
terraform version  # Should be 1.5+
aws --version     # Should be 2.x
node --version    # Should be 18+
python3 --version # Should be 3.11+
```

### AWS Account Setup
1. Create AWS account if needed
2. Create IAM user with programmatic access
3. Attach `AdministratorAccess` policy (for initial setup)
4. Configure AWS CLI:
```bash
aws configure --profile ailifestyle-dev
# Enter Access Key ID
# Enter Secret Access Key
# Default region: us-east-1
# Default output: json
```

### Domain Setup (Route 53)
1. Register domain or transfer existing
2. Create hosted zone in Route 53
3. Update nameservers at registrar

## 🏗️ Infrastructure Deployment

### Step 1: Initialize Backend Infrastructure
```bash
cd backend/terraform/environments/dev

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
project_name = "ailifestyle"
environment = "dev"
aws_region = "us-east-1"
domain_name = "ailifestyleapp.com"
EOF

# Initialize Terraform
terraform init

# Create infrastructure plan
terraform plan -out=tfplan

# Apply infrastructure
terraform apply tfplan
```

### Step 2: Deploy Lambda Functions
```bash
cd backend

# Build all Lambda containers
make build-all

# Push to ECR
make push-all ENV=dev

# Deploy functions
make deploy-lambdas ENV=dev
```

### Step 3: Configure Cognito
```bash
# The Terraform should have created the user pool
# Verify in AWS Console and note the IDs

# Export for frontend
export REACT_APP_COGNITO_USER_POOL_ID=$(terraform output -raw cognito_user_pool_id)
export REACT_APP_COGNITO_CLIENT_ID=$(terraform output -raw cognito_client_id)
```

## 🎨 Frontend Deployment

### Step 1: Build Frontend
```bash
cd frontend

# Install dependencies
npm install

# Create .env.production
cat > .env.production <<EOF
REACT_APP_API_URL=https://api.ailifestyleapp.com/v1
REACT_APP_COGNITO_REGION=us-east-1
REACT_APP_COGNITO_USER_POOL_ID=${REACT_APP_COGNITO_USER_POOL_ID}
REACT_APP_COGNITO_CLIENT_ID=${REACT_APP_COGNITO_CLIENT_ID}
EOF

# Build production bundle
npm run build
```

### Step 2: Deploy to S3
```bash
# Get S3 bucket name from Terraform
cd ../backend/terraform/environments/dev
export S3_BUCKET=$(terraform output -raw frontend_bucket_name)

# Upload frontend
cd ../../../frontend
aws s3 sync dist/ s3://${S3_BUCKET}/ --delete --profile ailifestyle-dev
```

### Step 3: Configure CloudFront
```bash
# Get CloudFront distribution ID
cd ../backend/terraform/environments/dev
export DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)

# Create cache invalidation
aws cloudfront create-invalidation \
  --distribution-id ${DISTRIBUTION_ID} \
  --paths "/*" \
  --profile ailifestyle-dev
```

## 🔍 Verification Steps

### 1. Check Infrastructure
```bash
# List all resources
terraform state list

# Check API Gateway
aws apigatewayv2 get-apis --profile ailifestyle-dev

# Check Lambda functions
aws lambda list-functions --profile ailifestyle-dev | grep ailifestyle

# Check DynamoDB tables
aws dynamodb list-tables --profile ailifestyle-dev
```

### 2. Test Frontend
```bash
# Frontend should be accessible at:
open https://ailifestyleapp.com

# Check CloudFront status
aws cloudfront get-distribution --id ${DISTRIBUTION_ID} --profile ailifestyle-dev
```

### 3. Test API
```bash
# Health check
curl https://api.ailifestyleapp.com/v1/health

# You should see:
# {"status":"healthy","timestamp":"...","version":"1.0.0"}
```

## 🔧 Common Issues & Solutions

### Issue: CloudFront 403 Error
**Solution**: Check S3 bucket policy and CloudFront OAI configuration
```bash
# Update bucket policy
aws s3api put-bucket-policy --bucket ${S3_BUCKET} --policy file://bucket-policy.json
```

### Issue: API Gateway 403 Forbidden
**Solution**: Check CORS configuration and authorizer
```bash
# Update CORS
aws apigatewayv2 update-api --api-id ${API_ID} --cors-configuration file://cors-config.json
```

### Issue: Lambda Cold Start Too Slow
**Solution**: Enable provisioned concurrency
```bash
aws lambda put-provisioned-concurrency-config \
  --function-name ailifestyle-login-user-dev \
  --provisioned-concurrent-executions 2
```

## 📊 Monitoring Setup

### CloudWatch Dashboard
```bash
# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name ailifestyle-dev \
  --dashboard-body file://dashboard-config.json
```

### Alarms
```bash
# API errors alarm
aws cloudwatch put-metric-alarm \
  --alarm-name ailifestyle-api-errors \
  --alarm-description "API error rate too high" \
  --metric-name 4XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

## 🚦 Deployment Checklist

### Pre-Deployment
- [ ] AWS credentials configured
- [ ] Domain nameservers updated
- [ ] Terraform state backend configured
- [ ] Environment variables set

### Infrastructure
- [ ] VPC and networking deployed
- [ ] Cognito user pool created
- [ ] DynamoDB tables created
- [ ] API Gateway deployed
- [ ] Lambda functions deployed
- [ ] CloudFront distribution created

### Application
- [ ] Frontend builds successfully
- [ ] Frontend uploaded to S3
- [ ] CloudFront cache invalidated
- [ ] SSL certificates active
- [ ] Health check passing

### Post-Deployment
- [ ] Monitoring configured
- [ ] Alarms set up
- [ ] Logs aggregated
- [ ] Backup strategy confirmed
- [ ] Documentation updated

## 🔐 Security Checklist
- [ ] IAM roles follow least privilege
- [ ] S3 buckets not public
- [ ] API Gateway has rate limiting
- [ ] WAF rules configured
- [ ] Secrets in AWS Secrets Manager
- [ ] CloudTrail enabled
- [ ] VPC Flow Logs enabled

## 📝 Next Steps
1. Run integration tests
2. Configure production environment
3. Set up CI/CD pipeline
4. Implement automated backups
5. Create runbooks for operations

## 🆘 Support
- AWS Support: [AWS Console](https://console.aws.amazon.com/support)
- Terraform Issues: Check `.terraform/logs/`
- Application Logs: CloudWatch Logs console
- Metrics: CloudWatch Metrics console

---
**Remember**: Always deploy to dev first, test thoroughly, then promote to production!