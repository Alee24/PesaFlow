# ============================================
# Quick Connection Fix Script
# ============================================
# This script checks and fixes common connection issues
# ============================================

$ErrorActionPreference = "Continue"

function Write-Success { param($msg) Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Warning { param($msg) Write-Host "[WARN] $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }

$BACKEND_PATH = "c:\Users\Metto\Desktop\Anti gravity\backend"
$ENV_FILE = "$BACKEND_PATH\.env"

Write-Host "`nQUICK CONNECTION FIX" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path $ENV_FILE)) {
    Write-Error ".env file not found!"
    Write-Info "Creating .env file with default settings..."
    
    $envContent = @"
# Database Configuration
DATABASE_URL="mysql://root:@localhost:3306/pesaflow"

# Server Configuration
PORT=5454
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# M-Pesa Configuration (Sandbox)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey
MPESA_SHORTCODE=174379
MPESA_INITIATOR_NAME=testapi
MPESA_INITIATOR_PASSWORD=your_initiator_password
MPESA_ENVIRONMENT=sandbox

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_NAME=PesaFlow
SMTP_FROM_EMAIL=noreply@pesaflow.com

# Frontend URL
FRONTEND_URL=http://localhost:5054

# License System
MASTER_LICENSE_KEY=PESAFLOW-MASTER-2024-ENTERPRISE-UNLIMITED
"@
    
    Set-Content -Path $ENV_FILE -Value $envContent
    Write-Success ".env file created!"
    Write-Warning "Please update the following in .env:"
    Write-Host "  - DATABASE_URL (MySQL credentials)" -ForegroundColor Yellow
    Write-Host "  - JWT_SECRET (random secure string)" -ForegroundColor Yellow
    Write-Host "  - M-Pesa credentials (if using M-Pesa)" -ForegroundColor Yellow
    Write-Host "  - SMTP settings (if using email)" -ForegroundColor Yellow
} else {
    Write-Success ".env file exists"
    
    # Check PORT setting
    $content = Get-Content $ENV_FILE
    $portLine = $content | Where-Object { $_ -match "^PORT=" }
    
    if ($portLine) {
        $port = $portLine -replace "PORT=", ""
        if ($port -eq "5454") {
            Write-Success "PORT is correctly set to 5454"
        } else {
            Write-Warning "PORT is set to $port, updating to 5454..."
            $content = $content -replace "^PORT=.*", "PORT=5454"
            Set-Content -Path $ENV_FILE -Value $content
            Write-Success "PORT updated to 5454"
        }
    } else {
        Write-Warning "PORT not found in .env, adding it..."
        Add-Content -Path $ENV_FILE -Value "`nPORT=5454"
        Write-Success "PORT added to .env"
    }
    
    # Check DATABASE_URL
    $dbLine = $content | Where-Object { $_ -match "^DATABASE_URL=" }
    if ($dbLine) {
        Write-Success "DATABASE_URL is configured"
        $dbUrl = $dbLine -replace "DATABASE_URL=", "" -replace '"', ''
        $dbUrlSafe = $dbUrl -replace ":[^:@]+@", ":****@"
        Write-Info "  $dbUrlSafe"
    } else {
        Write-Error "DATABASE_URL not found in .env"
        Write-Info "Add: DATABASE_URL='mysql://root:@localhost:3306/pesaflow'"
    }
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Info "Next steps:"
Write-Host "  1. Verify .env settings" -ForegroundColor White
Write-Host "  2. Run: .\diagnose_connection.ps1 (for full diagnostic)" -ForegroundColor White
Write-Host "  3. Start services with PM2 or npm" -ForegroundColor White
Write-Host ""
