#!/bin/bash
# scripts/deploy-lambda.sh
# Helper script to build and deploy Lambda container images

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS CLI not configured${NC}"
    exit 1
fi

# Get environment from argument or default to dev
ENVIRONMENT="${1:-dev}"
FUNCTION_NAME="${2:-api-handler}"

# Generate immutable tag based on git commit
GIT_SHA=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +%Y%m%d%H%M%S)
IMAGE_TAG="${ENVIRONMENT}-${GIT_SHA}-${TIMESTAMP}"

echo -e "${YELLOW}Deploying Lambda function: $FUNCTION_NAME to $ENVIRONMENT${NC}"
echo -e "${YELLOW}Using immutable tag: $IMAGE_TAG${NC}"

# Get ECR repository URL from Terraform output
cd terraform
ECR_URL=$(terraform output -raw ecr_repository_url 2>/dev/null || echo "")

if [ -z "$ECR_URL" ]; then
    echo -e "${RED}Error: ECR repository not found. Run 'terraform apply' first.${NC}"
    exit 1
fi

cd ..

# Get AWS region
AWS_REGION=$(aws configure get region || echo "us-east-1")

# Login to ECR
echo -e "${YELLOW}Logging in to ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL

# Build the image
echo -e "${YELLOW}Building Docker image for ARM64...${NC}"
docker buildx create --use --name lambda-builder 2>/dev/null || true
docker buildx build \
    --platform linux/arm64 \
    -t $ECR_URL:$FUNCTION_NAME-$IMAGE_TAG \
    -t $ECR_URL:$FUNCTION_NAME-$GIT_SHA \
    --push \
    -f Dockerfile.$FUNCTION_NAME \
    .

echo -e "${GREEN}✓ Image pushed successfully${NC}"

# Update Lambda function (if it exists)
LAMBDA_NAME="$FUNCTION_NAME-$ENVIRONMENT"
if aws lambda get-function --function-name $LAMBDA_NAME &> /dev/null; then
    echo -e "${YELLOW}Updating Lambda function...${NC}"
    aws lambda update-function-code \
        --function-name $LAMBDA_NAME \
        --image-uri $ECR_URL:$FUNCTION_NAME-$IMAGE_TAG
    
    echo -e "${GREEN}✓ Lambda function updated${NC}"
else
    echo -e "${YELLOW}Lambda function $LAMBDA_NAME not found. Run 'terraform apply' to create it.${NC}"
fi

echo -e "${GREEN}✓ Deployment complete!${NC}"
