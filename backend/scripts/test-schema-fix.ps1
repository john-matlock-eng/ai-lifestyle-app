# Test Login Fix - Verify DynamoDB Schema Fix
# This script tests that the login works after fixing the DynamoDB schema mismatch

$API_URL = "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com"

Write-Host "`n=== Testing Login Fix ===" -ForegroundColor Cyan
Write-Host "This test verifies the DynamoDB schema fix" -ForegroundColor Gray

# Generate unique user for this test
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testUser = @{
    email = "schematest.$timestamp@example.com"
    password = "TestPassword123!"
    firstName = "Schema"
    lastName = "Test"
}

Write-Host "`n1. Registering test user..." -ForegroundColor Yellow
Write-Host "Email: $($testUser.email)" -ForegroundColor Gray

try {
    $regResponse = Invoke-RestMethod -Uri "$API_URL/auth/register" `
        -Method POST `
        -Body ($testUser | ConvertTo-Json) `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "[SUCCESS] User registered successfully" -ForegroundColor Green
    Write-Host "User ID: $($regResponse.userId)" -ForegroundColor Gray
    
    # Wait a moment for consistency
    Start-Sleep -Seconds 2
    
    Write-Host "`n2. Testing login with registered user..." -ForegroundColor Yellow
    
    $loginData = @{
        email = $testUser.email
        password = $testUser.password
    }
    
    try {
        $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" `
            -Method POST `
            -Body ($loginData | ConvertTo-Json) `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        Write-Host "[SUCCESS] Login successful!" -ForegroundColor Green
        
        # Verify response structure
        if ($loginResponse.accessToken) {
            Write-Host "[PASS] Access token received" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] No access token in response" -ForegroundColor Red
        }
        
        if ($loginResponse.refreshToken) {
            Write-Host "[PASS] Refresh token received" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] No refresh token in response" -ForegroundColor Red
        }
        
        if ($loginResponse.user) {
            Write-Host "[PASS] User profile received" -ForegroundColor Green
            Write-Host "  - User ID: $($loginResponse.user.userId)" -ForegroundColor Gray
            Write-Host "  - Email: $($loginResponse.user.email)" -ForegroundColor Gray
            Write-Host "  - Name: $($loginResponse.user.firstName) $($loginResponse.user.lastName)" -ForegroundColor Gray
            Write-Host "  - Email Verified: $($loginResponse.user.emailVerified)" -ForegroundColor Gray
        } else {
            Write-Host "[FAIL] No user profile in response" -ForegroundColor Red
        }
        
        Write-Host "`n=== DynamoDB Schema Fix Verified! ===" -ForegroundColor Green
        Write-Host "The login endpoint is now working correctly with the proper schema." -ForegroundColor Gray
        
    } catch {
        $statusCode = $null
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
        }
        
        Write-Host "[FAIL] Login failed with status: $statusCode" -ForegroundColor Red
        
        if ($_.ErrorDetails.Message) {
            Write-Host "Error details:" -ForegroundColor Yellow
            try {
                $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
                $errorBody | ConvertTo-Json -Depth 10 | Write-Host
                
                # Check if it's still the schema error
                if ($errorBody.message -like "*Query condition missed key schema element*") {
                    Write-Host "`n[ERROR] The DynamoDB schema fix has not been deployed yet!" -ForegroundColor Red
                    Write-Host "Run: .\deploy-login-fix.ps1" -ForegroundColor Yellow
                }
            } catch {
                Write-Host $_.ErrorDetails.Message
            }
        }
    }
    
} catch {
    $statusCode = $null
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
    }
    
    Write-Host "[FAIL] Registration failed with status: $statusCode" -ForegroundColor Red
    Write-Host "Cannot proceed with login test" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
}

Write-Host "`n"
