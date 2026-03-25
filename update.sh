#!/bin/bash
# GAF WiFi — Update Script
# Usage: sudo bash update.sh

set -euo pipefail

APP_DIR="/var/www/airforce-wifi-app"
STATIC_IP="192.168.11.10"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }
fail() { echo -e "${RED}[✗] $1${NC}"; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Run with: sudo bash update.sh"

REAL_USER="${SUDO_USER:-$USER}"
cd "$APP_DIR"

log "Pulling latest code..."
git fetch origin main
git reset --hard origin/main
chown -R "$REAL_USER:$REAL_USER" "$APP_DIR"

# Restore .env if wiped by git reset (gitignored — never in repo)
if [ ! -f "$APP_DIR/.env" ]; then
  warn ".env missing — recreating..."
  cat > "$APP_DIR/.env" << ENVEOF
PORT=3000
BASE_URL=http://${STATIC_IP}
JWT_SECRET=
JWT_EXPIRY=8h
GEMINI_API_KEY=
ENVEOF
  chmod 600 "$APP_DIR/.env"
  chown "$REAL_USER:$REAL_USER" "$APP_DIR/.env"
fi

log "Installing dependencies..."
sudo -u "$REAL_USER" bash -c "
  cd '$APP_DIR'
  rm -rf node_modules
  npm install --no-audit --no-fund 2>&1 | tail -5
"

log "Building frontend..."
sudo -u "$REAL_USER" bash -c "cd '$APP_DIR' && npm run build 2>&1 | tail -5"
[ -d "$APP_DIR/dist" ] || fail "Build failed — dist/ not created"

# Reload nginx in case config changed
nginx -t 2>&1 && systemctl reload nginx && log "nginx reloaded" || warn "nginx reload skipped"

log "Restarting app..."
sudo -u "$REAL_USER" bash -c "pm2 restart airforce-app && pm2 save --force"

log "Checking health..."
HTTP="000"
for i in {1..10}; do
  sleep 3
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health 2>/dev/null || echo "000")
  [ "$HTTP" = "200" ] && break
  echo "   Waiting... ($i/10)"
done

[ "$HTTP" = "200" ] || {
  sudo -u "$REAL_USER" pm2 logs airforce-app --lines 20 --nostream 2>/dev/null || true
  fail "Server did not come back up"
}

log "Update complete"
echo "   URL: http://${STATIC_IP}"
