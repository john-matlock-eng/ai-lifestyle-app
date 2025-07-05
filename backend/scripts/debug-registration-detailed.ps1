# Detailed Debug Script for Registration
param(
    [string]$ApiUrl = "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com"
)

Write-Host "`n=== Detailed Registration Debug ===" -ForegroundColor Cyan

# Test with verbose error handling
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testUser = @{
    email = "debug.$timestamp@example.com"
    password = "DebugPassword123!"
    firstName = "Debug"
    lastName = "User"
}

Write-Host "Request URL: $ApiUrl/auth/register" -ForegroundColor Yellow
Write-Host "Request Body:" -ForegroundColor Yellow
$testUser | ConvertTo-Json | Write-Host

Write-Host "`nMaking request..." -ForegroundColor Cyan

try {
    # Use Invoke-WebRequest for more detailed response info
    $response = Invoke-WebRequest `
        -Uri "$ApiUrl/auth/register" `
        -Method POST `
        -Body ($testUser | ConvertTo-Json) `
        -ContentType "application/json" `
        -UseBasicParsing `
        -ErrorAction Stop
        
    Write-Host "`nSUCCESS!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Status Description: $($response.StatusDescription)" -ForegroundColor Green
    Write-Host "`nResponse Headers:" -ForegroundColor Yellow
    $response.Headers | Format-Table
    Write-Host "`nResponse Body:" -ForegroundColor Yellow
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
    
} catch {
    $errorResponse = $_.Exception.Response
    Write-Host "`nFAILED!" -ForegroundColor Red
    Write-Host "Status Code: $($errorResponse.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Status Description: $($errorResponse.StatusDescription)" -ForegroundColor Red
    
    # Get the response body
    if ($_.ErrorDetails.Message) {
        Write-Host "`nError Response Body:" -ForegroundColor Yellow
        try {
            $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorBody | ConvertTo-Json -Depth 10 | Write-Host
            
            # Check if it's a validation error
            if ($errorBody.validation_errors) {
                Write-Host "`nValidation Errors:" -ForegroundColor Red
                foreach ($ve in $errorBody.validation_errors) {
                    Write-Host "  - Field: $($ve.field), Message: $($ve.message)" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host $_.ErrorDetails.Message
        }
    }
    
    # Try to get more details
    $stream = $errorResponse.GetResponseStream()
    if ($stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "`nRaw Response Body:" -ForegroundColor Yellow
        Write-Host $responseBody
    }
}

Write-Host "`n=== CloudWatch Logs (last 2 minutes) ===" -ForegroundColor Cyan
aws logs filter-log-events `
    --log-group-name "/aws/lambda/api-handler-dev" `
    --start-time ((Get-Date).AddMinutes(-2).ToUnixTimeMilliseconds()) `
    --filter-pattern "{ $.function_request_id = * }" `
    --query "events[?contains(message, 'registration') || contains(message, 'error') || contains(message, 'exception')].message" `
    --output text | Write-Host

Write-Host "`n=== Testing with curl for comparison ===" -ForegroundColor Cyan
Write-Host "curl command:" -ForegroundColor Yellow
$curlCmd = @"
curl -X POST "$ApiUrl/auth/register" ``
  -H "Content-Type: application/json" ``
  -d '{
    "email": "curl.$timestamp@example.com",
    "password": "CurlPassword123!",
    "firstName": "Curl",
    "lastName": "Test"
  }' ``
  -v
"@
Write-Host $curlCmd -ForegroundColor Gray
Write-Host "`nExecute the curl command above in a separate terminal to compare results" -ForegroundColor Yellow
