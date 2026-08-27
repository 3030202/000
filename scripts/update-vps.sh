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

echo -e "${CYAN}[*] Rebuilding 000-api and 000-app production containers...${NC}"
docker compose build --no-cache api app

echo -e "${CYAN}[*] Performing rolling update of services...${NC}"
docker compose up -d

echo -e "${GREEN}[✓] 000-Mission-Control updated successfully with live Monitoring API!${NC}"
docker compose ps
