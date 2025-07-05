#!/bin/bash
# Manual deployment script for testing the phased deployment approach

set -e

# Configuration
ENVIRONMENT=${1:-dev}
AWS_ACCOUNT_ID=${2:-$(aws sts get-caller-identity --query Account --output text)}
AWS_REGION=${AWS_REGION:-us-east-1}

echo "🚀 Deploying AI Lifestyle Backend to $ENVIRONMENT environment"
echo "   AWS Account: $AWS_ACCOUNT_ID"
echo "   AWS Region: $AWS_REGION"
echo ""

# Change to terraform directory
cd "$(dirname "$0")/../terraform"

# Phase 1: Initialize Terraform
echo "📦 Phase 1: Initializing Terraform..."
terraform init

# Phase 2: Deploy base infrastructure (without Lambda)
echo "🏗️  Phase 2: Deploying base infrastructure (ECR, Cognito, DynamoDB)..."
terraform apply \
  -var="environment=$ENVIRONMENT" \
  -var="aws_account_id=$AWS_ACCOUNT_ID" \
  -var="deploy_lambda=false" \
  -auto-approve

# Capture outputs
ECR_URL=$(terraform output -raw ecr_repository_url)
echo "✅ ECR Repository: $ECR_URL"

# Phase 3: Build and push Docker images
echo "🐳 Phase 3: Building and pushing Docker images..."
cd ../

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL

# Build and push API handler
docker build -f Dockerfile.api-handler -t api-handler:latest .
docker tag api-handler:latest $ECR_URL:api-handler-$ENVIRONMENT-latest
docker push $ECR_URL:api-handler-$ENVIRONMENT-latest

# Build and push health check
docker build -f Dockerfile.health-check -t health-check:latest .
docker tag health-check:latest $ECR_URL:health-check-$ENVIRONMENT-latest
docker push $ECR_URL:health-check-$ENVIRONMENT-latest

echo "✅ Docker images pushed successfully"

# Phase 4: Deploy Lambda functions
echo "⚡ Phase 4: Deploying Lambda functions..."
cd terraform
terraform apply \
  -var="environment=$ENVIRONMENT" \
  -var="aws_account_id=$AWS_ACCOUNT_ID" \
  -var="deploy_lambda=true" \
  -var="api_handler_image_tag=api-handler-$ENVIRONMENT-latest" \
  -auto-approve

# Final outputs
echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Resources created:"
echo "  - ECR Repository: $(terraform output -raw ecr_repository_url)"
echo "  - Cognito User Pool: $(terraform output -raw cognito_user_pool_id)"
echo "  - DynamoDB Table: $(terraform output -raw dynamodb_table_name)"
echo "  - Lambda Function: $(terraform output -raw api_lambda_name)"
