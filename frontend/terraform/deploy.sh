#!/bin/bash
# Deploy frontend to AWS S3 and CloudFront

set -e

# Check if environment is provided
if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh [dev|staging|prod]"
    exit 1
fi

ENVIRONMENT=$1

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    echo "Error: Environment must be dev, staging, or prod"
    exit 1
fi

echo "Deploying frontend to $ENVIRONMENT environment..."

# Build the application
echo "Building frontend application..."
cd ..
npm ci
npm run build

# Get Terraform outputs
echo "Getting deployment configuration..."
cd terraform
terraform init -backend-config=backend-$ENVIRONMENT.conf
BUCKET_NAME=$(terraform output -raw s3_bucket_name 2>/dev/null || echo "")
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")

if [ -z "$BUCKET_NAME" ] || [ -z "$DISTRIBUTION_ID" ]; then
    echo "Error: Could not get deployment targets. Make sure infrastructure is deployed."
    exit 1
fi

# Sync files to S3
echo "Syncing files to S3 bucket: $BUCKET_NAME"
aws s3 sync ../dist s3://$BUCKET_NAME --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html" \
    --exclude "*.map"

# Upload index.html with no-cache headers
aws s3 cp ../dist/index.html s3://$BUCKET_NAME/index.html \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html"

# Invalidate CloudFront cache
echo "Invalidating CloudFront distribution: $DISTRIBUTION_ID"
aws cloudfront create-invalidation \
    --distribution-id $DISTRIBUTION_ID \
    --paths "/*"

echo "Deployment complete!"
echo "Frontend URL: $(terraform output -raw frontend_url)"
