# Test API endpoints from PowerShell
# Run this script in PowerShell on Windows

$API_URL = "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com"

Write-Host "Testing AI Lifestyle App API..." -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Basic connectivity
Write-Host "1. Testing API connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$API_URL/" -Method GET -UseBasicParsing
    Write-Host "Response Code: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Response Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Health check
Write-Host "2. Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$API_URL/health" -Method GET -ContentType "application/json"
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Login endpoint with email
Write-Host "3. Testing login endpoint..." -ForegroundColor Yellow
Write-Host "Request: POST $API_URL/auth/login"
Write-Host 'Body: {"email":"test@example.com","password":"Test123!"}'
Write-Host ""

$loginBody = @{
    email = "test@example.com"
    password = "Test123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_URL/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody `
        -Verbose
    
    Write-Host "Success Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get the response body
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}
Write-Host ""

# Test 4: Login with username field
Write-Host "4. Testing login with username field..." -ForegroundColor Yellow
$loginBodyUsername = @{
    username = "test@example.com"
    password = "Test123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$API_URL/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBodyUsername
    
    Write-Host "Success Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: OPTIONS request (CORS preflight)
Write-Host "5. Testing CORS preflight..." -ForegroundColor Yellow
try {
    $headers = @{
        "Origin" = "https://your-cloudfront-domain.com"
        "Access-Control-Request-Method" = "POST"
        "Access-Control-Request-Headers" = "Content-Type"
    }
    
    $response = Invoke-WebRequest -Uri "$API_URL/auth/login" `
        -Method OPTIONS `
        -Headers $headers `
        -UseBasicParsing
    
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "CORS Headers:" -ForegroundColor Green
    $response.Headers | Where-Object { $_.Key -like "Access-Control-*" } | ForEach-Object {
        Write-Host "$($_.Key): $($_.Value)" -ForegroundColor Green
    }
} catch {
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Check if there are any headers in the error response
    if ($_.Exception.Response.Headers) {
        Write-Host "Response Headers:" -ForegroundColor Yellow
        $_.Exception.Response.Headers | ForEach-Object {
            Write-Host "$_" -ForegroundColor Yellow
        }
    }
}
Write-Host ""

Write-Host "Common Issues:" -ForegroundColor Cyan
Write-Host "- If you get 403: CORS not enabled" -ForegroundColor White
Write-Host "- If you get 404: Check if stage name is needed (e.g., /dev or /v1)" -ForegroundColor White
Write-Host "- If you get 400: Check request format (email vs username)" -ForegroundColor White
Write-Host "- If no Access-Control headers: CORS not configured" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
