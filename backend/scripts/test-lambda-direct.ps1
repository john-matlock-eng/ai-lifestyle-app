# Test Script - Direct Lambda Invocation
Write-Host "`n=== Testing Lambda Directly (bypassing API Gateway) ===" -ForegroundColor Cyan

$testEvent = @{
    httpMethod = "POST"
    path = "/auth/register"
    body = @{
        email = "direct.test@example.com"
        password = "DirectTest123!"
        firstName = "Direct"
        lastName = "Test"
    } | ConvertTo-Json
} | ConvertTo-Json -Compress

Write-Host "Test Event:" -ForegroundColor Yellow
Write-Host $testEvent

Write-Host "`nInvoking Lambda directly..." -ForegroundColor Cyan

# Save event to file
$testEvent | Out-File -FilePath "test-event.json" -Encoding UTF8

# Invoke Lambda
aws lambda invoke `
    --function-name api-handler-dev `
    --cli-binary-format raw-in-base64-out `
    --payload file://test-event.json `
    response.json

Write-Host "`nLambda Response:" -ForegroundColor Green
Get-Content response.json | ConvertFrom-Json | ConvertTo-Json -Depth 10

# Clean up
Remove-Item test-event.json
Remove-Item response.json

Write-Host "`nChecking CloudWatch logs..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
aws logs tail /aws/lambda/api-handler-dev --since 1m --format short
