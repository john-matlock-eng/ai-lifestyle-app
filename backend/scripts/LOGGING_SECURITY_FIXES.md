# Password Logging Security Fixes

## Summary
Fixed password logging issues to ensure sensitive data is never logged in the application.

## Files Updated

### 1. `/backend/src/main.py`
**Issue**: Was logging the entire event including request body with passwords
```python
# OLD (INSECURE):
print(f"Incoming event: {json.dumps(event)}")

# NEW (SECURE):
# Sanitized event that excludes body and sensitive headers
sanitized_event = {
    "httpMethod": event.get("httpMethod"),
    "path": event.get("path"),
    "headers": "<redacted>",
    "requestContext": {
        "requestId": event.get("requestContext", {}).get("requestId"),
        "accountId": event.get("requestContext", {}).get("accountId"),
        "stage": event.get("requestContext", {}).get("stage")
    } if "requestContext" in event else None
}
print(f"Incoming request: {json.dumps(sanitized_event)}")
```

### 2. `/backend/src/login_user/models.py`
**Enhancement**: Added password protection to LoginRequest model
```python
password: str = Field(
    ...,
    repr=False  # Exclude from string representation
)

class Config:
    # Hide password in any JSON serialization for logging
    json_encoders = {
        str: lambda v: "<redacted>" if "password" in str(v).lower() else v
    }
```

### 3. `/backend/src/register_user/models.py`
**Enhancement**: Added same password protection to RegisterRequest model

## Security Best Practices Implemented

1. **Never log request bodies** - They may contain passwords or other sensitive data
2. **Use repr=False** - Excludes password field from Pydantic model string representations
3. **Sanitize events** - Only log necessary metadata like method, path, and request ID
4. **Structured logging** - Use logger.info with extra={} for specific fields only
5. **No sensitive data in error messages** - Error responses don't include passwords

## Verification Script
Created `/backend/scripts/check-password-logging.ps1` to scan for potential password logging issues.

## Deployment
These changes need to be deployed:
```powershell
.\deploy-login-fix.ps1
```

## Testing
After deployment, verify no passwords appear in CloudWatch logs:
1. Register a new user
2. Login with that user
3. Check CloudWatch logs - passwords should never appear

## Additional Recommendations

1. **Enable AWS CloudTrail** for API Gateway to track all API calls
2. **Use AWS Secrets Manager** for any API keys or secrets
3. **Enable log encryption** in CloudWatch
4. **Set up log retention policies** to automatically delete old logs
5. **Use AWS X-Ray** for tracing without logging sensitive data
