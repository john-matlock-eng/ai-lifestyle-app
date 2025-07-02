# Test login endpoint after fixes
# This script tests that login works with the updated handler

$API_URL = "https://lifestyle-api-dev.john-ai.com"

Write-Host "=== Testing Login After Fixes ===" -ForegroundColor Green

# Use the user we created in the previous test
$loginData = @{
    email = "validuser.1751421730@example.com"
    password = "ValidPassword123!"
} | ConvertTo-Json

Write-Host "`n1. Testing login with valid credentials..." -ForegroundColor Cyan
Write-Host "Request:" -ForegroundColor Gray
$loginData | Write-Host

try {
    $response = Invoke-RestMethod -Uri "$API_URL/auth/login" `
        -Method POST `
        -Body $loginData `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "`n✅ Login successful!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    # Check if we got tokens
    if ($response.accessToken -and $response.refreshToken) {
        Write-Host "`n✅ Received JWT tokens!" -ForegroundColor Green
        Write-Host "Token Type: $($response.tokenType)" -ForegroundColor Gray
        Write-Host "Expires In: $($response.expiresIn) seconds" -ForegroundColor Gray
        
        # Display user info
        if ($response.user) {
            Write-Host "`nUser Profile:" -ForegroundColor Cyan
            Write-Host "- User ID: $($response.user.userId)" -ForegroundColor Gray
            Write-Host "- Email: $($response.user.email)" -ForegroundColor Gray
            Write-Host "- Name: $($response.user.firstName) $($response.user.lastName)" -ForegroundColor Gray
            Write-Host "- Email Verified: $($response.user.emailVerified)" -ForegroundColor Gray
            Write-Host "- MFA Enabled: $($response.user.mfaEnabled)" -ForegroundColor Gray
        }
    }
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "`n❌ Login failed: $statusCode" -ForegroundColor Red
    
    try {
        $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
        $errorBody | ConvertTo-Json -Depth 10 | Write-Host
    } catch {
        Write-Host $_.ErrorDetails.Message
    }
}

Write-Host "`n2. Testing login with invalid password..." -ForegroundColor Cyan
$invalidLoginData = @{
    email = "validuser.1751421730@example.com"
    password = "WrongPassword123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_URL/auth/login" `
        -Method POST `
        -Body $invalidLoginData `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "❌ Unexpected success!" -ForegroundColor Red
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✅ Correctly rejected with 401 Unauthorized!" -ForegroundColor Green
        
        try {
            $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
            if ($errorBody.error -eq "INVALID_CREDENTIALS") {
                Write-Host "✅ Correct error code: INVALID_CREDENTIALS" -ForegroundColor Green
            }
        } catch {}
    } else {
        Write-Host "❌ Unexpected status code: $statusCode" -ForegroundColor Red
    }
}

Write-Host "`n3. Testing login with non-existent user..." -ForegroundColor Cyan
$nonExistentLoginData = @{
    email = "nonexistent@example.com"
    password = "Password123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_URL/auth/login" `
        -Method POST `
        -Body $nonExistentLoginData `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "❌ Unexpected success!" -ForegroundColor Red
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✅ Correctly rejected with 401 Unauthorized!" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected status code: $statusCode" -ForegroundColor Red
    }
}

Write-Host "`n=== Login Testing Complete ===" -ForegroundColor Green
