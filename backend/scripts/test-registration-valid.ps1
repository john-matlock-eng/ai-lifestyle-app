# Test Registration with Valid Data
param(
    [string]$ApiUrl = "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com"
)

Write-Host "`n=== Testing Registration with Valid Data ===" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl" -ForegroundColor Gray

# Test 1: Valid registration
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$validUser = @{
    email = "validuser.$timestamp@example.com"
    password = "ValidPassword123!"
    firstName = "John"
    lastName = "Smith"  # No numbers, valid pattern
}

Write-Host "`n1. Testing with valid user data..." -ForegroundColor Green
Write-Host "Request:" -ForegroundColor Yellow
$validUser | ConvertTo-Json | Write-Host

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/auth/register" -Method POST `
        -Body ($validUser | ConvertTo-Json) -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "`n[SUCCESS] User registered!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    # Save user data for login test
    $registeredEmail = $validUser.email
    $registeredPassword = $validUser.password
    
    # Test 2: Try to register same email (should fail with 409)
    Write-Host "`n2. Testing duplicate email (should fail)..." -ForegroundColor Green
    try {
        $dupResponse = Invoke-RestMethod -Uri "$ApiUrl/auth/register" -Method POST `
            -Body ($validUser | ConvertTo-Json) -ContentType "application/json" `
            -ErrorAction Stop
            
        Write-Host "[ERROR] Duplicate registration succeeded when it should have failed!" -ForegroundColor Red
    } catch {
        $statusCode = $null
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
        }
        
        if ($statusCode -eq 409) {
            Write-Host "[SUCCESS] Correctly rejected duplicate email with 409!" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Unexpected error code: $statusCode" -ForegroundColor Red
        }
        
        if ($_.ErrorDetails.Message) {
            try {
                $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
                $errorBody | ConvertTo-Json -Depth 10 | Write-Host
            } catch {
                Write-Host "Raw error: $($_.ErrorDetails.Message)" -ForegroundColor Gray
            }
        }
    }
    
    # Test 3: Login with the registered user
    Write-Host "`n3. Testing login with registered user..." -ForegroundColor Green
    $loginData = @{
        email = $registeredEmail
        password = $registeredPassword
    }
    
    try {
        $loginResponse = Invoke-RestMethod -Uri "$ApiUrl/auth/login" -Method POST `
            -Body ($loginData | ConvertTo-Json) -ContentType "application/json" `
            -ErrorAction Stop
            
        Write-Host "[SUCCESS] Login successful!" -ForegroundColor Green
        if ($loginResponse.accessToken) {
            Write-Host "Access Token: $($loginResponse.accessToken.Substring(0, [Math]::Min(50, $loginResponse.accessToken.Length)))..." -ForegroundColor Gray
        }
        if ($loginResponse.user -and $loginResponse.user.email) {
            Write-Host "User: $($loginResponse.user.email)" -ForegroundColor Gray
        }
    } catch {
        $statusCode = $null
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
        }
        
        Write-Host "[ERROR] Login failed with status: $statusCode" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            try {
                $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
                $errorBody | ConvertTo-Json -Depth 10 | Write-Host
            } catch {
                Write-Host "Raw error: $($_.ErrorDetails.Message)" -ForegroundColor Gray
            }
        }
    }
    
} catch {
    $statusCode = $null
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
    }
    
    Write-Host "`n[ERROR] Registration failed!" -ForegroundColor Red
    Write-Host "Status: $statusCode" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        try {
            $errorBody = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "Error Response:" -ForegroundColor Yellow
            $errorBody | ConvertTo-Json -Depth 10 | Write-Host
            
            if ($errorBody.validation_errors) {
                Write-Host "`nValidation Errors:" -ForegroundColor Red
                foreach ($err in $errorBody.validation_errors) {
                    Write-Host "  - Field: $($err.field)" -ForegroundColor Red
                    Write-Host "    Message: $($err.message)" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host "Raw error: $($_.ErrorDetails.Message)" -ForegroundColor Gray
        }
    } else {
        Write-Host "Full error: $_" -ForegroundColor Gray
    }
}

# Test 4: Test various validation patterns
Write-Host "`n4. Testing validation patterns..." -ForegroundColor Green

$testCases = @(
    @{
        desc = "Numbers in name (invalid)"
        data = @{
            email = "test.numbers.$timestamp@example.com"
            password = "TestPassword123!"
            firstName = "John123"
            lastName = "Smith456"
        }
        shouldFail = $true
    },
    @{
        desc = "Special chars in name (invalid)"
        data = @{
            email = "test.special.$timestamp@example.com"
            password = "TestPassword123!"
            firstName = "John@"
            lastName = "Smith#"
        }
        shouldFail = $true
    },
    @{
        desc = "Hyphenated name (valid)"
        data = @{
            email = "test.hyphen.$timestamp@example.com"
            password = "TestPassword123!"
            firstName = "Mary-Jane"
            lastName = "Smith-Jones"
        }
        shouldFail = $false
    },
    @{
        desc = "Weak password (invalid)"
        data = @{
            email = "test.weak.$timestamp@example.com"
            password = "weak"
            firstName = "John"
            lastName = "Doe"
        }
        shouldFail = $true
    }
)

foreach ($test in $testCases) {
    Write-Host "`n  Testing: $($test.desc)" -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/auth/register" -Method POST `
            -Body ($test.data | ConvertTo-Json) -ContentType "application/json" `
            -ErrorAction Stop
            
        if ($test.shouldFail) {
            Write-Host "    [ERROR] Expected failure but succeeded!" -ForegroundColor Red
        } else {
            Write-Host "    [SUCCESS] Success as expected!" -ForegroundColor Green
        }
    } catch {
        if ($test.shouldFail) {
            Write-Host "    [SUCCESS] Failed as expected!" -ForegroundColor Green
            if ($_.ErrorDetails.Message) {
                try {
                    $error = $_.ErrorDetails.Message | ConvertFrom-Json
                    if ($error.validation_errors) {
                        foreach ($ve in $error.validation_errors) {
                            Write-Host "       - $($ve.field): $($ve.message)" -ForegroundColor Gray
                        }
                    }
                } catch {
                    # Ignore JSON parse errors for validation display
                }
            }
        } else {
            Write-Host "    [ERROR] Unexpected failure!" -ForegroundColor Red
            if ($_.ErrorDetails.Message) {
                Write-Host "       Error: $($_.ErrorDetails.Message)" -ForegroundColor Gray
            }
        }
    }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "[INFO] Test completed" -ForegroundColor Green

Write-Host "`nValidation Rules:" -ForegroundColor Yellow
Write-Host "- Names: Only letters, spaces, and hyphens allowed (no numbers or special characters)" -ForegroundColor Gray
Write-Host "- Passwords: Minimum 8 characters with uppercase, lowercase, number, and special character" -ForegroundColor Gray
Write-Host "- Email addresses: Must be unique and in valid format" -ForegroundColor Gray
Write-Host "- All fields are required" -ForegroundColor Gray

# Test connectivity
Write-Host "`n=== API Health Check ===" -ForegroundColor Cyan
try {
    $healthResponse = Invoke-RestMethod -Uri "$ApiUrl/health" -Method GET -ErrorAction Stop
    Write-Host "[SUCCESS] API is healthy" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Health check failed - API may be down or not deployed" -ForegroundColor Yellow
    Write-Host "Run .\diagnose-api.ps1 for detailed diagnostics" -ForegroundColor Yellow
}
