# AI Lifestyle App - Operations Runbook

## Table of Contents
1. [Emergency Contacts](#emergency-contacts)
2. [System Architecture Overview](#system-architecture-overview)
3. [Common Issues & Solutions](#common-issues--solutions)
4. [Deployment Procedures](#deployment-procedures)
5. [Rollback Procedures](#rollback-procedures)
6. [Database Operations](#database-operations)
7. [Performance Tuning](#performance-tuning)
8. [Security Procedures](#security-procedures)

## Emergency Contacts

| Role | Contact | When to Contact |
|------|---------|-----------------|
| On-Call Engineer | PagerDuty | First point of contact |
| Backend Lead | #backend-team | Architecture decisions |
| Infrastructure | #infrastructure | AWS issues |
| Security Team | security@company.com | Security incidents |
| AWS Support | AWS Console | Service issues |

## System Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CloudFront    │────▶│   API Gateway   │────▶│  Lambda Functions│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                              ┌───────────────────────────┼───────────────┐
                              │                           │               │
                        ┌─────▼─────┐            ┌───────▼──────┐  ┌─────▼─────┐
                        │  Cognito  │            │   DynamoDB   │  │    S3     │
                        └───────────┘            └──────────────┘  └───────────┘
```

### Key Components
- **API Gateway**: REST API endpoint management
- **Lambda Functions**: Serverless compute (Python 3.11)
- **DynamoDB**: NoSQL database for goals and activities
- **Cognito**: User authentication and authorization
- **S3**: Object storage for attachments
- **CloudWatch**: Monitoring and logging

## Common Issues & Solutions

### Issue 1: High Lambda Cold Start Latency

**Symptoms**:
- Intermittent high response times (>1s)
- First request after idle period is slow

**Investigation**:
```bash
# Check cold start metrics
aws logs insights query \
  --log-group-name /aws/lambda/create_goal-prod \
  --query-string 'fields @initDuration, @duration | stats avg(@initDuration), max(@initDuration)'
```

**Solutions**:
1. Enable provisioned concurrency:
```terraform
provisioned_concurrent_executions = 2
```

2. Optimize imports:
```python
# Bad: Import everything
import boto3

# Good: Import only what's needed
from boto3 import client
```

3. Use Lambda SnapStart (if applicable)

### Issue 2: DynamoDB Throttling

**Symptoms**:
- `ProvisionedThroughputExceededException` errors
- Increased latency
- Failed requests

**Investigation**:
```bash
# Check consumed capacity
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=ai-lifestyle-app-goals-prod \
  --statistics Sum \
  --start-time 2025-01-05T00:00:00Z \
  --end-time 2025-01-05T01:00:00Z \
  --period 60
```

**Solutions**:
1. Switch to on-demand billing:
```bash
aws dynamodb update-table \
  --table-name ai-lifestyle-app-goals-prod \
  --billing-mode PAY_PER_REQUEST
```

2. Enable auto-scaling:
```terraform
billing_mode = "PROVISIONED"
read_capacity = 5
write_capacity = 5
autoscaling_enabled = true
```

3. Implement exponential backoff:
```python
from botocore.exceptions import ClientError
import time

def retry_with_backoff(func, max_retries=3):
    for i in range(max_retries):
        try:
            return func()
        except ClientError as e:
            if e.response['Error']['Code'] == 'ProvisionedThroughputExceededException':
                time.sleep(2 ** i)  # Exponential backoff
            else:
                raise
```

### Issue 3: Authentication Failures

**Symptoms**:
- 401 Unauthorized responses
- "Token expired" errors
- Login failures

**Investigation**:
```bash
# Check Cognito user pool status
aws cognito-idp describe-user-pool --user-pool-id $POOL_ID

# Check specific user
aws cognito-idp admin-get-user \
  --user-pool-id $POOL_ID \
  --username user@example.com
```

**Solutions**:
1. Verify token expiration settings
2. Check Cognito triggers
3. Validate JWT token:
```python
import jwt
from jwt import PyJWKClient

# Verify token
url = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json"
jwks_client = PyJWKClient(url)
signing_key = jwks_client.get_signing_key_from_jwt(token)
data = jwt.decode(token, signing_key.key, algorithms=["RS256"])
```

### Issue 4: Memory/Timeout Errors

**Symptoms**:
- "Task timed out" errors
- Out of memory exceptions
- Function crashes

**Investigation**:
```bash
# Check function configuration
aws lambda get-function-configuration \
  --function-name create_goal-prod

# Analyze memory usage
aws logs insights query \
  --log-group-name /aws/lambda/create_goal-prod \
  --query-string 'fields @memorySize, @maxMemoryUsed | stats avg(@maxMemoryUsed), max(@maxMemoryUsed)'
```

**Solutions**:
1. Increase memory/timeout:
```terraform
memory_size = 512  # Increase from 256
timeout = 30       # Increase from 3
```

2. Optimize code:
- Stream large datasets
- Use generators
- Paginate DynamoDB queries

### Issue 5: API Gateway 502/504 Errors

**Symptoms**:
- 502 Bad Gateway
- 504 Gateway Timeout

**Investigation**:
```bash
# Check API Gateway logs
aws logs tail /aws/api-gateway/ai-lifestyle-app-prod

# Check integration latency
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name IntegrationLatency \
  --dimensions Name=ApiName,Value=ai-lifestyle-app-prod \
  --statistics Average,Maximum \
  --start-time 2025-01-05T00:00:00Z \
  --end-time 2025-01-05T01:00:00Z \
  --period 300
```

**Solutions**:
1. Increase integration timeout (max 29s)
2. Enable API Gateway caching
3. Check Lambda function health

## Deployment Procedures

### Standard Deployment

1. **Pre-deployment Checks**:
```bash
# Run tests
make test

# Validate Terraform
cd terraform
terraform validate
terraform plan
```

2. **Deploy Lambda Functions**:
```bash
# Build and push Docker images
make build-all
make push-all

# Update Lambda functions
make deploy-lambdas
```

3. **Post-deployment Validation**:
```bash
# Run smoke tests
./scripts/test-api.sh

# Check CloudWatch alarms
aws cloudwatch describe-alarms \
  --alarm-names ai-lifestyle-app-goals-prod-service-degraded
```

### Emergency Hotfix

1. **Create hotfix branch**:
```bash
git checkout -b hotfix/critical-bug
```

2. **Deploy single function**:
```bash
# Build specific function
docker build -t goal-function:hotfix src/create_goal/

# Deploy
aws lambda update-function-code \
  --function-name create_goal-prod \
  --image-uri $ECR_URI:hotfix
```

3. **Monitor and validate**

## Rollback Procedures

### Lambda Rollback

1. **Using aliases**:
```bash
# Point alias to previous version
aws lambda update-alias \
  --function-name create_goal-prod \
  --name live \
  --function-version 42  # Previous stable version
```

2. **Using container tags**:
```bash
# Revert to previous image
aws lambda update-function-code \
  --function-name create_goal-prod \
  --image-uri $ECR_URI:v1.0.0  # Previous version tag
```

### Database Rollback

1. **Point-in-time recovery**:
```bash
# Restore to specific time
aws dynamodb restore-table-to-point-in-time \
  --source-table-name ai-lifestyle-app-goals-prod \
  --target-table-name ai-lifestyle-app-goals-prod-restored \
  --restore-date-time 2025-01-05T10:00:00Z
```

2. **Backup restore**:
```bash
# List backups
aws dynamodb list-backups \
  --table-name ai-lifestyle-app-goals-prod

# Restore from backup
aws dynamodb restore-table-from-backup \
  --target-table-name ai-lifestyle-app-goals-prod-restored \
  --backup-arn $BACKUP_ARN
```

## Database Operations

### Schema Updates

1. **Add new attribute** (no downtime):
```python
# New code handles both old and new schema
def get_goal(goal_id):
    item = table.get_item(...)
    # Handle missing attribute
    item['newField'] = item.get('newField', 'default_value')
    return item
```

2. **Add GSI** (no downtime):
```bash
aws dynamodb update-table \
  --table-name ai-lifestyle-app-goals-prod \
  --global-secondary-index-updates file://gsi-update.json
```

### Data Migration

```python
# Batch update script
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('ai-lifestyle-app-goals-prod')

def migrate_goals():
    # Scan with pagination
    last_key = None
    while True:
        if last_key:
            response = table.scan(ExclusiveStartKey=last_key)
        else:
            response = table.scan()
        
        # Process items
        with table.batch_writer() as batch:
            for item in response['Items']:
                # Update schema
                item['version'] = 2
                item['migratedAt'] = datetime.utcnow().isoformat()
                batch.put_item(Item=item)
        
        last_key = response.get('LastEvaluatedKey')
        if not last_key:
            break
```

## Performance Tuning

### Lambda Optimization

1. **Connection pooling**:
```python
# Reuse connections
import boto3

# Initialize outside handler
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('goals')

def handler(event, context):
    # Use existing connection
    return table.get_item(...)
```

2. **Batch operations**:
```python
# Bad: Individual gets
for goal_id in goal_ids:
    table.get_item(Key={'PK': f'USER#{user_id}', 'SK': f'GOAL#{goal_id}'})

# Good: Batch get
keys = [{'PK': f'USER#{user_id}', 'SK': f'GOAL#{goal_id}'} for goal_id in goal_ids]
response = dynamodb.batch_get_item(
    RequestItems={'goals': {'Keys': keys}}
)
```

### DynamoDB Optimization

1. **Query optimization**:
```python
# Use projections
response = table.query(
    KeyConditionExpression=Key('PK').eq(f'USER#{user_id}'),
    ProjectionExpression='goalId, title, #s',
    ExpressionAttributeNames={'#s': 'status'}
)
```

2. **Avoid hot partitions**:
```python
# Bad: All items with same partition key
PK = 'GLOBAL'

# Good: Distribute across partitions
PK = f'SHARD#{hash(user_id) % 10}'
```

## Security Procedures

### Incident Response

1. **Detect**:
   - CloudWatch alarms
   - AWS GuardDuty alerts
   - Log analysis

2. **Contain**:
```bash
# Disable compromised user
aws cognito-idp admin-disable-user \
  --user-pool-id $POOL_ID \
  --username suspicious_user

# Revoke API key
aws apigateway update-api-key \
  --api-key $KEY_ID \
  --patch-operations op=replace,path=/enabled,value=false
```

3. **Investigate**:
```bash
# Analyze CloudTrail logs
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=suspicious_user \
  --start-time 2025-01-05T00:00:00Z
```

4. **Remediate**:
   - Patch vulnerabilities
   - Rotate credentials
   - Update security groups

### Security Checklist

- [ ] All Lambda functions use least-privilege IAM roles
- [ ] Secrets stored in AWS Secrets Manager
- [ ] API Gateway uses request validation
- [ ] DynamoDB encryption at rest enabled
- [ ] S3 buckets have versioning and encryption
- [ ] CloudTrail logging enabled
- [ ] Regular security audits scheduled

## Monitoring Commands

### Quick Health Check
```bash
# Function health
for func in create_goal get_goal list_goals update_goal archive_goal log_activity list_activities get_progress; do
  echo "Checking $func..."
  aws lambda get-function --function-name ${func}-prod --query 'Configuration.State'
done

# Recent errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/create_goal-prod \
  --filter-pattern ERROR \
  --start-time $(date -u -d '1 hour ago' +%s)000

# API Gateway status
aws apigateway get-rest-apis \
  --query 'items[?name==`ai-lifestyle-app-prod`]'
```

### Performance Analysis
```bash
# Lambda duration stats
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=create_goal-prod \
  --statistics Average,Maximum,Minimum \
  --start-time $(date -u -d '1 hour ago' --iso-8601) \
  --end-time $(date -u --iso-8601) \
  --period 300

# DynamoDB consumed capacity
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=ai-lifestyle-app-goals-prod \
  --statistics Sum \
  --start-time $(date -u -d '1 hour ago' --iso-8601) \
  --end-time $(date -u --iso-8601) \
  --period 300
```

---

*Last Updated: January 5, 2025*  
*Version: 1.0*  
*Next Review: February 1, 2025*