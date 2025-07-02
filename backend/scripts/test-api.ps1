# Test script for the deployed API endpoints
# PowerShell version for Windows users

param(
    [string]$Environment = "dev",
    [string]$ApiEndpoint = ""
)

# Colors and formatting
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Yellow }
function Write-Test { Write-Host $args -ForegroundColor Cyan }

# Get API endpoint
if ([string]::IsNullOrEmpty($ApiEndpoint)) {
    Write-Info "`nAttempting to get API endpoint from Terraform..."
    $originalLocation = Get-Location

    try {
        Set-Location "$PSScriptRoot\..\terraform"
        
        # Capture terraform output
        $apiEndpoint = terraform output -raw api_endpoint 2>$null
        
        if ([string]::IsNullOrEmpty($apiEndpoint)) {
            Write-Error "Error: Could not get API endpoint from Terraform."
            Write-Info "Please provide the API endpoint using -ApiEndpoint parameter"
            Write-Info "Example: .\test-api.ps1 -ApiEndpoint 'https://your-api-id.execute-api.us-east-1.amazonaws.com/v1'"
            exit 1
        }
        
        Write-Success "API Endpoint: $apiEndpoint"
    }
    catch {
        Write-Error "Error accessing Terraform outputs: $_"
        Write-Info "Please provide the API endpoint using -ApiEndpoint parameter"
        exit 1
    }
    finally {
        Set-Location $originalLocation
    }
}
else {
    $apiEndpoint = $ApiEndpoint.TrimEnd('/')
    Write-Success "Using provided API Endpoint: $apiEndpoint"
}

# Function to make API calls and display results
function Test-ApiEndpoint {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body,
        [string]$Description
    )
    
    Write-Test "`nTesting: $Description"
    Write-Host "Request: $Method $apiEndpoint$Path"
    
    $uri = "$apiEndpoint$Path"
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    try {
        if ($Body) {
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            Write-Host "Body: $jsonBody"
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $jsonBody -ErrorAction Stop
        }
        else {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -ErrorAction Stop
        }
        
        Write-Host "Response:"
        $response | ConvertTo-Json -Depth 10 | Write-Host
        Write-Success "Status: Success"
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Response:"
        
        # Try to parse error response
        try {
            $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
            $errorResponse | ConvertTo-Json -Depth 10 | Write-Host
        }
        catch {
            Write-Host $_.ErrorDetails.Message
        }
        
        if ($statusCode) {
            Write-Error "Status: $statusCode"
        }
        else {
            Write-Error "Status: Failed"
        }
    }
    
    Write-Host ("-" * 50)
}

Write-Info "`n===== AI Lifestyle App API Tests ====="
Write-Info "Environment: $Environment"
Write-Info "Starting tests..."

# Test 1: Health Check
Test-ApiEndpoint -Method "GET" -Path "/health" -Description "Health Check Endpoint"

# Test 2: User Registration - Valid
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$validUser = @{
    email = "test$($timestamp)@example.com"
    password = "TestPassword123!"
    firstName = "Test"
    lastName = "User"
}

Test-ApiEndpoint -Method "POST" -Path "/auth/register" -Body $validUser -Description "User Registration - Valid Request"

# Store the email for duplicate test
$duplicateEmail = $validUser.email

# Test 3: User Registration - Duplicate Email (should fail)
$duplicateUser = @{
    email = $duplicateEmail
    password = "TestPassword123!"
    firstName = "Test"
    lastName = "User"
}

Test-ApiEndpoint -Method "POST" -Path "/auth/register" -Body $duplicateUser -Description "User Registration - Duplicate Email (should return 409)"

# Test 4: User Registration - Invalid Password
$invalidPasswordUser = @{
    email = "invalid$($timestamp)@example.com"
    password = "weak"
    firstName = "Test"
    lastName = "User"
}

Test-ApiEndpoint -Method "POST" -Path "/auth/register" -Body $invalidPasswordUser -Description "User Registration - Invalid Password (should return 400)"

# Test 5: User Registration - Missing Fields
$missingFieldsUser = @{
    email = "missing$($timestamp)@example.com"
}

Test-ApiEndpoint -Method "POST" -Path "/auth/register" -Body $missingFieldsUser -Description "User Registration - Missing Fields (should return 400)"

# Test 6: User Registration - Invalid Email Format
$invalidEmailUser = @{
    email = "not-an-email"
    password = "TestPassword123!"
    firstName = "Test"
    lastName = "User"
}

Test-ApiEndpoint -Method "POST" -Path "/auth/register" -Body $invalidEmailUser -Description "User Registration - Invalid Email Format (should return 400)"

# Summary
Write-Success "`nAll tests completed!"
Write-Info "`nNext steps:"
Write-Info "1. Check CloudWatch Logs for detailed execution logs"
Write-Info "2. Verify user was created in Cognito User Pool"
Write-Info "3. Check DynamoDB table for user record"
Write-Info "`nAWS Console Links:"
Write-Info "- CloudWatch Logs: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups"
Write-Info "- Cognito: https://console.aws.amazon.com/cognito/home?region=us-east-1"
Write-Info "- DynamoDB: https://console.aws.amazon.com/dynamodbv2/home?region=us-east-1#tables"

# Interactive test option
Write-Host "`n"
$continue = Read-Host "Would you like to test with a custom email? (y/n)"

if ($continue -eq 'y') {
    $customEmail = Read-Host "Enter email address"
    Write-Host "Password requirements: min 8 chars, uppercase, lowercase, number, special char"
    $customPassword = Read-Host "Enter password"
    $customFirstName = Read-Host "Enter first name"
    $customLastName = Read-Host "Enter last name"
    
    $customUser = @{
        email = $customEmail
        password = $customPassword
        firstName = $customFirstName
        lastName = $customLastName
    }
    
    Test-ApiEndpoint -Method "POST" -Path "/auth/register" -Body $customUser -Description "User Registration - Custom User"
}

Write-Info "`nTip: For a more interactive testing experience, try: .\test-api-interactive.ps1"
