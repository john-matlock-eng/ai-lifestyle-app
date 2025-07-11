# Frontend CI/CD AWS Authentication Update

## Issue
The frontend CI/CD workflow was failing with:
```
Error: Credentials could not be loaded, please check your action inputs: Could not load credentials from any providers
```

## Root Cause
The frontend workflow was using traditional AWS access keys while the backend workflow uses OIDC (OpenID Connect) authentication with role assumption. GitHub Actions supports OIDC authentication which is more secure than using long-lived access keys.

## Changes Made

### 1. Added Permissions Block
Added the required permissions for OIDC authentication:
```yaml
permissions:
  id-token: write       # Required for OIDC authentication
  contents: read        # Required for actions/checkout
  pull-requests: write  # Required for PR comments
```

### 2. Updated AWS Credentials Configuration
Changed from access key authentication to OIDC role assumption in all jobs:

**Before:**
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ env.AWS_REGION }}
```

**After:**
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::${{ secrets.AWS_ACCOUNT_ID }}:role/terraform-deployer-ai-lifestyle
    role-session-name: github-actions-frontend-[env]
    aws-region: ${{ env.AWS_REGION }}
```

### 3. Updated All Jobs
Applied the same authentication method to:
- `deploy-dev` job
- `deploy-prod` job  
- `cleanup-dev` job

## Required GitHub Secrets
Make sure the following secret is configured in your GitHub repository:
- `AWS_ACCOUNT_ID` - Your AWS account ID (12-digit number)

## AWS IAM Role Requirements
The IAM role `terraform-deployer-ai-lifestyle` must:
1. Have a trust policy that allows GitHub Actions to assume it
2. Have the necessary permissions for Terraform and S3 operations

Example trust policy for the IAM role:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_ORG/ai-lifestyle-app:*"
        }
      }
    }
  ]
}
```

## Benefits of OIDC Authentication
1. **More Secure**: No long-lived access keys stored in GitHub
2. **Temporary Credentials**: Each job gets temporary credentials that expire
3. **Better Audit Trail**: CloudTrail shows which GitHub workflow assumed the role
4. **Consistent with Backend**: Both frontend and backend now use the same authentication method

## Next Steps
1. Ensure the `AWS_ACCOUNT_ID` secret is set in your GitHub repository
2. Verify the IAM role `terraform-deployer-ai-lifestyle` exists and has proper permissions
3. Re-run the workflow to test the authentication

## Cleanup
You can now remove these secrets as they're no longer needed:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_ACCESS_KEY_ID_PROD`
- `AWS_SECRET_ACCESS_KEY_PROD`
