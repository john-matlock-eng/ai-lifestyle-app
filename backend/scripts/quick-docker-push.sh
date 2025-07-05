#!/bin/bash
# Quick Docker build and push for the API handler

AWS_ACCOUNT_ID=${1:-$(aws sts get-caller-identity --query Account --output text)}
REGION=${AWS_REGION:-us-east-1}
ENV=${2:-dev}

echo "Building and pushing api-handler for $ENV environment..."
echo "Account: $AWS_ACCOUNT_ID"

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Build and push in one command
docker build -f Dockerfile.api-handler -t $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/lifestyle-app-$ENV:api-handler-$ENV-latest . && \
docker push $AWS_ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/lifestyle-app-$ENV:api-handler-$ENV-latest

echo "✅ Done! Now run: cd terraform && terraform apply -var=\"deploy_lambda=true\" -var=\"environment=$ENV\" -var=\"aws_account_id=$AWS_ACCOUNT_ID\""
