# ============================================
# PesaFlow Connection Diagnostic Script
# ============================================
# This script checks all connection settings,
# logs, and identifies root causes of errors
# ============================================

$ErrorActionPreference = "Continue"

# Colors for output
function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Warning { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Header { param($msg) Write-Host "`n================================================" -ForegroundColor Blue; Write-Host "$msg" -ForegroundColor Blue; Write-Host "================================================" -ForegroundColor Blue }

# Configuration
$PROJECT_ROOT = "c:\Users\Metto\Desktop\Anti gravity"
$BACKEND_PATH = "$PROJECT_ROOT\backend"
$FRONTEND_PATH = "$PROJECT_ROOT\frontend"
$EXPECTED_API_PORT = 5454
$EXPECTED_WEB_PORT = 5054
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$OUTPUT_FILE = "$PROJECT_ROOT\diagnostic_report_$TIMESTAMP.txt"

# Start logging
Start-Transcript -Path $OUTPUT_FILE -Append

Write-Header "PESAFLOW CONNECTION DIAGNOSTIC"
Write-Info "Timestamp: $(Get-Date)"
Write-Info "Report will be saved to: $OUTPUT_FILE"

# ============================================
# 1. CHECK PORT CONFIGURATION
# ============================================
Write-Header "1. PORT CONFIGURATION CHECK"

# Check backend .env file
$backendEnvPath = "$BACKEND_PATH\.env"
if (Test-Path $backendEnvPath) {
    Write-Success "Backend .env file found"
    Write-Info "Backend .env contents:"
    Get-Content $backendEnvPath | ForEach-Object {
        if ($_ -match "PORT|DATABASE|MYSQL") {
            Write-Host "  $_" -ForegroundColor White
        }
    }
    
    # Extract PORT value
    $portLine = Get-Content $backendEnvPath | Where-Object { $_ -match "^PORT=" }
    if ($portLine) {
        $configuredPort = $portLine -replace "PORT=", ""
        if ($configuredPort -eq $EXPECTED_API_PORT) {
            Write-Success "Backend PORT is correctly set to $EXPECTED_API_PORT"
        } else {
            Write-Error "Backend PORT is $configuredPort but should be $EXPECTED_API_PORT"
        }
    } else {
        Write-Warning "PORT not found in .env file"
    }
    
    # Check DATABASE_URL
    $dbUrlLine = Get-Content $backendEnvPath | Where-Object { $_ -match "^DATABASE_URL=" }
    if ($dbUrlLine) {
        Write-Success "DATABASE_URL found in .env"
        # Parse connection string (hide password)
        $dbUrl = $dbUrlLine -replace "DATABASE_URL=", ""
        $dbUrlSafe = $dbUrl -replace ":[^:@]+@", ":****@"
        Write-Info "  Connection: $dbUrlSafe"
        
        # Extract database details
        if ($dbUrl -match "mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
            $dbUser = $matches[1]
            $dbHost = $matches[3]
            $dbPort = $matches[4]
            $dbName = $matches[5]
            
            Write-Info "  User: $dbUser"
            Write-Info "  Host: $dbHost"
            Write-Info "  Port: $dbPort"
            Write-Info "  Database: $dbName"
        }
    } else {
        Write-Error "DATABASE_URL not found in .env file"
    }
} else {
    Write-Error "Backend .env file not found at $backendEnvPath"
    Write-Warning "This is likely the root cause of connection issues!"
}

# Check frontend .env files
$frontendEnvPath = "$FRONTEND_PATH\.env.local"
if (Test-Path $frontendEnvPath) {
    Write-Success "Frontend .env.local file found"
    $apiUrlLine = Get-Content $frontendEnvPath | Where-Object { $_ -match "NEXT_PUBLIC_API_URL" }
    if ($apiUrlLine) {
        Write-Info "  $apiUrlLine"
        if ($apiUrlLine -match ":$EXPECTED_API_PORT") {
            Write-Success "Frontend API URL points to correct port $EXPECTED_API_PORT"
        } else {
            Write-Error "Frontend API URL does not point to port $EXPECTED_API_PORT"
        }
    }
} else {
    Write-Warning "Frontend .env.local not found"
}

# ============================================
# 2. CHECK RUNNING PROCESSES
# ============================================
Write-Header "2. RUNNING PROCESSES CHECK"

# Check if Node.js processes are running
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Success "Found $($nodeProcesses.Count) Node.js process(es) running"
    $nodeProcesses | ForEach-Object {
        Write-Info "  PID: $($_.Id) | CPU: $($_.CPU) | Memory: $([math]::Round($_.WorkingSet64/1MB, 2)) MB"
    }
} else {
    Write-Warning "No Node.js processes found running"
}

# Check listening ports
Write-Info "`nChecking listening ports..."
$listeningPorts = netstat -ano | Select-String "LISTENING"

# Check API port
if ($listeningPorts -match ":$EXPECTED_API_PORT\s") {
    Write-Success "Port $EXPECTED_API_PORT is LISTENING (Backend API)"
    $apiPortLine = ($listeningPorts | Select-String ":$EXPECTED_API_PORT\s").Line
    if ($apiPortLine -match "\s+(\d+)$") {
        $pid = $matches[1]
        Write-Info "  Process ID: $pid"
    }
} else {
    Write-Error "Port $EXPECTED_API_PORT is NOT listening (Backend API not running)"
}

# Check Web port
if ($listeningPorts -match ":$EXPECTED_WEB_PORT\s") {
    Write-Success "Port $EXPECTED_WEB_PORT is LISTENING (Frontend)"
    $webPortLine = ($listeningPorts | Select-String ":$EXPECTED_WEB_PORT\s").Line
    if ($webPortLine -match "\s+(\d+)$") {
        $pid = $matches[1]
        Write-Info "  Process ID: $pid"
    }
} else {
    Write-Error "Port $EXPECTED_WEB_PORT is NOT listening (Frontend not running)"
}

# ============================================
# 3. CHECK DATABASE CONNECTION
# ============================================
Write-Header "3. DATABASE CONNECTION CHECK"

if (Test-Path $backendEnvPath) {
    $dbUrlLine = Get-Content $backendEnvPath | Where-Object { $_ -match "^DATABASE_URL=" }
    if ($dbUrlLine) {
        $dbUrl = $dbUrlLine -replace "DATABASE_URL=", ""
        
        # Parse connection details
        if ($dbUrl -match "mysql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)") {
            $dbUser = $matches[1]
            $dbPass = $matches[2]
            $dbHost = $matches[3]
            $dbPort = $matches[4]
            $dbName = $matches[5]
            
            # Test MySQL connection using mysql command (if available)
            $mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
            if ($mysqlCmd) {
                Write-Info "Testing MySQL connection..."
                $testQuery = "SELECT 1 as test;"
                $result = & mysql -h $dbHost -P $dbPort -u $dbUser -p$dbPass -e $testQuery 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Success "MySQL connection successful!"
                } else {
                    Write-Error "MySQL connection failed!"
                    Write-Info "Error: $result"
                }
            } else {
                Write-Warning "MySQL command-line tool not found. Skipping direct connection test."
                Write-Info "Install MySQL client to enable this check."
            }
            
            # Test port connectivity
            Write-Info "Testing TCP connection to ${dbHost}:${dbPort}..."
            $tcpTest = Test-NetConnection -ComputerName $dbHost -Port $dbPort -WarningAction SilentlyContinue
            if ($tcpTest.TcpTestSucceeded) {
                Write-Success "TCP connection to MySQL server successful"
            } else {
                Write-Error "Cannot connect to MySQL server at ${dbHost}:${dbPort}"
                Write-Warning "This could indicate MySQL is not running or firewall is blocking"
            }
        }
    }
}

# ============================================
# 4. CHECK APPLICATION LOGS
# ============================================
Write-Header "4. APPLICATION LOGS ANALYSIS"

# Check for PM2 logs (if on Windows with PM2)
$pm2Cmd = Get-Command pm2 -ErrorAction SilentlyContinue
if ($pm2Cmd) {
    Write-Info "Checking PM2 logs..."
    
    # Get PM2 list
    $pm2List = & pm2 list 2>&1
    Write-Info "PM2 Process List:"
    Write-Host $pm2List -ForegroundColor White
    
    # Get recent logs for pesaflow-api
    Write-Info "`nRecent Backend API logs:"
    $apiLogs = & pm2 logs pesaflow-api --lines 50 --nostream 2>&1
    Write-Host $apiLogs -ForegroundColor White
    
    # Get recent logs for pesaflow-web
    Write-Info "`nRecent Frontend logs:"
    $webLogs = & pm2 logs pesaflow-web --lines 50 --nostream 2>&1
    Write-Host $webLogs -ForegroundColor White
    
} else {
    Write-Warning "PM2 not found. Checking for log files..."
    
    # Check for log files in backend
    $backendLogs = Get-ChildItem -Path $BACKEND_PATH -Filter "*.log" -Recurse -ErrorAction SilentlyContinue
    if ($backendLogs) {
        Write-Info "Found backend log files:"
        $backendLogs | ForEach-Object {
            Write-Info "  $($_.FullName)"
            Write-Info "  Last 20 lines:"
            Get-Content $_.FullName -Tail 20 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
        }
    }
}

# ============================================
# 5. CHECK BUILD STATUS
# ============================================
Write-Header "5. BUILD STATUS CHECK"

# Check backend build
$backendDist = "$BACKEND_PATH\dist\server.js"
if (Test-Path $backendDist) {
    $buildDate = (Get-Item $backendDist).LastWriteTime
    Write-Success "Backend is built (dist/server.js exists)"
    Write-Info "  Last built: $buildDate"
    
    # Check if build is recent (within last 24 hours)
    $hoursSinceBuild = (New-TimeSpan -Start $buildDate -End (Get-Date)).TotalHours
    if ($hoursSinceBuild -gt 24) {
        Write-Warning "Backend build is $([math]::Round($hoursSinceBuild, 1)) hours old. Consider rebuilding."
    }
} else {
    Write-Error "Backend is NOT built (dist/server.js missing)"
    Write-Warning "Run 'npm run build' in backend directory"
}

# Check frontend build
$frontendNext = "$FRONTEND_PATH\.next"
if (Test-Path $frontendNext) {
    $buildDate = (Get-Item $frontendNext).LastWriteTime
    Write-Success "Frontend is built (.next directory exists)"
    Write-Info "  Last built: $buildDate"
    
    $hoursSinceBuild = (New-TimeSpan -Start $buildDate -End (Get-Date)).TotalHours
    if ($hoursSinceBuild -gt 24) {
        Write-Warning "Frontend build is $([math]::Round($hoursSinceBuild, 1)) hours old. Consider rebuilding."
    }
} else {
    Write-Error "Frontend is NOT built (.next directory missing)"
    Write-Warning "Run 'npm run build' in frontend directory"
}

# ============================================
# 6. CHECK PRISMA STATUS
# ============================================
Write-Header "6. PRISMA DATABASE STATUS"

Push-Location $BACKEND_PATH
Write-Info "Checking Prisma client generation..."
$prismaGenerated = Test-Path "$BACKEND_PATH\node_modules\.prisma\client"
if ($prismaGenerated) {
    Write-Success "Prisma client is generated"
} else {
    Write-Error "Prisma client not generated"
    Write-Warning "Run 'npx prisma generate' in backend directory"
}

Write-Info "`nChecking database migration status..."
$migrateStatus = & npx prisma migrate status 2>&1
Write-Host $migrateStatus -ForegroundColor White

Pop-Location

# ============================================
# 7. TEST API ENDPOINT
# ============================================
Write-Header "7. API ENDPOINT TEST"

$apiBaseUrl = "http://localhost:$EXPECTED_API_PORT"
Write-Info "Testing API at $apiBaseUrl..."

try {
    $healthResponse = Invoke-WebRequest -Uri "$apiBaseUrl/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Success "API health endpoint responded: $($healthResponse.StatusCode)"
    Write-Info "Response: $($healthResponse.Content)"
} catch {
    Write-Warning "Health endpoint not available, trying root..."
    try {
        $rootResponse = Invoke-WebRequest -Uri "$apiBaseUrl/" -TimeoutSec 5 -ErrorAction Stop
        Write-Success "API root endpoint responded: $($rootResponse.StatusCode)"
    } catch {
        Write-Error "API is not responding at $apiBaseUrl"
        Write-Info "Error: $($_.Exception.Message)"
    }
}

# ============================================
# 8. SUMMARY & RECOMMENDATIONS
# ============================================
Write-Header "8. DIAGNOSTIC SUMMARY & RECOMMENDATIONS"

$issues = @()
$recommendations = @()

# Check for critical issues
if (-not (Test-Path $backendEnvPath)) {
    $issues += "[CRITICAL] Backend .env file is missing"
    $recommendations += "Create backend/.env file with DATABASE_URL and PORT=$EXPECTED_API_PORT"
}

if (-not (Test-Path $backendDist)) {
    $issues += "[CRITICAL] Backend is not built"
    $recommendations += "Run 'cd backend && npm install && npm run build'"
}

if (-not ($listeningPorts -match ":$EXPECTED_API_PORT\s")) {
    $issues += "[CRITICAL] Backend API is not running on port $EXPECTED_API_PORT"
    $recommendations += "Start backend with 'cd backend && npm start' or check PM2 status"
}

if (-not ($listeningPorts -match ":$EXPECTED_WEB_PORT\s")) {
    $issues += "[WARNING] Frontend is not running on port $EXPECTED_WEB_PORT"
    $recommendations += "Start frontend with 'cd frontend && npm run dev -- -p $EXPECTED_WEB_PORT'"
}

# Display issues
if ($issues.Count -gt 0) {
    Write-Host "`nIDENTIFIED ISSUES:" -ForegroundColor Red
    $issues | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
} else {
    Write-Success "No critical issues detected!"
}

# Display recommendations
if ($recommendations.Count -gt 0) {
    Write-Host "`nRECOMMENDATIONS:" -ForegroundColor Yellow
    $recommendations | ForEach-Object { Write-Host "  $_" -ForegroundColor Yellow }
}

Write-Host "`nDIAGNOSTIC COMPLETE" -ForegroundColor Green
Write-Info "Full report saved to: $OUTPUT_FILE"
Write-Host ""

Stop-Transcript

# Open the report file
Write-Host "Opening diagnostic report..." -ForegroundColor Cyan
notepad $OUTPUT_FILE
