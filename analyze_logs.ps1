# ============================================
# PesaFlow Log Analyzer
# ============================================
# This script analyzes PM2 logs and identifies
# common error patterns to help diagnose issues
# ============================================

param(
    [int]$Lines = 100,
    [string]$Service = "all"
)

$ErrorActionPreference = "Continue"

function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Warning { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Header { param($msg) Write-Host "`n================================================" -ForegroundColor Blue; Write-Host "$msg" -ForegroundColor Blue; Write-Host "================================================" -ForegroundColor Blue }

$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$OUTPUT_FILE = "c:\Users\Metto\Desktop\Anti gravity\log_analysis_$TIMESTAMP.txt"

Write-Header "LOG ANALYSIS TOOL"
Write-Info "Analyzing last $Lines lines of logs..."
Write-Info "Service filter: $Service"

# Start transcript
Start-Transcript -Path $OUTPUT_FILE -Append

# Check if PM2 is available
$pm2Cmd = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2Cmd) {
    Write-Error "PM2 not found. Please install PM2 globally: npm install -g pm2"
    Stop-Transcript
    exit 1
}

# Get PM2 process list
Write-Header "PM2 PROCESS STATUS"
pm2 status

# Define services to check
$services = @()
if ($Service -eq "all") {
    $services = @("pesaflow-api", "pesaflow-web", "mclinic-api", "mclinic-web")
} else {
    $services = @($Service)
}

# Error patterns to look for
$errorPatterns = @{
    "Database Connection" = @(
        "ECONNREFUSED.*3306",
        "Can't connect to MySQL",
        "Access denied for user",
        "Unknown database",
        "Prisma.*connection",
        "P1001",
        "P1002",
        "P1003"
    )
    "Port Issues" = @(
        "EADDRINUSE",
        "port.*already in use",
        "listen EADDRINUSE"
    )
    "Module Errors" = @(
        "Cannot find module",
        "MODULE_NOT_FOUND",
        "Error: Cannot find"
    )
    "Authentication" = @(
        "jwt.*invalid",
        "Unauthorized",
        "Authentication failed",
        "Invalid token"
    )
    "M-Pesa API" = @(
        "MPESA.*error",
        "STK.*failed",
        "Daraja.*error"
    )
    "Build/Compilation" = @(
        "SyntaxError",
        "TypeError",
        "ReferenceError",
        "compilation.*failed"
    )
    "License Issues" = @(
        "License.*invalid",
        "License.*expired",
        "License.*not found"
    )
}

# Analyze each service
foreach ($svc in $services) {
    Write-Header "ANALYZING: $svc"
    
    # Check if service exists
    $svcInfo = pm2 describe $svc 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Service '$svc' not found in PM2"
        continue
    }
    
    # Get logs
    Write-Info "Fetching last $Lines lines of logs..."
    $logs = pm2 logs $svc --lines $Lines --nostream --raw 2>&1 | Out-String
    
    if ([string]::IsNullOrWhiteSpace($logs)) {
        Write-Warning "No logs found for $svc"
        continue
    }
    
    # Display recent logs
    Write-Host "`nRecent logs:" -ForegroundColor White
    Write-Host "----------------------------------------" -ForegroundColor Gray
    $logs -split "`n" | Select-Object -Last 20 | ForEach-Object {
        Write-Host $_ -ForegroundColor Gray
    }
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    # Analyze for error patterns
    Write-Host "`nError Pattern Analysis:" -ForegroundColor Yellow
    $foundErrors = $false
    
    foreach ($category in $errorPatterns.Keys) {
        $patterns = $errorPatterns[$category]
        $matches = @()
        
        foreach ($pattern in $patterns) {
            $found = $logs | Select-String -Pattern $pattern -AllMatches
            if ($found) {
                $matches += $found
            }
        }
        
        if ($matches.Count -gt 0) {
            $foundErrors = $true
            Write-Error "$category Issues Found ($($matches.Count) occurrences)"
            
            # Show unique error messages
            $uniqueErrors = $matches | Select-Object -ExpandProperty Line | Select-Object -Unique | Select-Object -First 3
            foreach ($err in $uniqueErrors) {
                Write-Host "  - $($err.Trim())" -ForegroundColor Red
            }
        }
    }
    
    if (-not $foundErrors) {
        Write-Success "No common error patterns detected"
    }
    
    # Check restart count
    $restartCount = pm2 describe $svc 2>&1 | Select-String "restart time" | Out-String
    if ($restartCount -match "(\d+)") {
        $count = [int]$matches[1]
        if ($count -gt 5) {
            Write-Warning "Service has restarted $count times - indicates instability"
        } elseif ($count -gt 0) {
            Write-Info "Service has restarted $count times"
        }
    }
}

# Summary and Recommendations
Write-Header "SUMMARY & RECOMMENDATIONS"

Write-Info "Common Solutions:"
Write-Host "  1. Database Connection Issues:" -ForegroundColor White
Write-Host "     - Verify MySQL is running: Get-Service MySQL" -ForegroundColor Gray
Write-Host "     - Check DATABASE_URL in .env file" -ForegroundColor Gray
Write-Host "     - Test connection: npx prisma db push" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Port Already in Use:" -ForegroundColor White
Write-Host "     - Find process: netstat -ano | findstr :<PORT>" -ForegroundColor Gray
Write-Host "     - Kill process: taskkill /PID <PID> /F" -ForegroundColor Gray
Write-Host "     - Or change PORT in .env" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Module Not Found:" -ForegroundColor White
Write-Host "     - Reinstall dependencies: npm install" -ForegroundColor Gray
Write-Host "     - Regenerate Prisma: npx prisma generate" -ForegroundColor Gray
Write-Host "     - Rebuild: npm run build" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Service Keeps Crashing:" -ForegroundColor White
Write-Host "     - Check logs: pm2 logs <service-name>" -ForegroundColor Gray
Write-Host "     - Restart: pm2 restart <service-name>" -ForegroundColor Gray
Write-Host "     - Delete and recreate: pm2 delete <service-name> && pm2 start ..." -ForegroundColor Gray

Write-Host ""
Write-Success "Log analysis complete!"
Write-Info "Full report saved to: $OUTPUT_FILE"

Stop-Transcript

# Display the output file
Write-Host "`nOpening log analysis report..." -ForegroundColor Cyan
notepad $OUTPUT_FILE
