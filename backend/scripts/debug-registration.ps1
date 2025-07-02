# Debug Registration Error
param(
    [string]$ApiUrl = "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com"
)

Write-Host "`n=== Testing Registration with Detailed Error ===" -ForegroundColor Cyan

$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testUser = @{
    email = "test.$timestamp@example.com"
    password = "TestPassword123!"
    firstName = "Test"
    lastName = "User"
}

Write-Host "Registering user: $($testUser.email)" -ForegroundColor Yellow
Write-Host "Request body:" -ForegroundColor Gray
$testUser | ConvertTo-Json | Write-Host

try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/auth/register" `
        -Method POST `
        -Body ($testUser | ConvertTo-Json) `
        -ContentType "application/json" `
        -ErrorAction Stop
        
    Write-Host "`nSuccess! Status: $($response.StatusCode)" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "`nFailed! Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host "`nError Response:" -ForegroundColor Yellow
        try {
            $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
        } catch {
            Write-Host $_.ErrorDetails.Message
        }
    }
    
    Write-Host "`nFull Error:" -ForegroundColor Red
    Write-Host $_
}

Write-Host "`nChecking recent CloudWatch logs..." -ForegroundColor Cyan
Write-Host "Run this command to see detailed logs:" -ForegroundColor Yellow
Write-Host "aws logs tail /aws/lambda/api-handler-dev --since 5m" -ForegroundColor Gray
