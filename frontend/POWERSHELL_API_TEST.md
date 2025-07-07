# PowerShell API Test Commands

## Quick Test - Copy & Paste This:

### Test Login (One-liner):
```powershell
Invoke-RestMethod -Uri "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"test@example.com","password":"Test123!"}'
```

### Test Login with Error Details:
```powershell
try { Invoke-RestMethod -Uri "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"test@example.com","password":"Test123!"}' } catch { Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red; $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream()); $reader.BaseStream.Position = 0; $reader.DiscardBufferedData(); Write-Host "Response: $($reader.ReadToEnd())" -ForegroundColor Yellow }
```

### Test CORS Headers:
```powershell
(Invoke-WebRequest -Uri "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/login" -Method OPTIONS -Headers @{"Origin"="https://cloudfront.net";"Access-Control-Request-Method"="POST"} -UseBasicParsing).Headers
```

### Test with Username instead of Email:
```powershell
Invoke-RestMethod -Uri "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"test@example.com","password":"Test123!"}'
```

## Full Test Script:
Run the complete test script:
```powershell
.\test-api.ps1
```

## Common Responses:

### If CORS is not enabled:
- You'll get a 403 Forbidden
- No Access-Control headers in response

### If stage name is missing:
- You'll get a 404 Not Found
- Try adding `/dev` or `/v1` to the URL

### If request format is wrong:
- You'll get 400 Bad Request with error details
- Check if it expects "username" instead of "email"

### Success Response:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {...}
}
```
