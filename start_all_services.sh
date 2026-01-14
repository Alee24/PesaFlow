#!/bin/bash

# ==============================================================================
# 🚀 PESAFLOW & M-CLINIC: DUAL LAUNCH SCRIPT
# ==============================================================================
# This script configures and launches BOTH applications simultaneously.
# - PesaFlow: Port 5454 (API), 5054 (Web)
# - M-Clinic: Port 3434 (API), 3034 (Web) [Avoiding default ports to be safe]

set -e # Exit on error

# --- CONFIGURATION ---
PESAFLOW_ROOT="/var/www/mpesaconnect.co.ke"
MCLINIC_ROOT="/var/www/mclinicportal"

# PesaFlow Ports
PF_API_PORT=5454
PF_WEB_PORT=5054

# M-Clinic Ports (Must be different!)
MC_API_PORT=3434
MC_WEB_PORT=3034

echo "🔄 Initializing Dual Launch Sequence..."

# 1. CLEANUP (Stop everything first to avoid port locks)
echo "🛑 Stopping all services..."
pm2 delete pesaflow-api 2>/dev/null || true
pm2 delete pesaflow-web 2>/dev/null || true
pm2 delete mclinic-api 2>/dev/null || true
pm2 delete mclinic-web 2>/dev/null || true

# ==============================================================================
# 🚀 START PESAFLOW
# ==============================================================================
echo "------------------------------------------------"
echo "🟢 Starting PesaFlow (API: $PF_API_PORT, Web: $PF_WEB_PORT)..."

# API
cd "$PESAFLOW_ROOT/backend"
# Ensure .env has correct port
sed -i "s/^PORT=.*/PORT=${PF_API_PORT}/" .env 2>/dev/null || echo "PORT=${PF_API_PORT}" >> .env
pm2 start dist/server.js --name "pesaflow-api" --update-env

# Web
cd "$PESAFLOW_ROOT/frontend"
pm2 start npm --name "pesaflow-web" -- start -- -p ${PF_WEB_PORT}


# ==============================================================================
# 🚀 START M-CLINIC
# ==============================================================================
echo "------------------------------------------------"
echo "🔵 Starting M-Clinic (API: $MC_API_PORT, Web: $MC_WEB_PORT)..."

# API
cd "$MCLINIC_ROOT/backend"
# Update M-Clinic API Port in its .env (if applicable) or pass via ENV var
# Assuming NestJS uses PORT env var
pm2 start dist/main.js --name "mclinic-api" --env PORT=$MC_API_PORT --update-env

# Web
cd "$MCLINIC_ROOT"
# M-Clinic Frontend seems to refer to root or frontend folder? 
# Adjusting based on standard Next.js/React structure usually found in root or mclinicportal folder
# Based on your previous logs, it runs from /var/www/mclinicportal
pm2 start npm --name "mclinic-web" -- start -- -p ${MC_WEB_PORT}

# ==============================================================================
# ✅ FINAL VERIFICATION
# ==============================================================================
echo "------------------------------------------------"
echo "💾 Saving PM2 Process List..."
pm2 save

echo "------------------------------------------------"
echo "📊 Current Status:"
pm2 status

echo ""
echo "🎉 ALL SYSTEMS GO!"
echo "   -> PesaFlow API: http://localhost:$PF_API_PORT"
echo "   -> PesaFlow Web: http://localhost:$PF_WEB_PORT"
echo "   -> M-Clinic API: http://localhost:$MC_API_PORT"
echo "   -> M-Clinic Web: http://localhost:$MC_WEB_PORT"
echo ""
echo "⚠️  IMPORTANT: Ensure your Apache/Nginx config proxies the correct domains to these ports!"
