# GitHub Actions Workflows

This directory contains CI/CD workflows for the AI Lifestyle App.

## Active Workflows

### backend-deploy.yml ✅ (RECOMMENDED)
The main backend deployment workflow that handles infrastructure and Lambda deployment in the correct order.

**Triggers:**
- Pull Request to main → Deploys to `dev`
- Push to main → Deploys to `prod`

**Features:**
- Phased deployment (infrastructure → images → Lambda)
- Automatic order of operations handling
- PR comments with deployment status
- Comprehensive error handling

## Legacy Workflows (Not Recommended)

### deploy-backend.yml ⚠️
- Only handles Terraform infrastructure
- Does not build/deploy Lambda functions
- Creates chicken-and-egg problem with ECR

### build-lambda.yml ⚠️  
- Only builds and deploys Lambda
- Assumes infrastructure already exists
- Can fail if ECR repository doesn't exist

## Migration Guide

If you're currently using the separate workflows, switch to the unified workflow:

1. Delete or disable the old workflow files
2. Use `deploy-backend-unified.yml` for all deployments
3. The unified workflow handles everything automatically

## Workflow Permissions

All workflows require:
- `id-token: write` - For OIDC authentication
- `contents: read` - For code checkout
- `pull-requests: write` - For PR comments

## Secrets Required

- `AWS_ACCOUNT_ID` - Your AWS account ID
- `TF_STATE_BUCKET` - S3 bucket for Terraform state
- `TF_LOCK_TABLE` - DynamoDB table for state locking
- `GITHUB_TOKEN` - Automatically provided by GitHub
