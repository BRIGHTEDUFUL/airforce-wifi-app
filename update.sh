#!/bin/bash
# GAF WiFi — Auto-Update Script
# Called by cron every 5 minutes AND manually: sudo bash update.sh

set -e

APP_DIR="/var/www/airforce-wifi-app"
LOG_FILE="/var/log/gaf-deploy.log"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓] $1${NC}"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [UPDATE] $1" >> "$LOG_FILE" 2>/dev/null || true; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1" >> "$LOG_FILE" 2>/dev/null || true; }
fail() { echo -e "${RED}[✗] $1${NC}"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [FAIL] $1" >> "$LOG_FILE" 2>/dev/null || true; exit 1; }

[ "$(id -u)" -eq 0 ] || fail "Run with: sudo bash update.sh"

if [ -n "${SUDO_USER:-}" ] && [ "${SUDO_USER}" != "root" ]; then
  REAL_USER="$SUDO_USER"
else
  REAL_USER="root"
fi

# Read APP_DNS from .env
APP_DNS="192.168.11.10"
if [ -f "$APP_DIR/.env" ]; then
  _DNS=$(grep -E '^APP_DNS=' "$APP_DIR/.env" | cut -d= -f2 | tr -d '"' | tr -d "'" | tr -d ' ')
  [ -n "$_DNS" ] && APP_DNS="$_DNS"
fi

cd "$APP_DIR"

# ── Check for new commits ─────────────────────────────────────────────────────
git fetch origin main 2>/dev/null
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  # No changes — exit silently (cron runs this every 5 min)
  exit 0
fi

log "New changes detected — updating from GitHub..."
log "$(git log --oneline HEAD..origin/main | head -5)"

git reset --hard origin/main
chown -R "$REAL_USER:$REAL_USER" "$APP_DIR"

# Restore .env if wiped
if [ ! -f "$APP_DIR/.env" ]; then
  warn ".env missing — recreating..."
  cat > "$APP_DIR/.env" << ENVEOF
PORT=3000
BASE_URL=http://${APP_DNS}
APP_DNS=${APP_DNS}
APP_DOMAIN=airforce.local
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
[ -d "$APP_DIR/dist" ] || fail "Build failed"

# Reload nginx if config changed
nginx -t 2>/dev/null && systemctl reload nginx && log "nginx reloaded" || warn "nginx reload skipped"

log "Restarting app..."
if [ "$REAL_USER" = "root" ]; then
  pm2 restart airforce-app && pm2 save --force
else
  sudo -u "$REAL_USER" bash -c "pm2 restart airforce-app && pm2 save --force"
fi

# Health check
HTTP="000"
for i in $(seq 1 10); do
  sleep 3
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health 2>/dev/null || echo "000")
  if [ "$HTTP" = "200" ]; then break; fi
done

if [ "$HTTP" != "200" ]; then
  if [ "$REAL_USER" = "root" ]; then
    pm2 logs airforce-app --lines 20 --nostream 2>/dev/null || true
  else
    sudo -u "$REAL_USER" pm2 logs airforce-app --lines 20 --nostream 2>/dev/null || true
  fi
  fail "Server did not come back up after update"
fi

log "Update complete — app running at http://${APP_DNS}"
