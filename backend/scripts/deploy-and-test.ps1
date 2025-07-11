# Deploy and Test Script
Write-Host "`n=== AI Lifestyle App - Deploy and Test ===" -ForegroundColor Cyan

# Step 1: Commit and push changes
Write-Host "`n1. Committing and pushing changes..." -ForegroundColor Yellow
git add .
git commit -m "Fix API Gateway v2 compatibility and error handling in Lambda handlers"
git push

Write-Host "`n2. Deployment triggered via GitHub Actions" -ForegroundColor Yellow
Write-Host "Monitor progress at: https://github.com/john-matlock-eng/ai-lifestyle-app/actions" -ForegroundColor Gray
Write-Host "This usually takes 3-5 minutes..." -ForegroundColor Gray

# Wait for deployment
Write-Host "`n3. Waiting for deployment to complete..." -ForegroundColor Yellow
Write-Host "Press any key once the GitHub Actions workflow shows as completed..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Step 4: Run tests
Write-Host "`n4. Running API tests..." -ForegroundColor Yellow
.\quick-test.ps1

Write-Host "`n5. Checking CloudWatch logs for any errors..." -ForegroundColor Yellow
aws logs tail /aws/lambda/api-handler-dev --since 5m --format short

Write-Host "`n=== Deployment and Testing Complete ===" -ForegroundColor Cyan
