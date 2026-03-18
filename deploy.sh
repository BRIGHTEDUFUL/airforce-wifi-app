#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# GAF WiFi Management System — Deployment Script
# Ubuntu + Node.js + nginx + PM2
# Usage: bash deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e  # Exit on any error

APP_DIR="/var/www/airforce-wifi-app"
REPO="https://github.com/BRIGHTEDUFUL/airforce-wifi-app.git"
NGINX_CONF="/etc/nginx/sites-available/gaf-wifi"
NODE_VERSION="20"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓] $1${NC}"; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; }
fail() { echo -e "${RED}[✗] $1${NC}"; exit 1; }

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   GAF WiFi Management System — Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. System packages ────────────────────────────────────────────────────────
log "Updating system packages..."
sudo apt-get update -qq

# Install Node.js if not present or wrong version
if ! command -v node &>/dev/null || [[ "$(node -v)" != v${NODE_VERSION}* ]]; then
  log "Installing Node.js ${NODE_VERSION}..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash - -qq
  sudo apt-get install -y nodejs -qq
else
  log "Node.js $(node -v) already installed"
fi

# Install nginx if not present
if ! command -v nginx &>/dev/null; then
  log "Installing nginx..."
  sudo apt-get install -y nginx -qq
else
  log "nginx already installed"
fi

# Install PM2 globally if not present
if ! command -v pm2 &>/dev/null; then
  log "Installing PM2..."
  sudo npm install -g pm2 -q
else
  log "PM2 already installed"
fi

# ── 2. Clone or update repo ───────────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  log "Pulling latest code..."
  sudo git -C "$APP_DIR" pull origin main
else
  log "Cloning repository..."
  sudo git clone "$REPO" "$APP_DIR"
fi

# Fix ownership so current user can work with files
sudo chown -R "$USER:$USER" "$APP_DIR"
cd "$APP_DIR"

# ── 3. Create data and logs directories ───────────────────────────────────────
log "Creating data and logs directories..."
mkdir -p data logs

# ── 4. Install dependencies ───────────────────────────────────────────────────
log "Installing npm dependencies..."
npm install --prefer-offline 2>&1 | tail -3

# ── 5. Build frontend ─────────────────────────────────────────────────────────
log "Building frontend..."
npm run build 2>&1 | tail -5

# ── 6. Configure nginx ────────────────────────────────────────────────────────
log "Configuring nginx..."
sudo cp "$APP_DIR/nginx/gaf-wifi.conf" "$NGINX_CONF"

# Enable site, disable default
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/gaf-wifi
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config
sudo nginx -t || fail "nginx config test failed — check $NGINX_CONF"

sudo systemctl enable nginx
sudo systemctl restart nginx
log "nginx configured and running"

# ── 7. Configure firewall ─────────────────────────────────────────────────────
if command -v ufw &>/dev/null; then
  log "Configuring firewall..."
  sudo ufw allow 22/tcp  >/dev/null 2>&1 || true
  sudo ufw allow 80/tcp  >/dev/null 2>&1 || true
  sudo ufw --force enable >/dev/null 2>&1 || true
fi

# ── 8. Start app with PM2 ─────────────────────────────────────────────────────
log "Starting app with PM2..."

# Stop existing instance if running
pm2 stop airforce-app 2>/dev/null || true
pm2 delete airforce-app 2>/dev/null || true

pm2 start ecosystem.config.js --env production
pm2 save

# Enable PM2 to start on reboot
PM2_STARTUP=$(pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1)
if [[ "$PM2_STARTUP" == sudo* ]]; then
  eval "$PM2_STARTUP"
fi

# ── 9. Seed / verify admin user ───────────────────────────────────────────────
log "Verifying admin account..."
sleep 3  # Wait for server to start and create DB
npm run reset-admin 2>/dev/null || warn "reset-admin skipped (DB may not exist yet — will seed on first start)"

# ── 10. Health check ──────────────────────────────────────────────────────────
log "Running health check..."
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  log "Health check passed (HTTP $HTTP_STATUS)"
else
  warn "Health check returned HTTP $HTTP_STATUS — check: pm2 logs airforce-app"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}   Deployment complete!${NC}"
echo ""
echo "   App URL  : http://192.168.11.10"
echo "   Login    : admin@airforce.mil"
echo "   Password : Admin@GAF2026!"
echo ""
echo "   Useful commands:"
echo "   pm2 status              — check app status"
echo "   pm2 logs airforce-app   — view logs"
echo "   pm2 restart airforce-app — restart app"
echo "   bash deploy.sh          — redeploy / update"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
