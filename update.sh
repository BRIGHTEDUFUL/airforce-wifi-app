#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# GAF WiFi — Update Script (run after initial deploy)
# Usage: bash update.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

APP_DIR="/var/www/airforce-wifi-app"
GREEN='\033[0;32m'; NC='\033[0m'
log() { echo -e "${GREEN}[✓] $1${NC}"; }

cd "$APP_DIR"

log "Pulling latest code..."
git pull origin main

log "Installing dependencies..."
npm install --prefer-offline 2>&1 | tail -3

log "Building frontend..."
npm run build 2>&1 | tail -5

log "Restarting app..."
pm2 restart airforce-app

log "Done — app updated and restarted"
echo "   URL: http://192.168.11.10"
