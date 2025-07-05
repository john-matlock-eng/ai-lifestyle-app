# Check Deployment Status Script
Write-Host "`n=== AI Lifestyle App - Deployment Status Check ===" -ForegroundColor Cyan
Write-Host "Checking if all resources are deployed and configured..." -ForegroundColor Yellow

$allGood = $true

# Check Terraform outputs
Write-Host "`n1. Checking Terraform Outputs..." -ForegroundColor Green
$originalLocation = Get-Location
try {
    Set-Location "$PSScriptRoot\..\terraform"
    
    # Get outputs
    $outputs = terraform output -json 2>$null | ConvertFrom-Json
    
    if ($outputs) {
        Write-Host "✓ Terraform outputs found:" -ForegroundColor Green
        Write-Host "  - API Endpoint: $($outputs.api_endpoint.value)" -ForegroundColor Gray
        Write-Host "  - ECR Repository: $($outputs.ecr_repository_url.value)" -ForegroundColor Gray
        Write-Host "  - DynamoDB Table: $($outputs.dynamodb_table_name.value)" -ForegroundColor Gray
        Write-Host "  - Cognito Pool ID: $($outputs.cognito_user_pool_id.value)" -ForegroundColor Gray
        Write-Host "  - Lambda ARN: $($outputs.api_lambda_arn.value)" -ForegroundColor Gray
    } else {
        Write-Host "✗ No Terraform outputs found" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "✗ Error getting Terraform outputs: $_" -ForegroundColor Red
    $allGood = $false
} finally {
    Set-Location $originalLocation
}

# Check Lambda function
Write-Host "`n2. Checking Lambda Function..." -ForegroundColor Green
try {
    $lambda = aws lambda get-function --function-name api-handler-dev 2>$null | ConvertFrom-Json
    if ($lambda) {
        Write-Host "✓ Lambda function exists" -ForegroundColor Green
        Write-Host "  - Runtime: $($lambda.Configuration.Runtime)" -ForegroundColor Gray
        Write-Host "  - Last Modified: $($lambda.Configuration.LastModified)" -ForegroundColor Gray
        Write-Host "  - State: $($lambda.Configuration.State)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ Lambda function not found" -ForegroundColor Red
    $allGood = $false
}

# Check API Gateway
Write-Host "`n3. Checking API Gateway..." -ForegroundColor Green
if ($outputs -and $outputs.api_id) {
    try {
        $api = aws apigatewayv2 get-api --api-id $outputs.api_id.value 2>$null | ConvertFrom-Json
        if ($api) {
            Write-Host "✓ API Gateway exists" -ForegroundColor Green
            Write-Host "  - Name: $($api.Name)" -ForegroundColor Gray
            Write-Host "  - Protocol: $($api.ProtocolType)" -ForegroundColor Gray
            Write-Host "  - Endpoint: $($api.ApiEndpoint)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "✗ API Gateway not found" -ForegroundColor Red
        $allGood = $false
    }
}

# Check DynamoDB Table
Write-Host "`n4. Checking DynamoDB Table..." -ForegroundColor Green
try {
    $table = aws dynamodb describe-table --table-name users-dev 2>$null | ConvertFrom-Json
    if ($table) {
        Write-Host "✓ DynamoDB table exists" -ForegroundColor Green
        Write-Host "  - Status: $($table.Table.TableStatus)" -ForegroundColor Gray
        Write-Host "  - Item Count: $($table.Table.ItemCount)" -ForegroundColor Gray
    }
} catch {
    Write-Host "✗ DynamoDB table not found" -ForegroundColor Red
    $allGood = $false
}

# Check Cognito User Pool
Write-Host "`n5. Checking Cognito User Pool..." -ForegroundColor Green
if ($outputs -and $outputs.cognito_user_pool_id) {
    try {
        $pool = aws cognito-idp describe-user-pool --user-pool-id $outputs.cognito_user_pool_id.value 2>$null | ConvertFrom-Json
        if ($pool) {
            Write-Host "✓ Cognito User Pool exists" -ForegroundColor Green
            Write-Host "  - Name: $($pool.UserPool.Name)" -ForegroundColor Gray
            Write-Host "  - Status: $($pool.UserPool.Status)" -ForegroundColor Gray
            Write-Host "  - Users: $($pool.UserPool.EstimatedNumberOfUsers)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "✗ Cognito User Pool not found" -ForegroundColor Red
        $allGood = $false
    }
}

# Summary
Write-Host "`n=== Deployment Summary ===" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✓ All resources are deployed and ready!" -ForegroundColor Green
    Write-Host "`nYou can now test the API:" -ForegroundColor Yellow
    Write-Host "1. Run: .\quick-test.ps1" -ForegroundColor Gray
    Write-Host "2. Or run: .\test-api-interactive.ps1" -ForegroundColor Gray
    
    if ($outputs -and $outputs.api_endpoint) {
        Write-Host "`nAPI Endpoint: $($outputs.api_endpoint.value)" -ForegroundColor Cyan
    }
} else {
    Write-Host "✗ Some resources are missing or misconfigured" -ForegroundColor Red
    Write-Host "`nTroubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check GitHub Actions: https://github.com/john-matlock-eng/ai-lifestyle-app/actions" -ForegroundColor Gray
    Write-Host "2. Run: cd ..\terraform; terraform apply" -ForegroundColor Gray
    Write-Host "3. Check AWS Console for any manual interventions needed" -ForegroundColor Gray
}

Write-Host "`n"
