# AI Lifestyle App - Monitoring & Operations Guide

## Overview

The AI Lifestyle App's Goal System includes comprehensive monitoring and alerting to ensure reliability, performance, and operational excellence. This guide covers:

- CloudWatch dashboards and metrics
- Alarm configuration and response procedures
- Performance optimization strategies
- Troubleshooting common issues

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   CloudWatch Dashboard                       │
├─────────────────┬──────────────────┬───────────────────────┤
│  API Metrics    │  DynamoDB Metrics │  Custom KPIs         │
│  - Invocations  │  - Read/Write     │  - Goals Created     │
│  - Errors       │  - Throttles      │  - Activities Logged │
│  - Latency      │  - Errors         │  - Goal Patterns     │
└─────────────────┴──────────────────┴───────────────────────┘
         │                   │                    │
         └───────────────────┴────────────────────┘
                             │
                    ┌────────▼──────────┐
                    │   CloudWatch      │
                    │     Alarms        │
                    └────────┬──────────┘
                             │
                    ┌────────▼──────────┐
                    │   SNS Topics      │
                    │  Notifications    │
                    └───────────────────┘
```

## CloudWatch Dashboard

### Accessing the Dashboard

1. Navigate to CloudWatch Console
2. Select "Dashboards" from the left menu
3. Open: `ai-lifestyle-app-goals-{environment}`

### Dashboard Sections

#### 1. API Performance Summary (Top Row)
- **API Invocations**: Total requests per endpoint (5-min intervals)
- **API Errors**: Error count by endpoint
- **Concurrent Executions**: Lambda concurrency metrics

#### 2. Latency Metrics (Second Row)
- **p50 Latency**: Median response time (target: <50ms)
- **p95 Latency**: 95th percentile (target: <100ms)
- **p99 Latency**: 99th percentile (target: <200ms)

#### 3. DynamoDB Performance (Third Row)
- **Consumed Capacity**: Read/Write capacity units
- **DynamoDB Errors**: User errors and system errors

#### 4. Business Metrics (Fourth Row)
- **Goal Pattern Distribution**: Pie chart of goal types
- **Activity Logging Rate**: Time series of activities

#### 5. Error Analysis (Bottom)
- **Recent Errors Table**: Last 50 errors across all functions

## Alarms Configuration

### Critical Alarms

#### 1. High Error Rate
- **Threshold**: >10 errors in 5 minutes
- **Evaluation**: 2 consecutive periods
- **Response**: Check logs, verify external dependencies

#### 2. High Latency (p99)
- **Threshold**: >200ms
- **Evaluation**: 3 consecutive periods
- **Response**: Check for DynamoDB throttling, cold starts

#### 3. DynamoDB Throttles
- **Threshold**: >5 system errors in 5 minutes
- **Evaluation**: 2 consecutive periods
- **Response**: Scale DynamoDB capacity or enable auto-scaling

#### 4. Service Degraded (Composite)
- **Trigger**: Any endpoint alarm triggered
- **Response**: Check specific endpoint alarms

### Alarm Response Procedures

1. **Immediate Actions**
   - Check CloudWatch dashboard for affected endpoints
   - Review recent deployments
   - Check AWS Service Health Dashboard

2. **Investigation Steps**
   ```bash
   # Check Lambda logs
   aws logs tail /aws/lambda/{function-name} --follow
   
   # Check DynamoDB metrics
   aws cloudwatch get-metric-statistics \
     --namespace AWS/DynamoDB \
     --metric-name ConsumedReadCapacityUnits \
     --dimensions Name=TableName,Value=ai-lifestyle-app-goals-prod \
     --start-time 2025-01-05T00:00:00Z \
     --end-time 2025-01-05T23:59:59Z \
     --period 300 \
     --statistics Sum
   ```

3. **Escalation Path**
   - Level 1: On-call engineer
   - Level 2: Backend team lead
   - Level 3: Infrastructure team

## Performance Optimization Guide

### 1. Lambda Cold Starts
**Symptoms**: Intermittent high latency spikes

**Solutions**:
- Enable Lambda provisioned concurrency for critical endpoints
- Implement connection pooling for DynamoDB
- Use Lambda SnapStart (Java) or similar optimizations

**Implementation**:
```terraform
reserved_concurrent_executions = 10  # Prevent runaway scaling
provisioned_concurrent_executions = 2  # Keep warm instances
```

### 2. DynamoDB Performance

**Query Optimization**:
```python
# Bad: Multiple queries
for goal_id in goal_ids:
    goal = table.get_item(Key={'PK': f'USER#{user_id}', 'SK': f'GOAL#{goal_id}'})

# Good: Batch get
keys = [{'PK': f'USER#{user_id}', 'SK': f'GOAL#{goal_id}'} for goal_id in goal_ids]
response = dynamodb.batch_get_item(RequestItems={table_name: {'Keys': keys}})
```

**Index Usage**:
- GSI1: For status-based queries
- GSI2: For time-based queries

### 3. Caching Strategy (Future Enhancement)

**Redis Implementation Plan**:
```python
# Cache key patterns
USER_GOALS_KEY = "goals:user:{user_id}:active"  # TTL: 5 minutes
GOAL_PROGRESS_KEY = "progress:goal:{goal_id}"   # TTL: 1 hour

# Cache invalidation events
- Goal created/updated/archived
- Activity logged
- Progress calculated
```

## Troubleshooting Guide

### Common Issues

#### 1. "Task timed out" Errors
**Cause**: Lambda timeout (default 3s)

**Debug**:
```python
# Add timing logs
import time
start = time.time()
# ... operation ...
logger.info(f"Operation took {time.time() - start}s")
```

**Fix**: Increase timeout or optimize code

#### 2. "Throttled" DynamoDB Errors
**Cause**: Exceeding provisioned capacity

**Fix**:
- Switch to on-demand billing
- Enable auto-scaling
- Implement exponential backoff

#### 3. Authentication Failures
**Cause**: Token expiration or Cognito issues

**Debug**:
```bash
# Check Cognito user pool
aws cognito-idp describe-user-pool --user-pool-id {pool-id}
```

### Log Analysis Queries

#### Find Slow Requests
```
fields @timestamp, duration
| filter duration > 200
| sort duration desc
| limit 20
```

#### Error Pattern Analysis
```
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by error_type
```

#### User Activity Patterns
```
fields @timestamp, user_id
| filter @message like /Activity logged/
| stats count() by user_id, bin(1h)
```

## Monitoring Best Practices

### 1. Proactive Monitoring
- Review dashboards daily during business hours
- Set up weekly performance reviews
- Create custom metrics for business KPIs

### 2. Alert Fatigue Prevention
- Tune thresholds based on actual patterns
- Use composite alarms for related metrics
- Implement smart alerting (anomaly detection)

### 3. Documentation
- Keep runbooks updated
- Document all production issues
- Share learnings in team retrospectives

## Future Enhancements

### Phase 1: Advanced Monitoring (Week 4)
- [ ] APM integration (Datadog/New Relic)
- [ ] Distributed tracing with X-Ray
- [ ] Custom business metrics dashboard

### Phase 2: Automation (Month 2)
- [ ] Auto-remediation for common issues
- [ ] Predictive scaling based on patterns
- [ ] Anomaly detection with ML

### Phase 3: Observability Platform (Month 3)
- [ ] Centralized logging (ELK stack)
- [ ] Real-time analytics
- [ ] User journey tracking

## Quick Reference

### Key Metrics to Watch
| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Latency p50 | <50ms | N/A |
| API Latency p95 | <100ms | N/A |
| API Latency p99 | <200ms | >200ms |
| Error Rate | <0.1% | >1% |
| DynamoDB Throttles | 0 | >5/5min |

### Useful Commands
```bash
# Get Lambda function metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=create_goal-prod \
  --statistics Average,Maximum \
  --start-time 2025-01-05T00:00:00Z \
  --end-time 2025-01-05T23:59:59Z \
  --period 3600

# List recent errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/create_goal-prod \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 hour ago' +%s)000

# Check DynamoDB capacity
aws dynamodb describe-table \
  --table-name ai-lifestyle-app-goals-prod \
  --query 'Table.{TableStatus:TableStatus,ItemCount:ItemCount,TableSizeBytes:TableSizeBytes}'
```

## Support

- **Slack Channel**: #ai-lifestyle-backend
- **On-Call Schedule**: PagerDuty rotation
- **Documentation**: Internal wiki
- **Escalation**: backend-oncall@company.com

---

*Last Updated: January 5, 2025*
*Version: 1.0*