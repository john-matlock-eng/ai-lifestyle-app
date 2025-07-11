#!/bin/bash
# Quick deployment status check and next steps

set -e

echo "🔍 Checking deployment status..."

# Check if we're in the right directory
if [ ! -f "terraform/main.tf" ]; then
    echo "❌ Error: Run this script from the backend directory"
    exit 1
fi

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=${AWS_REGION:-us-east-1}
ENVIRONMENT=${1:-dev}

echo "Account: $AWS_ACCOUNT_ID"
echo "Region: $AWS_REGION"
echo "Environment: $ENVIRONMENT"
echo ""

# Check ECR repository
ECR_REPO="lifestyle-app-$ENVIRONMENT"
echo "📦 Checking ECR repository: $ECR_REPO"
if aws ecr describe-repositories --repository-names $ECR_REPO 2>/dev/null; then
    echo "✅ ECR repository exists"
    
    # Check for images
    IMAGE_COUNT=$(aws ecr list-images --repository-name $ECR_REPO --query 'length(imageIds)' --output text)
    echo "📷 Images in repository: $IMAGE_COUNT"
    
    if [ "$IMAGE_COUNT" -eq "0" ]; then
        echo "⚠️  No images found! You need to build and push Docker images."
        echo ""
        echo "🚀 Next steps:"
        echo "1. Build and push Docker images:"
        echo "   cd $PWD"
        echo "   # Login to ECR"
        echo "   aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
        echo ""
        echo "   # Build and push API handler"
        echo "   docker build -f Dockerfile.api-handler -t api-handler:latest ."
        echo "   docker tag api-handler:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:api-handler-$ENVIRONMENT-latest"
        echo "   docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO:api-handler-$ENVIRONMENT-latest"
        echo ""
        echo "2. Then deploy Lambda functions:"
        echo "   cd terraform"
        echo "   terraform apply -var=\"deploy_lambda=true\" -var=\"environment=$ENVIRONMENT\" -var=\"aws_account_id=$AWS_ACCOUNT_ID\""
    else
        echo "✅ Images found in repository"
        aws ecr list-images --repository-name $ECR_REPO --query 'imageIds[*].imageTag' --output table
    fi
else
    echo "❌ ECR repository does not exist"
    echo "Run: terraform apply -var=\"deploy_lambda=false\" first"
fi

echo ""
echo "📊 Current Terraform state:"
cd terraform
terraform output 2>/dev/null || echo "No outputs yet"
