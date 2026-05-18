#!/bin/bash

# Combined VPS Update Script for PesaFlow (DOCKER VERSION)
# Branch: main
# Description: Pulls latest code and restarts services via Docker Compose.

# Exit on error
set -e

PROJECT_DIR="/var/www/mpesaconnect.co.ke"
BRANCH="main"

# Text Styling
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}==========================================${NC}"
echo -e "${BLUE}🚀 STARTING PESAFLOW DOCKER UPDATE${NC}"
echo -e "${BLUE}==========================================${NC}"
echo ""

# Navigate to project
if [ -d "$PROJECT_DIR" ]; then
    echo -e "${GREEN}📂 Navigating to project directory: $PROJECT_DIR${NC}"
    cd "$PROJECT_DIR"
else
    echo -e "${RED}❌ Project directory $PROJECT_DIR not found. Using current working directory.${NC}"
fi

# 1. Pull changes
echo -e "${YELLOW}📥 Fetching latest code changes from GitHub (${BRANCH})...${NC}"
git fetch origin
git checkout $BRANCH || git checkout -b $BRANCH origin/$BRANCH
git reset --hard origin/$BRANCH

# 2. Re-build and restart containers
echo -e "${YELLOW}🏗️  Rebuilding and restarting Docker containers (clean rebuild)...${NC}"
docker-compose down || true
docker-compose build --no-cache
docker-compose up -d

# 3. Check status
echo ""
echo -e "${GREEN}📊 Current Container Status:${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}✅ UPDATE COMPLETE AND SERVICES RESTARTED${NC}"
echo -e "${GREEN}==========================================${NC}"
echo -e "${BLUE}Backend Logs:  docker-compose logs -f backend${NC}"
echo -e "${BLUE}Frontend Logs: docker-compose logs -f frontend${NC}"
echo -e "${GREEN}==========================================${NC}"
