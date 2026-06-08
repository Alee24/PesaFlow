$ScriptsToReplace = @("server-config/deploy.sh", "deploy_to_server.sh", "deploy_production.sh", "deploy-fresh.sh", "update.sh", "vps_update.sh", "start_all_services.sh", "clean_and_rebuild.sh")
$RedirectContent = @"
#!/bin/bash

# This script has been consolidated into the master deploy.sh script.
echo "Redirecting to master deploy script..."
bash ./deploy.sh
"@

foreach ($Script in $ScriptsToReplace) {
    if (Test-Path $Script) {
        Set-Content -Path $Script -Value $RedirectContent
        Write-Host "Updated $Script"
    }
}
