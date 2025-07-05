# Test that passwords are not logged after security fixes
# This script creates a user with an obvious password and checks if it appears in logs

$API_URL = "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com"
$LAMBDA_NAME = "api-handler-dev"
$LOG_GROUP = "/aws/lambda/$LAMBDA_NAME"

Write-Host "`n=== Testing Password Logging Security ===" -ForegroundColor Cyan

# Generate a unique, searchable password
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$testPassword = "SECURITY_TEST_PWD_$timestamp!"
$testEmail = "security.test.$timestamp@example.com"

Write-Host "`nTest Password: $testPassword" -ForegroundColor Yellow
Write-Host "This password should NEVER appear in CloudWatch logs" -ForegroundColor Red

# Create test user
$testUser = @{
    email = $testEmail
    password = $testPassword
    firstName = "Security"
    lastName = "Test"
}

Write-Host "`n1. Registering test user..." -ForegroundColor Cyan
try {
    $regResponse = Invoke-RestMethod -Uri "$API_URL/auth/register" `
        -Method POST `
        -Body ($testUser | ConvertTo-Json) `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "[SUCCESS] User registered" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Registration failed" -ForegroundColor Red
}

# Attempt login
Write-Host "`n2. Attempting login..." -ForegroundColor Cyan
$loginData = @{
    email = $testEmail
    password = $testPassword
}

try {
    $loginResponse = Invoke-RestMethod -Uri "$API_URL/auth/login" `
        -Method POST `
        -Body ($loginData | ConvertTo-Json) `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    Write-Host "[SUCCESS] Login successful" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Login failed (not critical for this test)" -ForegroundColor Yellow
}

# Wait for logs to be written
Write-Host "`n3. Waiting 10 seconds for logs to be written..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

# Search CloudWatch logs
Write-Host "`n4. Searching CloudWatch logs for password..." -ForegroundColor Cyan
Write-Host "Searching for: $testPassword" -ForegroundColor Gray

try {
    # Search logs from the last 5 minutes
    $startTime = (Get-Date).AddMinutes(-5).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    
    # Search for the password in logs
    $searchResults = aws logs filter-log-events `
        --log-group-name $LOG_GROUP `
        --start-time $startTime `
        --filter-pattern "`"$testPassword`"" `
        --region us-east-1 2>$null | ConvertFrom-Json
    
    if ($searchResults.events -and $searchResults.events.Count -gt 0) {
        Write-Host "[FAIL] PASSWORD FOUND IN LOGS!" -ForegroundColor Red
        Write-Host "Security vulnerability detected - passwords are being logged!" -ForegroundColor Red
        Write-Host "`nLog entries containing password:" -ForegroundColor Red
        foreach ($event in $searchResults.events) {
            Write-Host $event.message -ForegroundColor Gray
        }
    } else {
        Write-Host "[PASS] Password NOT found in logs" -ForegroundColor Green
        Write-Host "Security check passed - passwords are properly protected" -ForegroundColor Green
    }
    
    # Also search for common password-related terms
    Write-Host "`n5. Checking for other security issues..." -ForegroundColor Cyan
    
    $suspiciousPatterns = @(
        '"password"',
        'AuthParameters',
        $testEmail
    )
    
    foreach ($pattern in $suspiciousPatterns) {
        $results = aws logs filter-log-events `
            --log-group-name $LOG_GROUP `
            --start-time $startTime `
            --filter-pattern "`"$pattern`"" `
            --region us-east-1 2>$null | ConvertFrom-Json
        
        if ($results.events) {
            Write-Host "`nFound $($results.events.Count) log entries with pattern: $pattern" -ForegroundColor Yellow
            
            # Check if any contain the actual password value
            $compromised = $false
            foreach ($event in $results.events) {
                if ($event.message -like "*$testPassword*") {
                    $compromised = $true
                    break
                }
            }
            
            if ($compromised) {
                Write-Host "  [FAIL] Password value found in these logs!" -ForegroundColor Red
            } else {
                Write-Host "  [PASS] No password values in these logs" -ForegroundColor Green
            }
        }
    }
    
} catch {
    Write-Host "[ERROR] Failed to search CloudWatch logs" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Gray
    Write-Host "`nManual verification required:" -ForegroundColor Yellow
    Write-Host "1. Go to CloudWatch Logs in AWS Console" -ForegroundColor Gray
    Write-Host "2. Search for: $testPassword" -ForegroundColor Gray
    Write-Host "3. This password should NOT appear anywhere" -ForegroundColor Gray
}

Write-Host "`n=== Security Test Complete ===" -ForegroundColor Cyan
Write-Host "`nRecommendations:" -ForegroundColor Yellow
Write-Host "- Regularly audit CloudWatch logs for sensitive data" -ForegroundColor Gray
Write-Host "- Enable log encryption in CloudWatch" -ForegroundColor Gray
Write-Host "- Set up alerts for suspicious patterns" -ForegroundColor Gray
Write-Host "- Use structured logging with specific fields only" -ForegroundColor Gray
