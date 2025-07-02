# ⚠️ IMPORTANT: Workflow Migration Notice

## Use the Unified Workflow

The backend deployment has been consolidated into a single workflow that handles everything automatically:

### ✅ USE THIS: `backend-deploy.yml`
- Automatically triggered on PR (dev) and merge to main (prod)
- Handles infrastructure, Docker builds, and Lambda deployment in the correct order
- No manual steps required

### ❌ DO NOT USE THESE (Deprecated):
- `deploy-backend.yml` - Old infrastructure-only workflow
- `build-lambda.yml` - Old Lambda-only workflow

## Why the Change?

The old workflows created a chicken-and-egg problem:
- Lambda needs Docker images to exist in ECR
- ECR must be created before images can be pushed
- The old workflows didn't coordinate this properly

The unified workflow solves this by:
1. Creating infrastructure (ECR, Cognito, DynamoDB) first
2. Building and pushing Docker images
3. Deploying Lambda functions with the images

## If You're Seeing Errors

If you see this error:
```
InvalidParameterValueException: The image manifest, config or layer media type for the source image is not supported
```

This means:
1. You might be using the old workflows (check your GitHub Actions tab)
2. The Docker image has compatibility issues (now fixed with `provenance: false`)

## Next Steps

1. Cancel any running old workflows
2. Use only `backend-deploy.yml`
3. The workflow will handle everything automatically
