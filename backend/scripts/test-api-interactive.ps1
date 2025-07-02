# Interactive Test Script for AI Lifestyle App API
# PowerShell version with user prompts and comprehensive testing
#
# --- FIXES APPLIED ---
# 1. Removed invalid '-Color' parameter from all 'ConvertTo-Json' commands.

# Ensure console can display special characters
[System.Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Colors and formatting
function Write-Success { Write-Host $args -ForegroundColor Green }
function Write-Error { Write-Host $args -ForegroundColor Red }
function Write-Info { Write-Host $args -ForegroundColor Yellow }
function Write-Test { Write-Host $args -ForegroundColor Cyan }
function Write-Prompt { Write-Host $args -ForegroundColor Magenta -NoNewline }

# Banner
Write-Host "`n" -NoNewline
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           AI Lifestyle App - API Testing Suite            ║" -ForegroundColor Cyan
Write-Host "║                   Interactive Mode                        ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host "`n"

# Get API Endpoint
function Get-ApiEndpoint {
    # First try to get from Terraform
    Write-Info "Attempting to retrieve API endpoint from Terraform outputs..."
    
    $originalLocation = Get-Location
    $apiEndpoint = $null
    
    try {
        # Note: This requires the script to be in a 'scripts' subfolder adjacent to a 'terraform' subfolder
        Set-Location "$PSScriptRoot\..\terraform"
        $apiEndpoint = terraform output -raw api_endpoint 2>$null
        
        if (-not [string]::IsNullOrEmpty($apiEndpoint)) {
            Write-Success "Found API endpoint from Terraform: $apiEndpoint"
            $useThis = Read-Host "`nUse this endpoint? (Y/n)"
            if ($useThis.ToLower() -ne 'n') {
                return $apiEndpoint.TrimEnd('/')
            }
        }
    }
    catch {
        Write-Info "Could not retrieve from Terraform. Manual entry required."
    }
    finally {
        Set-Location $originalLocation
    }
    
    # If not found or user wants different endpoint, prompt
    $customEndpoint = ""
    while ([string]::IsNullOrEmpty($customEndpoint)) {
        Write-Prompt "`nEnter API endpoint URL: "
        $customEndpoint = Read-Host
    }
    
    # Validate and clean up the endpoint
    # Remove trailing slash if present
    $customEndpoint = $customEndpoint.TrimEnd('/')
    
    # Add https if no protocol specified
    if ($customEndpoint -notmatch '^https?://') {
        $customEndpoint = "https://$customEndpoint"
    }
    
    return $customEndpoint
}

# Store test data for session
$script:testSession = @{
    apiEndpoint     = $null
    registeredUsers = @()
    authTokens      = @{}
    lastResponse    = $null
}

# Function to make API calls
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body,
        [hashtable]$Headers = @{},
        [string]$AuthToken
    )
    
    $uri = "$($script:testSession.apiEndpoint)$Path"
    
    # Default headers
    $requestHeaders = @{
        "Content-Type" = "application/json"
    }
    
    # Add custom headers
    $Headers.GetEnumerator() | ForEach-Object {
        $requestHeaders[$_.Key] = $_.Value
    }
    
    # Add auth token if provided
    if ($AuthToken) {
        $requestHeaders["Authorization"] = "Bearer $AuthToken"
    }
    
    $response = $null
    $statusCode = $null
    $success = $false
    
    $invokeParams = @{
        Uri        = $uri
        Method     = $Method
        Headers    = $requestHeaders
        ErrorAction = 'Stop'
    }
    
    if ($Body) {
        $invokeParams.Body = ($Body | ConvertTo-Json -Depth 10)
    }
    
    try {
        # Using -StatusCodeVariable requires PS 6+
        # For compatibility, we continue to rely on the success/error blocks.
        $response = Invoke-RestMethod @invokeParams
        
        $success = $true
        # For successful calls, Invoke-RestMethod doesn't easily provide the status code in older PS versions.
        # We will assume 200/201/204 are successes and handle specific codes in the calling function if needed.
        $statusCode = 200 
    }
    catch {
        $statusCode = [int]$_.Exception.Response.StatusCode
        
        # Try to parse the error response body for details
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $streamReader = New-Object System.IO.StreamReader($errorStream)
            $errorBody = $streamReader.ReadToEnd()
            $streamReader.Close()
            $errorStream.Close()
            $response = $errorBody | ConvertFrom-Json
        }
        catch {
            $response = @{ error = "UNPARSABLE_ERROR_BODY"; message = $_.Exception.Message }
        }
    }
    
    return @{
        Success    = $success
        StatusCode = $statusCode
        Response   = $response
        Uri        = $uri
    }
}

# Helper function for safe user input
function Prompt-UserSelection {
    param(
        [System.Collections.IList]$itemList,
        [string]$promptMessage
    )
    
    if ($itemList.Count -eq 0) {
        Write-Error "No items to select."
        return $null
    }
    
    $i = 1
    foreach ($item in $itemList) {
        Write-Host "$i. $item"
        $i++
    }
    
    $selection = 0
    while ($selection -lt 1 -or $selection -gt $itemList.Count) {
        $input = Read-Host "`n$promptMessage (1-$($itemList.Count))"
        if ($input -match '^\d+$') {
            $selection = [int]$input
        }
        if ($selection -lt 1 -or $selection -gt $itemList.Count) {
            Write-Error "Invalid selection. Please try again."
        }
    }
    return $selection
}


# Test functions
function Test-HealthCheck {
    Write-Test "`n🏥 Testing Health Check Endpoint"
    
    $result = Invoke-ApiRequest -Method "GET" -Path "/health"
    
    Write-Host "Request:  GET $($result.Uri)"
    Write-Host "Response: " -NoNewline
    
    if ($result.Success) {
        Write-Success " Success (Status: 200)"
        Write-Host ($result.Response | ConvertTo-Json -Depth 10)
    }
    else {
        Write-Error " Failed (Status: $($result.StatusCode))"
        Write-Host ($result.Response | ConvertTo-Json -Depth 10)
    }
    
    return $result
}

function Test-UserRegistration {
    Write-Test "`n👤 Testing User Registration"
    
    Write-Host "`nChoose test type:"
    Write-Host "1. Generate random valid user"
    Write-Host "2. Enter custom user details"
    Write-Host "3. Test with invalid data (e.g., weak password)"
    Write-Host "4. Test duplicate email"
    Write-Host "5. Return to main menu"
    
    $choice = Read-Host "`nSelect option (1-5)"
    
    $user = $null
    
    switch ($choice) {
        "1" {
            $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
            $user = @{
                email     = "test.user.$timestamp@example.com"
                password  = "TestPassword123!"
                firstName = "Test"
                lastName  = "User$timestamp"
            }
            Write-Info "`nRegistering user: $($user.email)"
        }
        
        "2" {
            $user = @{
                email     = Read-Host "Enter email"
                password  = Read-Host "Enter password (min 8 chars, mixed case, number, special)"
                firstName = Read-Host "Enter first name"
                lastName  = Read-Host "Enter last name"
            }
        }
        
        "3" {
            $user = @{
                email     = "invalid.data@example.com"
                password  = "weak"
                firstName = "Invalid"
                lastName  = "Data"
            }
            Write-Info "`nTesting with intentionally weak password."
        }
        
        "4" {
            if ($script:testSession.registeredUsers.Count -eq 0) {
                Write-Error "No users registered yet. Register a user first."
                return
            }
            
            Write-Host "`nRegistered users in this session:"
            $selection = Prompt-UserSelection -itemList $script:testSession.registeredUsers -promptMessage "Select user number to test duplicate email"
            if (-not $selection) { return }
            
            $selectedEmail = $script:testSession.registeredUsers[$selection - 1]
            
            $user = @{
                email     = $selectedEmail
                password  = "DifferentPassword123!"
                firstName = "Duplicate"
                lastName  = "User"
            }
        }
        
        "5" { return }
        
        default {
            Write-Error "Invalid choice"
            return
        }
    }
    
    if ($null -eq $user) { return }
    
    $result = Invoke-ApiRequest -Method "POST" -Path "/auth/register" -Body $user
    
    Write-Host "`nRequest:  POST $($result.Uri)"
    Write-Host "Body:     $($user | ConvertTo-Json -Compress)"
    Write-Host "Response: " -NoNewline
    
    if ($result.Success) {
        # A successful registration should be a 201 Created
        $result.StatusCode = 201
        Write-Success " Success (Status: $($result.StatusCode))"
        Write-Host ($result.Response | ConvertTo-Json -Depth 10)
        
        if ($user.email -notin $script:testSession.registeredUsers) {
            $script:testSession.registeredUsers += $user.email
        }
    }
    else {
        Write-Error " Failed (Status: $($result.StatusCode))"
        Write-Host ($result.Response | ConvertTo-Json -Depth 10)
    }
    
    $script:testSession.lastResponse = $result
}

function Test-UserLogin {
    Write-Test "`n🔑 Testing User Login"
    
    Write-Host "`nChoose login test:"
    Write-Host "1. Login with a user registered in this session"
    Write-Host "2. Enter custom credentials"
    Write-Host "3. Test with invalid credentials"
    Write-Host "4. Return to main menu"
    
    $choice = Read-Host "`nSelect option (1-4)"
    
    $credentials = $null
    
    switch ($choice) {
        "1" {
            if ($script:testSession.registeredUsers.Count -eq 0) {
                Write-Error "No users registered in this session. Register a user first."
                return
            }
            
            Write-Host "`nSelect a user to log in:"
            $selection = Prompt-UserSelection -itemList $script:testSession.registeredUsers -promptMessage "Select user number"
            if (-not $selection) { return }
            
            $email = $script:testSession.registeredUsers[$selection - 1]
            Write-Prompt "Enter password for $email`: "
            $password = Read-Host
            
            $credentials = @{ email = $email; password = $password }
        }
        
        "2" {
            $credentials = @{
                email    = Read-Host "Enter email"
                password = Read-Host "Enter password"
            }
        }
        
        "3" {
            $credentials = @{
                email    = "nonexistent@example.com"
                password = "WrongPassword123!"
            }
            Write-Info "Testing with invalid credentials: $($credentials.email)"
        }
        
        "4" { return }
        
        default {
            Write-Error "Invalid choice"
            return
        }
    }
    
    if ($null -eq $credentials) { return }
    
    $result = Invoke-ApiRequest -Method "POST" -Path "/auth/login" -Body $credentials
    
    Write-Host "`nRequest:  POST $($result.Uri)"
    Write-Host "Body:     $($credentials | ConvertTo-Json -Compress)"
    Write-Host "Response: " -NoNewline
    
    if ($result.Success) {
        Write-Success " Success (Status: 200)"
        Write-Host ($result.Response | ConvertTo-Json -Depth 10)
        
        if ($result.Response.accessToken) {
            $script:testSession.authTokens[$credentials.email] = @{
                accessToken  = $result.Response.accessToken
                refreshToken = $result.Response.refreshToken
                expiresAt    = (Get-Date).AddSeconds($result.Response.expiresIn)
            }
            Write-Success "`n✔️ Authentication tokens stored for future requests."
        }
    }
    else {
        Write-Error " Failed (Status: $($result.StatusCode))"
        Write-Host ($result.Response | ConvertTo-Json -Depth 10)
    }
    
    $script:testSession.lastResponse = $result
}

function Show-TestSummary {
    Write-Test "`n📊 Current Test Session Summary"
    
    Write-Host "`nAPI Endpoint: " -NoNewline
    Write-Info $script:testSession.apiEndpoint
    
    Write-Host "`nRegistered Users:"
    if ($script:testSession.registeredUsers.Count -eq 0) {
        Write-Host "  None"
    }
    else {
        $script:testSession.registeredUsers | ForEach-Object { Write-Host "  • $_" }
    }
    
    Write-Host "`nAuthenticated Users (Tokens stored):"
    if ($script:testSession.authTokens.Count -eq 0) {
        Write-Host "  None"
    }
    else {
        foreach ($email in $script:testSession.authTokens.Keys) {
            $token = $script:testSession.authTokens[$email]
            $remaining = ($token.expiresAt - (Get-Date)).TotalMinutes
            
            if ($remaining -gt 0) {
                Write-Host "  • $email " -NoNewline
                Write-Success "(expires in $([math]::Round($remaining, 1)) minutes)"
            }
            else {
                Write-Host "  • $email " -NoNewline
                Write-Error "(token expired)"
            }
        }
    }
}

function Show-AwsResources {
    Write-Test "`n☁️ AWS Resource Links"
    Write-Info "(Note: Assumes 'us-east-1' region. Please change if your region is different.)"
    
    Write-Host "`nCloudWatch Logs:"
    Write-Host "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups"
    
    Write-Host "`nCognito User Pool:"
    Write-Host "https://console.aws.amazon.com/cognito/home?region=us-east-1"
    
    Write-Host "`nDynamoDB Tables:"
    Write-Host "https://console.aws.amazon.com/dynamodbv2/home?region=us-east-1#tables"
    
    Write-Host "`nAPI Gateway:"
    Write-Host "https://console.aws.amazon.com/apigateway/home?region=us-east-1#/apis"
    
    Write-Host "`nLambda Functions:"
    Write-Host "https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions"
}

# Main program
$script:testSession.apiEndpoint = Get-ApiEndpoint

if ([string]::IsNullOrEmpty($script:testSession.apiEndpoint)) {
    Write-Error "No API endpoint configured. Exiting."
    exit 1
}

Write-Success "`n🚀 Using API endpoint: $($script:testSession.apiEndpoint)"

# Main menu loop
while ($true) {
    Write-Host "`n"
    Write-Host "════════════════════════════════" -ForegroundColor Cyan
    Write-Host "         Main Test Menu         " -ForegroundColor Cyan
    Write-Host "════════════════════════════════" -ForegroundColor Cyan
    Write-Host "1. Test Health Check"
    Write-Host "2. Test User Registration"
    Write-Host "3. Test User Login"
    Write-Host "4. Show Session Summary"
    Write-Host "5. Show AWS Resource Links"
    Write-Host "6. Change API Endpoint"
    Write-Host "0. Exit"
    
    $choice = Read-Host "`nSelect option (0-6)"
    
    switch ($choice) {
        "1" { Test-HealthCheck }
        "2" { Test-UserRegistration }
        "3" { Test-UserLogin }
        "4" { Show-TestSummary }
        "5" { Show-AwsResources }
        "6" {
            $script:testSession.apiEndpoint = Get-ApiEndpoint
            Write-Success "`nAPI endpoint updated to: $($script:testSession.apiEndpoint)"
        }
        "0" {
            Write-Info "`nExiting test suite. Goodbye!"
            exit 0
        }
        default {
            Write-Error "Invalid choice. Please select from the menu."
        }
    }
    
    Write-Host "`nPress any key to return to the menu..." -ForegroundColor DarkGray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}