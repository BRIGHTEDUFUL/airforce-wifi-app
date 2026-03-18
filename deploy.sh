#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# GAF WiFi Management System — Deployment Script
# Ubuntu + Node.js + nginx + PM2
# Usage: bash deploy.sh
# ─────────────────────────────────────────────────────────────────────────────

set -e

APP_DIR="/var/www/airforce-wifi-app"
REPO="https://github.com/BRIGHTEDUFUL/airforce-wifi-app.git"
NGINX_CONF="/etc/nginx/sites-available/gaf-wifi"
NODE_VERSION="20"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
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

# Build tools needed for native modules (better-sqlite3)
sudo apt-get install -y build-essential python3 curl git -qq

# Install Node.js if not present or wrong version
if ! command -v node &>/dev/null || [[ "$(node -v)" != v${NODE_VERSION}* ]]; then
  log "Installing Node.js ${NODE_VERSION}..."
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
  sudo apt-get install -y nodejs -qq
else
  log "Node.js $(node -v) already installed"
fi

# Install nginx
if ! command -v nginx &>/dev/null; then
  log "Installing nginx..."
  sudo apt-get install -y nginx -qq
else
  log "nginx $(nginx -v 2>&1 | cut -d/ -f2) already installed"
fi

# Install PM2
if ! command -v pm2 &>/dev/null; then
  log "Installing PM2..."
  sudo npm install -g pm2 --quiet
else
  log "PM2 already installed"
fi

# ── 2. Clone or update repo ───────────────────────────────────────────────────
if [ -d "$APP_DIR/.git" ]; then
  log "Pulling latest code..."
  sudo git -C "$APP_DIR" fetch origin main
  sudo git -C "$APP_DIR" reset --hard origin/main
else
  log "Cloning repository..."
  sudo git clone "$REPO" "$APP_DIR"
fi

sudo chown -R "$USER:$USER" "$APP_DIR"
cd "$APP_DIR"

# ── 3. Directories ────────────────────────────────────────────────────────────
log "Creating data and logs directories..."
mkdir -p data logs

# ── 4. Install dependencies — rebuild native modules for Linux ────────────────
log "Installing npm dependencies (rebuilding native modules)..."
# Remove any Windows-compiled node_modules to force clean Linux build
rm -rf node_modules/better-sqlite3/build 2>/dev/null || true
npm install 2>&1 | tail -5
# Force rebuild better-sqlite3 for this platform
npm rebuild better-sqlite3 2>&1 | tail -3
log "Native modules rebuilt for Linux"

# ── 5. Build frontend ─────────────────────────────────────────────────────────
log "Building frontend..."
npm run build 2>&1 | tail -5

# ── 6. Configure nginx ────────────────────────────────────────────────────────
log "Configuring nginx..."
sudo cp "$APP_DIR/nginx/gaf-wifi.conf" "$NGINX_CONF"
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/gaf-wifi
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t || fail "nginx config test failed"
sudo systemctl enable nginx
sudo systemctl restart nginx
log "nginx running"

# ── 7. Firewall ───────────────────────────────────────────────────────────────
if command -v ufw &>/dev/null; then
  log "Configuring firewall..."
  sudo ufw allow 22/tcp  >/dev/null 2>&1 || true
  sudo ufw allow 80/tcp  >/dev/null 2>&1 || true
  sudo ufw --force enable >/dev/null 2>&1 || true
fi

# ── 8. Start with PM2 ─────────────────────────────────────────────────────────
log "Starting app with PM2..."
pm2 stop airforce-app   2>/dev/null || true
pm2 delete airforce-app 2>/dev/null || true
pm2 start ecosystem.config.js --env production
pm2 save

# Auto-start on reboot
PM2_STARTUP=$(pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null | grep "sudo")
[ -n "$PM2_STARTUP" ] && eval "$PM2_STARTUP" || true

# ── 9. Wait for server + health check ────────────────────────────────────────
log "Waiting for server to start..."
for i in {1..15}; do
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health 2>/dev/null || echo "000")
  if [ "$HTTP" = "200" ]; then
    log "Server is up (HTTP 200)"
    break
  fi
  echo "   Waiting... ($i/15)"
  sleep 2
done

if [ "$HTTP" != "200" ]; then
  warn "Server not responding after 30s. Showing PM2 logs:"
  pm2 logs airforce-app --lines 20 --nostream
  fail "Deployment failed — server did not start. Fix errors above and re-run deploy.sh"
fi

# ── 10. Reset admin password ──────────────────────────────────────────────────
log "Seeding admin account..."
npm run reset-admin

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}   Deployment complete!${NC}"
echo ""
echo "   App URL  : http://192.168.11.10"
echo "   Login    : admin@airforce.mil"
echo "   Password : Admin@GAF2026!"
echo ""
echo "   Commands:"
echo "   pm2 status                — app status"
echo "   pm2 logs airforce-app     — live logs"
echo "   pm2 restart airforce-app  — restart"
echo "   bash update.sh            — pull & redeploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
