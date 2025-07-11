# Deploy login fix to AWS Lambda
# This script builds and deploys the updated Lambda with login fixes

param(
    [string]$Environment = "dev"
)

Write-Host "=== Deploying Login Fix to Lambda ===" -ForegroundColor Green

# Variables
$AWS_REGION = if ($env:AWS_REGION) { $env:AWS_REGION } else { "us-east-1" }
$AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
$ECR_REPO = "lifestyle-app-$Environment"
$ECR_URI = "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO"
$IMAGE_TAG = "latest"
$LAMBDA_NAME = "api-handler-$Environment"

Write-Host "Environment: $Environment" -ForegroundColor Cyan
Write-Host "AWS Region: $AWS_REGION" -ForegroundColor Cyan
Write-Host "ECR Repository: $ECR_URI" -ForegroundColor Cyan
Write-Host "Lambda Function: $LAMBDA_NAME" -ForegroundColor Cyan

# Navigate to source directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Split-Path -Parent $scriptPath
$srcPath = Join-Path $backendPath "src"
Set-Location $srcPath

# Build Docker image
Write-Host "`nBuilding Docker image..." -ForegroundColor Yellow
docker build -t "${ECR_REPO}:${IMAGE_TAG}" .
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker build failed!" -ForegroundColor Red
    exit 1
}

# Tag image for ECR
docker tag "${ECR_REPO}:${IMAGE_TAG}" "${ECR_URI}:${IMAGE_TAG}"

# Login to ECR
Write-Host "`nLogging in to ECR..." -ForegroundColor Yellow
$loginCommand = aws ecr get-login-password --region $AWS_REGION
$loginCommand | docker login --username AWS --password-stdin $ECR_URI
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] ECR login failed!" -ForegroundColor Red
    exit 1
}

# Push image to ECR
Write-Host "`nPushing image to ECR..." -ForegroundColor Yellow
docker push "${ECR_URI}:${IMAGE_TAG}"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker push failed!" -ForegroundColor Red
    exit 1
}

# Update Lambda function
Write-Host "`nUpdating Lambda function..." -ForegroundColor Yellow
aws lambda update-function-code `
    --function-name $LAMBDA_NAME `
    --image-uri "${ECR_URI}:${IMAGE_TAG}" `
    --region $AWS_REGION

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Lambda update failed!" -ForegroundColor Red
    exit 1
}

# Wait for update to complete
Write-Host "`nWaiting for Lambda update to complete..." -ForegroundColor Yellow
$maxWaitTime = 300  # 5 minutes
$startTime = Get-Date
$timeout = $false

while ($true) {
    $functionInfo = aws lambda get-function --function-name $LAMBDA_NAME --region $AWS_REGION | ConvertFrom-Json
    $updateStatus = $functionInfo.Configuration.LastUpdateStatus
    
    if ($updateStatus -eq "Successful") {
        Write-Host "[SUCCESS] Lambda update completed successfully!" -ForegroundColor Green
        break
    } elseif ($updateStatus -eq "Failed") {
        Write-Host "[ERROR] Lambda update failed!" -ForegroundColor Red
        Write-Host "Reason: $($functionInfo.Configuration.LastUpdateStatusReason)" -ForegroundColor Red
        exit 1
    }
    
    $elapsed = (Get-Date) - $startTime
    if ($elapsed.TotalSeconds -gt $maxWaitTime) {
        Write-Host "[ERROR] Lambda update timed out after 5 minutes" -ForegroundColor Red
        $timeout = $true
        break
    }
    
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 5
}

if (-not $timeout) {
    # Get Lambda status
    Write-Host "`nLambda function status:" -ForegroundColor Green
    aws lambda get-function `
        --function-name $LAMBDA_NAME `
        --region $AWS_REGION `
        --query 'Configuration.[FunctionName,State,LastUpdateStatus,LastModified]' `
        --output table

    Write-Host "`n=== Deployment Complete! ===" -ForegroundColor Green
    Write-Host "`nTest the updated endpoints:" -ForegroundColor Cyan
    Write-Host "  .\quick-validate.ps1         # Quick validation" -ForegroundColor Gray
    Write-Host "  .\test-registration-valid.ps1    # Full registration test" -ForegroundColor Gray
    Write-Host "  .\test-login-fixed.ps1       # Login test" -ForegroundColor Gray
}
