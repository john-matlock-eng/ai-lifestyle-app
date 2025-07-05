# Frontend Infrastructure

This directory contains the Terraform configuration for deploying the AI Lifestyle App frontend to AWS.

## Architecture

- **S3**: Static website hosting for the React app
- **CloudFront**: CDN for global distribution and HTTPS
- **Route53**: DNS management (optional)
- **ACM**: SSL certificate for HTTPS

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Terraform installed (v1.0+)
3. Node.js and npm for building the frontend
4. Domain name (optional, for custom domain)

## Deployment Steps

1. Build the frontend:
   ```bash
   cd ..
   npm run build
   ```

2. Initialize Terraform:
   ```bash
   terraform init
   ```

3. Plan the deployment:
   ```bash
   terraform plan -var-file="environments/dev.tfvars"
   ```

4. Apply the configuration:
   ```bash
   terraform apply -var-file="environments/dev.tfvars"
   ```

## Environments

- `dev.tfvars`: Development environment
- `staging.tfvars`: Staging environment
- `prod.tfvars`: Production environment

## Outputs

After deployment, Terraform will output:
- CloudFront distribution URL
- S3 bucket name
- CloudFront distribution ID (for cache invalidation)

## Backend Integration

The frontend needs the backend API URL and CORS configured. Coordinate with the backend team to:
1. Get the API Gateway URL
2. Ensure CORS allows the CloudFront domain
3. Set up environment-specific API endpoints
