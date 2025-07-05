# Comprehensive diagnostic script for API issues
# This helps identify whether the issue is with deployment, connectivity, or the code

Write-Host "=== API Diagnostics Script ===" -ForegroundColor Green
Write-Host "This script will help diagnose issues with the API" -ForegroundColor Gray

$Environment = "dev"
$API_URL = "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com"
$API_ID = "3sfkg1mc0c"  # Extracted from the URL
$AWS_REGION = "us-east-1"
$LAMBDA_NAME = "api-handler-$Environment"

# Test 1: Check DNS Resolution
Write-Host "`n1. Checking DNS resolution..." -ForegroundColor Cyan
try {
    $dnsResult = Resolve-DnsName "3sfkg1mc0c.execute-api.us-east-1.amazonaws.com" -ErrorAction Stop
    Write-Host "[SUCCESS] DNS resolves to: $($dnsResult.IPAddress)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] DNS resolution failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Gray
}

# Test 2: Check Lambda Function Status
Write-Host "`n2. Checking Lambda function status..." -ForegroundColor Cyan
try {
    $lambdaInfo = aws lambda get-function --function-name $LAMBDA_NAME --region $AWS_REGION 2>$null | ConvertFrom-Json
    
    if ($lambdaInfo) {
        Write-Host "[SUCCESS] Lambda function exists" -ForegroundColor Green
        Write-Host "  - State: $($lambdaInfo.Configuration.State)" -ForegroundColor Gray
        Write-Host "  - Last Modified: $($lambdaInfo.Configuration.LastModified)" -ForegroundColor Gray
        Write-Host "  - Runtime: $($lambdaInfo.Configuration.Runtime)" -ForegroundColor Gray
        Write-Host "  - Image URI: $($lambdaInfo.Configuration.ImageConfigResponse.ImageUri)" -ForegroundColor Gray
        
        if ($lambdaInfo.Configuration.State -ne "Active") {
            Write-Host "[WARNING] Lambda is not in Active state!" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[ERROR] Lambda function not found or not accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Failed to get Lambda info" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Gray
}

# Test 3: Check Recent Lambda Logs
Write-Host "`n3. Checking recent Lambda logs..." -ForegroundColor Cyan
try {
    $logGroupName = "/aws/lambda/$LAMBDA_NAME"
    $logs = aws logs tail $logGroupName --since 5m --region $AWS_REGION 2>$null
    
    if ($logs) {
        Write-Host "Recent log entries:" -ForegroundColor Gray
        $logs | Select-Object -Last 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
    } else {
        Write-Host "No recent logs found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Could not retrieve logs" -ForegroundColor Yellow
}

# Test 4: Check API Gateway
Write-Host "`n4. Checking API Gateway..." -ForegroundColor Cyan
try {
    # Get specific API by ID
    $apiInfo = aws apigatewayv2 get-api --api-id $API_ID --region $AWS_REGION 2>$null | ConvertFrom-Json
    
    if ($apiInfo) {
        Write-Host "[SUCCESS] API Gateway found" -ForegroundColor Green
        Write-Host "  - Name: $($apiInfo.Name)" -ForegroundColor Gray
        Write-Host "  - ID: $($apiInfo.ApiId)" -ForegroundColor Gray
        Write-Host "  - Endpoint: $($apiInfo.ApiEndpoint)" -ForegroundColor Gray
        
        # Check routes
        $routes = aws apigatewayv2 get-routes --api-id $API_ID --region $AWS_REGION 2>$null | ConvertFrom-Json
        $loginRoute = $routes.Items | Where-Object { $_.RouteKey -eq "POST /auth/login" }
        
        if ($loginRoute) {
            Write-Host "[SUCCESS] Login route exists" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] Login route not found in API Gateway" -ForegroundColor Red
        }
    } else {
        Write-Host "[ERROR] API Gateway not found" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Failed to check API Gateway" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Gray
}

# Test 5: Simple connectivity test
Write-Host "`n5. Testing basic connectivity..." -ForegroundColor Cyan
$testUrl = "$API_URL/health"
Write-Host "Testing: $testUrl" -ForegroundColor Gray

$ProgressPreference = 'SilentlyContinue'
try {
    $response = Invoke-WebRequest -Uri $testUrl -Method GET -TimeoutSec 10 -UseBasicParsing
    Write-Host "[SUCCESS] API is responding! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "[ERROR] API returned error: $statusCode" -ForegroundColor Red
    } else {
        Write-Host "[ERROR] Cannot connect to API" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
}
$ProgressPreference = 'Continue'

# Test 6: Check ECR Image
Write-Host "`n6. Checking ECR image..." -ForegroundColor Cyan
try {
    $ECR_REPO = "lifestyle-app-$Environment"
    $images = aws ecr describe-images --repository-name $ECR_REPO --region $AWS_REGION 2>$null | ConvertFrom-Json
    
    if ($images.imageDetails) {
        $latestImage = $images.imageDetails | Sort-Object -Property imagePushedAt -Descending | Select-Object -First 1
        Write-Host "[SUCCESS] ECR image found" -ForegroundColor Green
        Write-Host "  - Pushed at: $($latestImage.imagePushedAt)" -ForegroundColor Gray
        Write-Host "  - Size: $([math]::Round($latestImage.imageSizeInBytes / 1MB, 2)) MB" -ForegroundColor Gray
        Write-Host "  - Tags: $($latestImage.imageTags -join ', ')" -ForegroundColor Gray
    } else {
        Write-Host "[ERROR] No images found in ECR repository" -ForegroundColor Red
    }
} catch {
    Write-Host "[ERROR] Failed to check ECR" -ForegroundColor Red
}

# Summary
Write-Host "`n=== Diagnostic Summary ===" -ForegroundColor Green
Write-Host "If you're seeing issues, try these steps:" -ForegroundColor Yellow
Write-Host "1. If Lambda doesn't exist or is not Active: Deploy with GitHub Actions or .\deploy-login-fix.ps1" -ForegroundColor Gray
Write-Host "2. If routes are missing: Check API Gateway configuration" -ForegroundColor Gray
Write-Host "3. If ECR image is old: Rebuild and push the Docker image" -ForegroundColor Gray
Write-Host "4. If logs show errors: Check the error messages for specific issues" -ForegroundColor Gray
