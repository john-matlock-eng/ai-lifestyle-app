# Temporary State Cleanup Instructions

## What's Happening
We're temporarily commenting out the goals_service module to remove the incorrectly configured DynamoDB tables from Terraform state.

## Step 1: Apply with Commented Module
With the goals_service module and all its references commented out, run:
```bash
terraform apply
```

This will:
- Delete the goals DynamoDB tables (if they exist)
- Remove them from Terraform state
- Keep all other infrastructure intact

## Step 2: Uncomment and Re-apply
After the first apply succeeds, uncomment these sections in main.tf:
1. Lines 124-134: The goals_service module
2. Line 150: GOAL_ATTACHMENTS_BUCKET environment variable
3. Line 158: aws_iam_policy.goals_s3_access.arn in additional_policies
4. Lines 336-360: The aws_iam_policy "goals_s3_access" resource
5. Lines 410-414: The goal_attachments_bucket_name output

Then run `terraform apply` again to create:
- S3 bucket for goal attachments
- EventBridge rules
- SNS/SQS for notifications
- But NO DynamoDB tables (they'll use the main table)

## Why This Works
- First apply removes the problematic tables from state
- Second apply creates only the non-table resources
- Goals will use the main table via single-table design
