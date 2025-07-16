# DynamoDB GSI Migration Guide

## Overview
This guide explains how to add the necessary Global Secondary Indexes (GSIs) to support efficient journal sharing queries.

## Current State
The DynamoDB table currently has only one GSI:
- **EmailIndex** (gsi1_pk, gsi1_sk) - Used for email lookups and owner-based queries

## Required GSIs for Sharing
We need to add two more GSIs:

1. **RecipientSharesIndex** (gsi2_pk, gsi2_sk)
   - Purpose: Efficiently query shares by recipient
   - Use case: "Show me all shares where I'm the recipient"
   - Key pattern: `gsi2_pk=USER#{recipientId}`, `gsi2_sk=SHARE#{timestamp}`

2. **ItemSharesIndex** (gsi3_pk, gsi3_sk)
   - Purpose: Efficiently query shares by item
   - Use case: "Show me all shares for this journal"
   - Key pattern: `gsi3_pk=JOURNAL#{journalId}`, `gsi3_sk=SHARE#{timestamp}`

## Migration Steps

### Option 1: Terraform Apply (Recommended)
If you can afford some downtime or are in development:

```bash
cd backend/terraform
terraform plan -var="environment=dev" -var="aws_account_id=$AWS_ACCOUNT_ID"
terraform apply -var="environment=dev" -var="aws_account_id=$AWS_ACCOUNT_ID"
```

**Note**: Adding GSIs to an existing table can take time and may impact performance during creation.

### Option 2: Manual AWS Console Update
For production with zero downtime:

1. Go to AWS DynamoDB Console
2. Select your table (e.g., `users-dev`)
3. Go to "Indexes" tab
4. Click "Create index"

**For RecipientSharesIndex:**
- Partition key: `gsi2_pk` (String)
- Sort key: `gsi2_sk` (String)
- Index name: `RecipientSharesIndex`
- Projection: All attributes
- Provisioned capacity: Use on-demand or match table settings

**For ItemSharesIndex:**
- Partition key: `gsi3_pk` (String)
- Sort key: `gsi3_sk` (String)
- Index name: `ItemSharesIndex`
- Projection: All attributes
- Provisioned capacity: Use on-demand or match table settings

### Option 3: AWS CLI
```bash
# Add RecipientSharesIndex
aws dynamodb update-table \
  --table-name users-dev \
  --attribute-definitions \
    AttributeName=gsi2_pk,AttributeType=S \
    AttributeName=gsi2_sk,AttributeType=S \
  --global-secondary-index-updates \
    '[{
      "Create": {
        "IndexName": "RecipientSharesIndex",
        "Keys": [
          {"AttributeName": "gsi2_pk", "KeyType": "HASH"},
          {"AttributeName": "gsi2_sk", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "BillingMode": "PAY_PER_REQUEST"
      }
    }]'

# Add ItemSharesIndex (after first completes)
aws dynamodb update-table \
  --table-name users-dev \
  --attribute-definitions \
    AttributeName=gsi3_pk,AttributeType=S \
    AttributeName=gsi3_sk,AttributeType=S \
  --global-secondary-index-updates \
    '[{
      "Create": {
        "IndexName": "ItemSharesIndex",
        "Keys": [
          {"AttributeName": "gsi3_pk", "KeyType": "HASH"},
          {"AttributeName": "gsi3_sk", "KeyType": "RANGE"}
        ],
        "Projection": {"ProjectionType": "ALL"},
        "BillingMode": "PAY_PER_REQUEST"
      }
    }]'
```

## Important Notes

1. **GSI Creation Time**: Creating GSIs on existing tables can take several minutes to hours depending on table size
2. **Cost**: Each GSI incurs additional storage and throughput costs
3. **Backfilling**: DynamoDB automatically backfills existing data into new GSIs
4. **One at a Time**: You can only create/update one GSI at a time per table

## Verification

After GSIs are created, verify they're active:

```bash
aws dynamodb describe-table --table-name users-dev --query "Table.GlobalSecondaryIndexes[].IndexStatus"
```

All indexes should show status: "ACTIVE"

## Rollback

If needed, GSIs can be deleted:
```bash
aws dynamodb update-table \
  --table-name users-dev \
  --global-secondary-index-updates \
    '[{"Delete": {"IndexName": "RecipientSharesIndex"}}]'
```

## Timeline
- GSI creation: 5-30 minutes per index
- Total migration time: ~1 hour
- No application downtime required (GSIs are created online)
