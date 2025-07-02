# Quick Test Script for API Endpoints
param(
    [string]$ApiUrl = "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com"
)

Write-Host "`n=== Quick API Test ===" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Green
try {
    $health = Invoke-RestMethod -Uri "$ApiUrl/health" -Method GET
    Write-Host "✓ Health Check Success!" -ForegroundColor Green
    Write-Host "  Status: $($health.status)"
    Write-Host "  DynamoDB: $($health.checks.dynamodb.status)"
} catch {
    Write-Host "✗ Health Check Failed: $_" -ForegroundColor Red
}

# Test 2: Debug Endpoint
Write-Host "`n2. Testing Debug Endpoint..." -ForegroundColor Green
try {
    $debug = Invoke-RestMethod -Uri "$ApiUrl/debug" -Method GET
    Write-Host "✓ Debug Success!" -ForegroundColor Green
    Write-Host "  API Gateway Version: $($debug.api_gateway_version)"
    Write-Host "  Method: $($debug.extracted_info.method)"
    Write-Host "  Path: $($debug.extracted_info.path)"
} catch {
    Write-Host "✗ Debug Failed: $_" -ForegroundColor Red
}

# Test 3: User Registration
Write-Host "`n3. Testing User Registration..." -ForegroundColor Green
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testUser = @{
    email = "test.$timestamp@example.com"
    password = "TestPassword123!"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "$ApiUrl/auth/register" -Method POST -Body $testUser -ContentType "application/json"
    Write-Host "✓ Registration Success!" -ForegroundColor Green
    Write-Host "  User ID: $($register.userId)"
    Write-Host "  Email: $($register.email)"
    
    # Test 4: Login with the registered user
    Write-Host "`n4. Testing User Login..." -ForegroundColor Green
    $loginData = @{
        email = "test.$timestamp@example.com"
        password = "TestPassword123!"
    } | ConvertTo-Json
    
    try {
        $login = Invoke-RestMethod -Uri "$ApiUrl/auth/login" -Method POST -Body $loginData -ContentType "application/json"
        Write-Host "✓ Login Success!" -ForegroundColor Green
        Write-Host "  Access Token: $($login.accessToken.Substring(0, 20))..."
        Write-Host "  Token Type: $($login.tokenType)"
        Write-Host "  Expires In: $($login.expiresIn) seconds"
    } catch {
        Write-Host "✗ Login Failed: $_" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ Registration Failed: $_" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $error = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "  Error: $($error.error)" -ForegroundColor Red
        Write-Host "  Message: $($error.message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
Write-Host "Check CloudWatch Logs for details:" -ForegroundColor Yellow
Write-Host "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/%24252Faws%24252Flambda%24252Fapi-handler-dev" -ForegroundColor Yellow
