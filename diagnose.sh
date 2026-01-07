#!/bin/bash

# Quick diagnostic script for production errors

echo "==================================="
echo "PRODUCTION DIAGNOSTICS"
echo "==================================="

echo ""
echo "1. PM2 Status:"
pm2 status

echo ""
echo "2. Frontend Logs (last 30 lines):"
pm2 logs pesaflow-frontend --lines 30 --nostream

echo ""
echo "3. Backend Logs (last 30 lines):"
pm2 logs pesaflow-backend --lines 30 --nostream

echo ""
echo "4. Check if build exists:"
ls -la frontend/.next/

echo ""
echo "==================================="
