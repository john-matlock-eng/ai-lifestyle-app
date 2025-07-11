Write-Host "Quick API Login Test - Copy this entire block and paste in PowerShell:" -ForegroundColor Cyan
Write-Host '
# Test login endpoint
$result = try { 
    Invoke-RestMethod -Uri "https://3sfkg1mc0c.execute-api.us-east-1.amazonaws.com/auth/login" -Method POST -ContentType "application/json" -Body "{""email"":""test@example.com"",""password"":""Test123!""}" 
    Write-Host "SUCCESS! API is working" -ForegroundColor Green
} catch { 
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Details: $responseBody" -ForegroundColor Yellow
        Write-Host "`nStatus Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
        
        # Check for CORS headers
        Write-Host "`nHeaders:" -ForegroundColor Cyan
        $_.Exception.Response.Headers | ForEach-Object { Write-Host $_ }
    }
    Write-Host "`nLikely Issues:" -ForegroundColor Cyan
    Write-Host "- If 403: Enable CORS in API Gateway" -ForegroundColor White
    Write-Host "- If 404: Add stage name like /dev to the URL" -ForegroundColor White
    Write-Host "- If 400: Check error details above" -ForegroundColor White
}
' -ForegroundColor White
