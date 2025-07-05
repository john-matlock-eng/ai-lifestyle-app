# API Information Summary
Write-Host "`n=== AI Lifestyle App API Information ===" -ForegroundColor Cyan

Write-Host "`nAPI Details:" -ForegroundColor Yellow
Write-Host "  API URL:        https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com" -ForegroundColor Gray
Write-Host "  API Gateway ID: 3sfkg1mc0c" -ForegroundColor Gray
Write-Host "  AWS Region:     us-east-1" -ForegroundColor Gray

Write-Host "`nKey Endpoints:" -ForegroundColor Yellow
Write-Host "  Health Check:   GET  /health" -ForegroundColor Gray
Write-Host "  Registration:   POST /auth/register" -ForegroundColor Gray
Write-Host "  Login:          POST /auth/login" -ForegroundColor Gray

Write-Host "`nQuick Test Commands:" -ForegroundColor Yellow
Write-Host "  .\quick-validate.ps1     # Quick API health check" -ForegroundColor Gray
Write-Host "  .\test-registration-valid.ps1  # Test registration flow" -ForegroundColor Gray
Write-Host "  .\test-login-fixed.ps1   # Test login endpoint" -ForegroundColor Gray
Write-Host "  .\diagnose-api.ps1      # Full system diagnostics" -ForegroundColor Gray

Write-Host "`nExample cURL Commands:" -ForegroundColor Yellow
Write-Host '  # Health Check' -ForegroundColor Gray
Write-Host '  curl https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/health' -ForegroundColor DarkGray

Write-Host "`n  # Registration" -ForegroundColor Gray
Write-Host '  curl -X POST https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/register \' -ForegroundColor DarkGray
Write-Host '    -H "Content-Type: application/json" \' -ForegroundColor DarkGray
Write-Host '    -d ''{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User"}''' -ForegroundColor DarkGray

Write-Host "`n  # Login" -ForegroundColor Gray
Write-Host '  curl -X POST https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/login \' -ForegroundColor DarkGray
Write-Host '    -H "Content-Type: application/json" \' -ForegroundColor DarkGray
Write-Host '    -d ''{"email":"test@example.com","password":"Test123!"}''' -ForegroundColor DarkGray

Write-Host "`n"
