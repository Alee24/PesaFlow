$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting PesaFlow Servers..." -ForegroundColor Green

$backendPath = Join-Path $PSScriptRoot "backend"
$frontendPath = Join-Path $PSScriptRoot "frontend"

# Check if paths exist
if (-not (Test-Path $backendPath)) {
    Write-Error "Backend directory not found at $backendPath"
}
if (-not (Test-Path $frontendPath)) {
    Write-Error "Frontend directory not found at $frontendPath"
}

# Start Backend
Write-Host "Starting Backend on Port 5454..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; `$env:PORT='5454'; npm run dev"

# Start Frontend
Write-Host "Starting Frontend on Port 5054..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev -- -p 5054"

Write-Host "✅ Servers launch commands initiated." -ForegroundColor Green
Write-Host "   -> Backend: http://localhost:5454"
Write-Host "   -> Frontend: http://localhost:5054"
