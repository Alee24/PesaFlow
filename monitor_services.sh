#!/bin/bash

# ==============================================================================
# 🔍 PESAFLOW SERVICE MONITOR & AUTORESTART
# ==============================================================================
# This script checks if the PesaFlow PM2 processes are online every 5 minutes.
# If they are not running or errored, it triggers the start_all_services.sh script.

PESAFLOW_ROOT="/var/www/mpesaconnect.co.ke"
START_SCRIPT="$PESAFLOW_ROOT/start_all_services.sh"
LOG_FILE="$PESAFLOW_ROOT/monitor.log"

# Add Node/PM2 paths to environment (Cron runs with minimal shell env)
export PATH=$PATH:/usr/local/bin:/usr/bin:/bin:/root/.nvm/versions/node/v20.19.6/bin

echo "[$(date)] Running health check..." >> "$LOG_FILE"

# Function to check PM2 status
check_online() {
    local app_name=$1
    if pm2 show "$app_name" 2>/dev/null | grep -q "online"; then
        return 0 # Running
    else
        return 1 # Down, Errored, or Stopped
    fi
}

API_STATUS="UP"
WEB_STATUS="UP"

# Check PesaFlow API
if ! check_online "pesaflow-api"; then
    API_STATUS="DOWN"
fi

# Check PesaFlow Web
if ! check_online "pesaflow-web"; then
    WEB_STATUS="DOWN"
fi

# If either service is down, restart them!
if [ "$API_STATUS" = "DOWN" ] || [ "$WEB_STATUS" = "DOWN" ]; then
    echo "[$(date)] ⚠️ Alert! PesaFlow services are down (API: $API_STATUS, Web: $WEB_STATUS). Triggering auto-restart..." >> "$LOG_FILE"
    
    if [ -f "$START_SCRIPT" ]; then
        chmod +x "$START_SCRIPT"
        # Run start script and append logs
        "$START_SCRIPT" >> "$LOG_FILE" 2>&1
        echo "[$(date)] ✅ Auto-restart completed." >> "$LOG_FILE"
    else
        echo "[$(date)] ❌ Error: Start script not found at $START_SCRIPT" >> "$LOG_FILE"
    fi
else
    echo "[$(date)] 💚 Health Check: All services are running optimally." >> "$LOG_FILE"
fi
