# Comprehensive API Test Script
param(
    [string]$ApiUrl = "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com"
)

Write-Host "`n=== AI Lifestyle App - Comprehensive API Test ===" -ForegroundColor Cyan

# Test 1: Test the minimal handler
Write-Host "`n1. Testing Minimal Registration Handler..." -ForegroundColor Green
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testData = @{
    email = "minimal.$timestamp@example.com"
    password = "MinimalTest123!"
    firstName = "Minimal"
    lastName = "Test"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/auth/register-test" -Method POST -Body $testData -ContentType "application/json" -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "Error: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}

# Test 2: Test the real handler with curl
Write-Host "`n2. Testing Real Registration Handler with verbose output..." -ForegroundColor Green
$testData2 = @{
    email = "real.$timestamp@example.com"
    password = "RealTest123!"
    firstName = "Real"
    lastName = "Test"
}

Write-Host "Request Body:" -ForegroundColor Yellow
$testData2 | ConvertTo-Json | Write-Host

# Use .NET WebClient for more control
Write-Host "`nUsing .NET HttpWebRequest for detailed debugging..." -ForegroundColor Cyan
$request = [System.Net.HttpWebRequest]::Create("$ApiUrl/auth/register")
$request.Method = "POST"
$request.ContentType = "application/json"
$request.Accept = "application/json"

$body = $testData2 | ConvertTo-Json
$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)
$request.ContentLength = $bytes.Length

try {
    $stream = $request.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
    
    $response = $request.GetResponse()
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    
    $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response Body:" -ForegroundColor Yellow
    $responseBody | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
    
} catch [System.Net.WebException] {
    $errorResponse = $_.Exception.Response
    Write-Host "Status: $($errorResponse.StatusCode)" -ForegroundColor Red
    
    if ($errorResponse) {
        $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Error Response Body:" -ForegroundColor Yellow
        Write-Host $errorBody
        
        try {
            $errorBody | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
        } catch {
            # Not JSON
        }
    }
}

# Test 3: Check latest logs
Write-Host "`n3. Checking CloudWatch Logs (last 3 minutes)..." -ForegroundColor Green
$logs = aws logs filter-log-events `
    --log-group-name "/aws/lambda/api-handler-dev" `
    --start-time ((Get-Date).AddMinutes(-3).ToUnixTimeMilliseconds()) `
    --query "events[*].[timestamp,message]" `
    --output text

Write-Host "Recent log entries:" -ForegroundColor Yellow
$logs | Select-Object -Last 20 | ForEach-Object { Write-Host $_ }

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan

# Provide troubleshooting tips
Write-Host "`nTroubleshooting Tips:" -ForegroundColor Yellow
Write-Host "1. If minimal handler works but real handler doesn't, issue is with PowerTools or service initialization"
Write-Host "2. If both fail with 400, check API Gateway configuration"
Write-Host "3. If logs show handler completing but no response logged, check Lambda timeout or memory"
Write-Host "4. Check if environment variables are set correctly in Lambda configuration"
