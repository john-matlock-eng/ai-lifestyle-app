# Quick PowerShell commands to test the API
# Copy and paste these commands one at a time in PowerShell

# Test login endpoint (main test)
Write-Host "Testing login endpoint..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "Test123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody `
    -Verbose

# If you get an error, run this to see the full error details:
try {
    Invoke-RestMethod -Uri "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Get the actual error response
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $reader.BaseStream.Position = 0
    $reader.DiscardBufferedData()
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response Body: $responseBody" -ForegroundColor Red
}

# Test CORS (OPTIONS request)
Write-Host "`nTesting CORS..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/login" `
    -Method OPTIONS `
    -Headers @{
        "Origin" = "https://your-cloudfront-domain.com"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type"
    } `
    -UseBasicParsing | Select-Object StatusCode, Headers
