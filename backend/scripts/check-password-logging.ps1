# Script to check for potential password logging in the codebase
# This helps identify any places where sensitive data might be logged

Write-Host "`n=== Checking for Potential Password Logging ===" -ForegroundColor Cyan

$sourceDir = Join-Path (Split-Path -Parent $PSScriptRoot) "src"
Write-Host "Scanning directory: $sourceDir" -ForegroundColor Gray

# Patterns to look for that might indicate password logging
$suspiciousPatterns = @(
    'password',
    'body',
    'request\.',
    'credentials',
    'auth_params',
    'AuthParameters',
    'json\.dumps\(.*event',
    'logger.*request',
    'print.*request',
    'console\.log'
)

$findings = @()

# Search Python files
Get-ChildItem -Path $sourceDir -Filter "*.py" -Recurse | ForEach-Object {
    $file = $_
    $lineNumber = 0
    
    Get-Content $file.FullName | ForEach-Object {
        $lineNumber++
        $line = $_
        
        foreach ($pattern in $suspiciousPatterns) {
            if ($line -match $pattern -and $line -match '(log|print|console)') {
                # Check if it's actually logging something potentially sensitive
                if ($line -notmatch '(error|warning|info)\s*\(' -or 
                    $line -match '(password|body|request|credentials)') {
                    
                    # Skip if it's a comment
                    if ($line.Trim().StartsWith("#")) { continue }
                    
                    # Skip if it's logging just the keys
                    if ($line -match 'keys\(\)') { continue }
                    
                    # Skip if it's a docstring
                    if ($line -match '"""') { continue }
                    
                    $findings += [PSCustomObject]@{
                        File = $file.FullName.Replace($sourceDir, "").TrimStart("\")
                        Line = $lineNumber
                        Content = $line.Trim()
                        Pattern = $pattern
                    }
                }
            }
        }
    }
}

if ($findings.Count -gt 0) {
    Write-Host "`nPotential issues found:" -ForegroundColor Yellow
    
    $findings | Group-Object File | ForEach-Object {
        Write-Host "`nFile: $($_.Name)" -ForegroundColor Cyan
        $_.Group | ForEach-Object {
            Write-Host "  Line $($_.Line): $($_.Content)" -ForegroundColor Gray
            if ($_.Content -match 'password' -and $_.Content -match '(log|print)') {
                Write-Host "    [HIGH RISK] Possible password logging!" -ForegroundColor Red
            } elseif ($_.Content -match 'body' -and $_.Content -match '(log|print)') {
                Write-Host "    [MEDIUM RISK] Possible request body logging" -ForegroundColor Yellow
            } else {
                Write-Host "    [LOW RISK] Review for sensitive data" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host "`nRecommendations:" -ForegroundColor Yellow
    Write-Host "1. Never log request bodies that might contain passwords" -ForegroundColor Gray
    Write-Host "2. Use structured logging with specific fields only" -ForegroundColor Gray
    Write-Host "3. Sanitize or redact sensitive fields before logging" -ForegroundColor Gray
    Write-Host "4. Log only necessary metadata (email, user ID, etc.)" -ForegroundColor Gray
} else {
    Write-Host "`n[SUCCESS] No obvious password logging found!" -ForegroundColor Green
    Write-Host "Note: Manual review is still recommended" -ForegroundColor Gray
}

# Check for specific good practices
Write-Host "`n=== Checking Security Best Practices ===" -ForegroundColor Cyan

$goodPractices = @{
    "Password field validation" = 'password.*Field.*exclude.*true'
    "Redacted logging" = 'redacted|sanitized|<hidden>'
    "Structured logging" = 'logger\.info.*extra='
    "No print statements in production" = '^(?!.*#).*print\('
}

foreach ($practice in $goodPractices.GetEnumerator()) {
    $found = $false
    Get-ChildItem -Path $sourceDir -Filter "*.py" -Recurse | ForEach-Object {
        if (Select-String -Path $_.FullName -Pattern $practice.Value -Quiet) {
            $found = $true
        }
    }
    
    if ($practice.Key -eq "No print statements in production") {
        # Invert the logic for this check
        if ($found) {
            Write-Host "[WARNING] $($practice.Key): Found print statements" -ForegroundColor Yellow
        } else {
            Write-Host "[PASS] $($practice.Key)" -ForegroundColor Green
        }
    } else {
        if ($found) {
            Write-Host "[PASS] $($practice.Key)" -ForegroundColor Green
        } else {
            Write-Host "[INFO] $($practice.Key): Not found" -ForegroundColor Gray
        }
    }
}

Write-Host "`n"
