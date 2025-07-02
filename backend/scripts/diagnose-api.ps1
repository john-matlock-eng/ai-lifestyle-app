# API Gateway Diagnostic Script
# Helps identify routing issues with the API Gateway

param(
    [string]$ApiEndpoint = "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com"
)

Write-Host "`n=== API Gateway Diagnostic Tool ===" -ForegroundColor Cyan
Write-Host "Testing endpoint: $ApiEndpoint" -ForegroundColor Yellow

function Test-Route {
    param(
        [string]$Method,
        [string]$Path,
        [object]$Body = $null,
        [string]$Description
    )
    
    Write-Host "`n--- Testing: $Description ---" -ForegroundColor Green
    Write-Host "Request: $Method $ApiEndpoint$Path"
    
    $uri = "$ApiEndpoint$Path"
    $headers = @{
        "Content-Type" = "application/json"
        "Accept" = "application/json"
    }
    
    try {
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $headers
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            Write-Host "Body: $($params.Body)"
        }
        
        $response = Invoke-WebRequest @params
        
        Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "Headers:"
        $response.Headers | Format-Table
        Write-Host "Response Body:"
        Write-Host $response.Content
        
        # Try to parse as JSON
        try {
            $jsonResponse = $response.Content | ConvertFrom-Json
            Write-Host "`nParsed JSON:" -ForegroundColor Yellow
            $jsonResponse | ConvertTo-Json -Depth 10 | Write-Host
        } catch {
            # Not JSON, that's okay
        }
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status: $statusCode" -ForegroundColor Red
        
        if ($_.ErrorDetails.Message) {
            Write-Host "Error Response:" -ForegroundColor Red
            Write-Host $_.ErrorDetails.Message
            
            try {
                $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
                Write-Host "`nParsed Error:" -ForegroundColor Yellow
                $errorJson | ConvertTo-Json -Depth 10 | Write-Host
            } catch {
                # Not JSON
            }
        }
    }
}

Write-Host "`n1. Testing various URL patterns to identify the issue..." -ForegroundColor Cyan

# Test 1: Root path
Test-Route -Method "GET" -Path "" -Description "Root path (no slash)"
Test-Route -Method "GET" -Path "/" -Description "Root path (with slash)"

# Test 2: Health endpoint variations
Test-Route -Method "GET" -Path "/health" -Description "Health endpoint"
Test-Route -Method "GET" -Path "/v1/health" -Description "Health with /v1 prefix"
Test-Route -Method "GET" -Path "/dev/health" -Description "Health with /dev prefix"
Test-Route -Method "GET" -Path "/$default/health" -Description "Health with /$default prefix"

# Test 3: Auth endpoints
Test-Route -Method "POST" -Path "/auth/register" -Body @{
    email = "test@example.com"
    password = "TestPassword123!"
    firstName = "Test"
    lastName = "User"
} -Description "Registration endpoint"

# Test 4: Check what the Lambda is actually receiving
Write-Host "`n2. Checking Lambda logs..." -ForegroundColor Cyan
Write-Host "To see what the Lambda is receiving, check CloudWatch logs at:"
Write-Host "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/`$252Faws`$252Flambda`$252Fapi-handler-dev" -ForegroundColor Yellow

Write-Host "`n3. Possible issues and solutions:" -ForegroundColor Cyan
Write-Host "- If all routes return 404 with 'Route   not found', the Lambda might not be receiving the path correctly"
Write-Host "- Check if the API Gateway integration is passing the full event structure"
Write-Host "- Verify the Lambda has the correct IAM permissions"
Write-Host "- Ensure the Lambda was deployed with the latest code that includes the route handlers"

Write-Host "`n4. Next debugging steps:" -ForegroundColor Cyan
Write-Host "1. Run this command to get Terraform outputs:"
Write-Host "   cd ..\terraform; terraform output -json" -ForegroundColor Yellow
Write-Host "2. Check if the Lambda was deployed successfully:"
Write-Host "   aws lambda get-function --function-name api-handler-dev" -ForegroundColor Yellow
Write-Host "3. Test the Lambda directly (bypass API Gateway):"
Write-Host "   aws lambda invoke --function-name api-handler-dev --payload '{""httpMethod"":""GET"",""path"":""/health""}' response.json" -ForegroundColor Yellow

Write-Host "`n5. Testing complete!" -ForegroundColor Green
