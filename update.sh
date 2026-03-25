#!/bin/bash
# GAF WiFi — Update Script
# Usage: sudo bash update.sh

set -e

APP_DIR="/var/www/airforce-wifi-app"
STATIC_IP="192.168.11.10"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }
fail() { echo -e "${RED}[✗] $1${NC}"; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Run with: sudo bash update.sh"

if [ -n "${SUDO_USER:-}" ] && [ "${SUDO_USER}" != "root" ]; then
  REAL_USER="$SUDO_USER"
else
  REAL_USER="root"
fi

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
if [ "$REAL_USER" = "root" ]; then
  cd "$APP_DIR" && rm -rf node_modules && npm install --no-audit --no-fund
else
  sudo -u "$REAL_USER" bash << NPMEOF
    cd "$APP_DIR"
    rm -rf node_modules
    npm install --no-audit --no-fund
NPMEOF
fi

log "Building frontend..."
if [ "$REAL_USER" = "root" ]; then
  cd "$APP_DIR" && npm run build
else
  sudo -u "$REAL_USER" bash << BUILDEOF
    cd "$APP_DIR"
    npm run build
BUILDEOF
fi
[ -d "$APP_DIR/dist" ] || fail "Build failed — dist/ not created"

# Reload nginx in case config changed
nginx -t 2>/dev/null && systemctl reload nginx && log "nginx reloaded" || warn "nginx reload skipped"

log "Restarting app..."
if [ "$REAL_USER" = "root" ]; then
  pm2 restart airforce-app && pm2 save --force
else
  sudo -u "$REAL_USER" bash -c "pm2 restart airforce-app && pm2 save --force"
fi

log "Checking health..."
HTTP="000"
for i in $(seq 1 10); do
  sleep 3
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health 2>/dev/null || echo "000")
  if [ "$HTTP" = "200" ]; then break; fi
  echo "   Waiting... ($i/10)"
done

if [ "$HTTP" != "200" ]; then
  if [ "$REAL_USER" = "root" ]; then
    pm2 logs airforce-app --lines 20 --nostream 2>/dev/null || true
  else
    sudo -u "$REAL_USER" pm2 logs airforce-app --lines 20 --nostream 2>/dev/null || true
  fi
  fail "Server did not come back up after update"
fi

log "Update complete"
echo "   URL: http://${STATIC_IP}"
