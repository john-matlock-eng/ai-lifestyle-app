# Quick validation test for the API
# This script performs basic tests to verify the API is working

param(
    [string]$ApiUrl = "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com"
)

Write-Host "`n=== Quick API Validation Test ===" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl" -ForegroundColor Gray

# Test 1: Health Check
Write-Host "`n1. Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$ApiUrl/health" -Method GET -ErrorAction Stop
    Write-Host "[PASS] Health check successful" -ForegroundColor Green
    if ($health) {
        $health | ConvertTo-Json | Write-Host
    }
} catch {
    Write-Host "[FAIL] Health check failed" -ForegroundColor Red
    if ($_.Exception.Message) {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
}

# Test 2: Registration Endpoint (with invalid data to test validation)
Write-Host "`n2. Registration Validation Test..." -ForegroundColor Yellow
$invalidData = @{
    email = "test"
    password = "123"
}

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/auth/register" -Method POST `
        -Body ($invalidData | ConvertTo-Json) -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "[FAIL] Expected validation error but got success" -ForegroundColor Red
} catch {
    $statusCode = $null
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
    }
    
    if ($statusCode -eq 400) {
        Write-Host "[PASS] Validation working correctly (400 Bad Request)" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Unexpected status code: $statusCode" -ForegroundColor Red
    }
}

# Test 3: Login Endpoint (test if it exists)
Write-Host "`n3. Login Endpoint Test..." -ForegroundColor Yellow
$testLogin = @{
    email = "nonexistent@example.com"
    password = "TestPassword123!"
}

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/auth/login" -Method POST `
        -Body ($testLogin | ConvertTo-Json) -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "[INFO] Login endpoint returned success (unexpected)" -ForegroundColor Yellow
} catch {
    $statusCode = $null
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
    }
    
    if ($statusCode -eq 401) {
        Write-Host "[PASS] Login endpoint working (401 for invalid credentials)" -ForegroundColor Green
    } elseif ($statusCode -eq 404) {
        Write-Host "[FAIL] Login endpoint not found (404)" -ForegroundColor Red
    } else {
        Write-Host "[INFO] Login endpoint returned: $statusCode" -ForegroundColor Yellow
    }
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "If any tests failed, run these diagnostics:" -ForegroundColor Yellow
Write-Host "  1. .\diagnose-api.ps1        # Full system diagnostics" -ForegroundColor Gray
Write-Host "  2. .\deploy-login-fix.ps1    # Deploy latest code" -ForegroundColor Gray
Write-Host "  3. .\test-registration-valid.ps1  # Full registration test" -ForegroundColor Gray
