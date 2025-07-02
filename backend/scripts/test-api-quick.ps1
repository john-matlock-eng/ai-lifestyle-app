# Quick test to check if the API is accessible and responding
# Uses curl for simpler error handling

Write-Host "=== Quick API Health Check ===" -ForegroundColor Green

$API_URL = "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com"

# Test 1: Check if API is reachable
Write-Host "`n1. Testing API health endpoint..." -ForegroundColor Cyan
$healthUrl = "$API_URL/health"
Write-Host "URL: $healthUrl" -ForegroundColor Gray

$curlCommand = "curl -s -o nul -w '%{http_code}' '$healthUrl'"
Write-Host "Command: $curlCommand" -ForegroundColor Gray

# Use Invoke-RestMethod with more error detail
try {
    $response = Invoke-WebRequest -Uri $healthUrl -Method GET -UseBasicParsing
    Write-Host "[SUCCESS] Health check passed! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Health check failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    
    # Try to get more details
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Gray
        Write-Host "Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Gray
    }
}

# Test 2: Check login endpoint with minimal request
Write-Host "`n2. Testing login endpoint availability..." -ForegroundColor Cyan
$loginUrl = "$API_URL/auth/login"
Write-Host "URL: $loginUrl" -ForegroundColor Gray

# Test with empty body to see if endpoint exists
try {
    $response = Invoke-WebRequest -Uri $loginUrl -Method POST -UseBasicParsing -Body "{}" -ContentType "application/json"
    Write-Host "Response received: $($response.StatusCode)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
    
    if ($statusCode -eq 400) {
        Write-Host "[SUCCESS] Endpoint is responding (got 400 Bad Request as expected for empty body)" -ForegroundColor Green
    } elseif ($statusCode -eq 404) {
        Write-Host "[ERROR] Endpoint not found (404)" -ForegroundColor Red
    } elseif ($statusCode -eq 502 -or $statusCode -eq 503) {
        Write-Host "[ERROR] Lambda may not be deployed or is erroring ($statusCode)" -ForegroundColor Red
    } else {
        Write-Host "[WARNING] Unexpected status code: $statusCode" -ForegroundColor Yellow
    }
}

# Test 3: Check with valid JSON but invalid credentials
Write-Host "`n3. Testing login with minimal valid JSON..." -ForegroundColor Cyan
$testData = @{
    email = "test@example.com"
    password = "test"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $testData -ContentType "application/json"
    Write-Host "Unexpected success: $response" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Status Code: $statusCode" -ForegroundColor Yellow
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
}

Write-Host "`n=== Quick Check Complete ===" -ForegroundColor Green
Write-Host "`nIf you're seeing 502/503 errors, the Lambda may need to be deployed with:" -ForegroundColor Yellow
Write-Host ".\deploy-login-fix.ps1" -ForegroundColor Cyan
