#!/bin/bash
# GAF WiFi — Manual update script
# For automated updates see: /usr/local/bin/wifiapp-update.sh (cron)
# Usage: sudo ./update.sh

set -e

APP_DIR="/var/www/wifiapp"
APP_NAME="wifiapp"
LOG_FILE="/var/log/wifiapp-deploy.log"
SERVER_IP="192.168.11.10"
DOMAIN="wifiapp.airforce"

_log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }
info()  { _log "[INFO]  $*"; }
warn()  { _log "[WARN]  $*"; }
error() { _log "[ERROR] $*"; exit 1; }

[ "$(id -u)" -eq 0 ] || error "Run with: sudo ./update.sh"

if [ -n "${SUDO_USER:-}" ] && [ "${SUDO_USER}" != "root" ]; then
  REAL_USER="$SUDO_USER"
else
  REAL_USER="root"
fi

cd "$APP_DIR"

# Check for new commits
info "Checking for updates..."
git fetch origin main 2>/dev/null || { warn "git fetch failed — skipping"; exit 0; }
LOCAL=$(git rev-parse HEAD 2>/dev/null || echo "")
REMOTE=$(git rev-parse origin/main 2>/dev/null || echo "x")

if [ "$LOCAL" = "$REMOTE" ]; then
  info "Already up to date — nothing to do"
  exit 0
fi

info "New commits found — updating..."
git log --oneline HEAD..origin/main 2>/dev/null | head -5 | while read -r line; do
  info "  commit: $line"
done

git reset --hard origin/main
chown -R "$REAL_USER:$REAL_USER" "$APP_DIR"

# Restore .env if wiped by git reset
if [ ! -f "$APP_DIR/.env" ]; then
  warn ".env missing — recreating..."
  cat > "$APP_DIR/.env" << ENVEOF
PORT=3000
HOST=0.0.0.0
SERVER_IP=${SERVER_IP}
DOMAIN=${DOMAIN}
APP_DNS=${SERVER_IP}
APP_DOMAIN=${DOMAIN}
BASE_URL=http://${DOMAIN}
JWT_SECRET=
JWT_EXPIRY=8h
GEMINI_API_KEY=
ENVEOF
  chmod 600 "$APP_DIR/.env"
  chown "$REAL_USER:$REAL_USER" "$APP_DIR/.env"
fi

# Install deps
info "Installing dependencies..."
if [ "$REAL_USER" = "root" ]; then
  cd "$APP_DIR" && rm -rf node_modules && npm install --no-audit --no-fund
else
  sudo -u "$REAL_USER" bash << NPMEOF
    cd "$APP_DIR"
    rm -rf node_modules
    npm install --no-audit --no-fund
NPMEOF
fi

# Build
info "Building frontend..."
if [ "$REAL_USER" = "root" ]; then
  cd "$APP_DIR" && npm run build
else
  sudo -u "$REAL_USER" bash << BUILDEOF
    cd "$APP_DIR"
    npm run build
BUILDEOF
fi
[ -d "$APP_DIR/dist" ] || error "Build failed — dist/ not created"

# Reload nginx if config changed
nginx -t 2>/dev/null && systemctl reload nginx && info "nginx reloaded" || warn "nginx reload skipped"

# Restart app
info "Restarting app..."
if [ "$REAL_USER" = "root" ]; then
  pm2 restart "$APP_NAME" && pm2 save --force
else
  sudo -u "$REAL_USER" bash -c "pm2 restart $APP_NAME && pm2 save --force"
fi

# Health check
HTTP="000"
for i in $(seq 1 10); do
  sleep 3
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health 2>/dev/null || echo "000")
  [ "$HTTP" = "200" ] && break
done

if [ "$HTTP" != "200" ]; then
  if [ "$REAL_USER" = "root" ]; then
    pm2 logs "$APP_NAME" --lines 20 --nostream 2>/dev/null || true
  else
    sudo -u "$REAL_USER" pm2 logs "$APP_NAME" --lines 20 --nostream 2>/dev/null || true
  fi
  error "Server did not come back up after update"
fi

info "Update complete — http://${DOMAIN} (${SERVER_IP})"
