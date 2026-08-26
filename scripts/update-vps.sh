#!/usr/bin/env bash
# ==============================================================================
# 000-MISSION-CONTROL: ZERO-DOWNTIME ROLLING UPDATE SCRIPT
# ==============================================================================

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${CYAN}[*] Pulling latest updates from Git repository...${NC}"
git pull origin main

echo -e "${CYAN}[*] Rebuilding 000-app production container without cache...${NC}"
docker compose build --no-cache app

echo -e "${CYAN}[*] Performing rolling restart of app service...${NC}"
docker compose up -d --no-deps app

echo -e "${GREEN}[✓] 000-Mission-Control updated successfully to latest build!${NC}"
docker compose ps
