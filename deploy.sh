#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# GAF WiFi Management System — Full Zero-Config Deployment
# Ubuntu 20.04/22.04/24.04 | Node 20 | nginx | PM2
#
# Usage:  sudo bash deploy.sh
# Re-run: sudo bash deploy.sh   (safe to run multiple times)
# ─────────────────────────────────────────────────────────────────────────────

set -e

# ── Hardcoded defaults (overridden by .env if it exists) ─────────────────────
APP_DIR="/var/www/airforce-wifi-app"
REPO="https://github.com/BRIGHTEDUFUL/airforce-wifi-app.git"
NGINX_CONF="/etc/nginx/sites-available/gaf-wifi"
NETPLAN_CONF="/etc/netplan/99-gaf-static.yaml"
NODE_VERSION="20"
LOG_FILE="/var/log/gaf-deploy.log"

# Default network config — will be overridden from .env below
APP_DNS="192.168.11.10"
APP_DOMAIN="airforce.local"
GATEWAY="192.168.11.1"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓] $1${NC}"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [OK] $1" >> "$LOG_FILE" 2>/dev/null || true; }
warn() { echo -e "${YELLOW}[!] $1${NC}"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1" >> "$LOG_FILE" 2>/dev/null || true; }
fail() { echo -e "${RED}[✗] $1${NC}"; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [FAIL] $1" >> "$LOG_FILE" 2>/dev/null || true; exit 1; }

# ── Must run as root ──────────────────────────────────────────────────────────
[ "$(id -u)" -eq 0 ] || fail "Run with: sudo bash deploy.sh"

# Detect real user
if [ -n "${SUDO_USER:-}" ] && [ "${SUDO_USER}" != "root" ]; then
  REAL_USER="$SUDO_USER"
else
  REAL_USER="root"
fi
REAL_HOME=$(getent passwd "$REAL_USER" | cut -d: -f6)

# ── Read .env if it already exists on server ──────────────────────────────────
if [ -f "$APP_DIR/.env" ]; then
  # Source only the network vars we need
  _DNS=$(grep -E '^APP_DNS=' "$APP_DIR/.env" | cut -d= -f2 | tr -d '"' | tr -d "'" | tr -d ' ')
  _DOMAIN=$(grep -E '^APP_DOMAIN=' "$APP_DIR/.env" | cut -d= -f2 | tr -d '"' | tr -d "'" | tr -d ' ')
  _GW=$(grep -E '^GATEWAY=' "$APP_DIR/.env" | cut -d= -f2 | tr -d '"' | tr -d "'" | tr -d ' ')
  [ -n "$_DNS" ]    && APP_DNS="$_DNS"
  [ -n "$_DOMAIN" ] && APP_DOMAIN="$_DOMAIN"
  [ -n "$_GW" ]     && GATEWAY="$_GW"
fi

STATIC_IP="$APP_DNS"

touch "$LOG_FILE" 2>/dev/null || true
echo "" >> "$LOG_FILE" 2>/dev/null || true
echo "════════════════════════════════════════════════════════" >> "$LOG_FILE" 2>/dev/null || true
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deployment started by $REAL_USER" >> "$LOG_FILE" 2>/dev/null || true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   GAF WiFi Management System — Deployment"
echo "   User: $REAL_USER | IP: $STATIC_IP | Domain: $APP_DOMAIN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. System packages ────────────────────────────────────────────────────────
log "Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  build-essential python3 python3-pip curl git net-tools ufw ca-certificates gnupg

# ── 2. Node.js 20 ─────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ "$(node -v 2>/dev/null)" != v${NODE_VERSION}* ]]; then
  log "Installing Node.js ${NODE_VERSION}..."
  apt-get remove -y nodejs npm 2>/dev/null || true
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x -o /tmp/nodesource_setup.sh
  bash /tmp/nodesource_setup.sh
  apt-get install -y -qq nodejs
  rm -f /tmp/nodesource_setup.sh
  log "Node.js $(node -v) + npm $(npm -v) installed"
else
  log "Node.js $(node -v) already installed"
fi

# ── 3. nginx ──────────────────────────────────────────────────────────────────
if ! command -v nginx &>/dev/null; then
  log "Installing nginx..."
  apt-get install -y -qq nginx
fi
log "nginx ready"

# ── 4. PM2 ────────────────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  log "Installing PM2 globally..."
  npm install -g pm2
fi
log "PM2 $(pm2 -v) ready"

# ── 5. Static IP via netplan ──────────────────────────────────────────────────
log "Configuring static IP ${STATIC_IP}..."

IFACE=$(ip -o link show | awk -F': ' \
  '$2 !~ /^lo$/ && $2 !~ /^docker/ && $2 !~ /^br-/ && $2 !~ /^veth/ && $2 !~ /^virbr/ \
  { gsub(/@.*/, "", $2); print $2; exit }')

if [ -z "$IFACE" ]; then
  warn "Could not detect network interface — skipping static IP"
else
  CURRENT_IP=$(ip -4 addr show "$IFACE" 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1 || true)

  if [ "$CURRENT_IP" = "$STATIC_IP" ]; then
    log "Static IP ${STATIC_IP} already set on $IFACE"
  else
    warn "Setting $IFACE: ${CURRENT_IP:-none} → ${STATIC_IP}"

    for f in /etc/netplan/*.yaml /etc/netplan/*.yml; do
      if [ -f "$f" ] && [ "$f" != "$NETPLAN_CONF" ]; then
        if grep -q "$IFACE" "$f" 2>/dev/null; then
          cp "$f" "${f}.bak.$(date +%s)"
          warn "Backed up: $f"
        fi
      fi
    done

    cat > "$NETPLAN_CONF" << NETEOF
# GAF WiFi Server — Static IP (auto-generated by deploy.sh)
network:
  version: 2
  renderer: networkd
  ethernets:
    ${IFACE}:
      dhcp4: false
      addresses:
        - ${STATIC_IP}/24
      routes:
        - to: default
          via: ${GATEWAY}
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
NETEOF
    chmod 600 "$NETPLAN_CONF"
    netplan generate 2>/dev/null || true
    netplan apply   2>/dev/null || true
    sleep 5

    NEW_IP=$(ip -4 addr show "$IFACE" 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1 || true)
    if [ "$NEW_IP" = "$STATIC_IP" ]; then
      log "Static IP confirmed: ${STATIC_IP} on $IFACE"
    else
      warn "IP is ${NEW_IP:-unknown} — may need reboot. Continuing..."
    fi
  fi
fi

# ── 6. Clone or update repo ───────────────────────────────────────────────────
mkdir -p /var/www
if [ -d "$APP_DIR/.git" ]; then
  log "Pulling latest code from GitHub..."
  git -C "$APP_DIR" fetch origin main
  git -C "$APP_DIR" reset --hard origin/main
  log "Code updated to: $(git -C $APP_DIR log -1 --format='%h %s')"
else
  log "Cloning repository..."
  git clone "$REPO" "$APP_DIR"
fi

chown -R "$REAL_USER:$REAL_USER" "$APP_DIR"
cd "$APP_DIR"

# ── 7. Directories ────────────────────────────────────────────────────────────
mkdir -p "$APP_DIR/data" "$APP_DIR/logs"
chown -R "$REAL_USER:$REAL_USER" "$APP_DIR/data" "$APP_DIR/logs"
chmod 750 "$APP_DIR/data"
log "Directories ready"

# ── 8. .env file ──────────────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  log "Creating .env with APP_DNS=${STATIC_IP} APP_DOMAIN=${APP_DOMAIN}..."
  cat > "$APP_DIR/.env" << ENVEOF
PORT=3000
BASE_URL=http://${STATIC_IP}
APP_DNS=${STATIC_IP}
APP_DOMAIN=${APP_DOMAIN}
GATEWAY=${GATEWAY}
JWT_SECRET=
JWT_EXPIRY=8h
GEMINI_API_KEY=
ENVEOF
  chmod 600 "$APP_DIR/.env"
  chown "$REAL_USER:$REAL_USER" "$APP_DIR/.env"
  log ".env created"
else
  # Ensure APP_DNS and APP_DOMAIN exist in the file
  grep -q '^APP_DNS=' "$APP_DIR/.env"    || echo "APP_DNS=${STATIC_IP}"    >> "$APP_DIR/.env"
  grep -q '^APP_DOMAIN=' "$APP_DIR/.env" || echo "APP_DOMAIN=${APP_DOMAIN}" >> "$APP_DIR/.env"
  log ".env exists — keeping existing values"
fi

# ── 9. npm install ────────────────────────────────────────────────────────────
log "Installing npm dependencies..."
npm cache clean --force 2>/dev/null || true

if [ "$REAL_USER" = "root" ]; then
  cd "$APP_DIR" && rm -rf node_modules && npm install --no-audit --no-fund
else
  sudo -u "$REAL_USER" bash << NPMEOF
    cd "$APP_DIR"
    rm -rf node_modules
    npm install --no-audit --no-fund
NPMEOF
fi
log "Dependencies installed"

# ── 10. Build frontend ────────────────────────────────────────────────────────
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
log "Frontend built"

# ── 11. nginx config — substitute APP_DNS and APP_DOMAIN ─────────────────────
log "Configuring nginx for IP=${STATIC_IP} domain=${APP_DOMAIN}..."

# Build server_name value — always include IP, add domain if set
SERVER_NAME="_ ${STATIC_IP}"
if [ -n "$APP_DOMAIN" ] && [ "$APP_DOMAIN" != "airforce.local" ]; then
  SERVER_NAME="_ ${STATIC_IP} ${APP_DOMAIN} www.${APP_DOMAIN}"
fi

# Substitute placeholders in nginx config
sed \
  -e "s/APP_DNS_PLACEHOLDER/${STATIC_IP}/g" \
  -e "s/APP_DOMAIN_PLACEHOLDER/${APP_DOMAIN}/g" \
  "$APP_DIR/nginx/gaf-wifi.conf" > "$NGINX_CONF"

nginx -t || fail "nginx config test failed — check $NGINX_CONF"
ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/gaf-wifi
rm -f /etc/nginx/sites-enabled/default
systemctl enable nginx
systemctl restart nginx
log "nginx running — serving ${STATIC_IP} and ${APP_DOMAIN}"

# ── 12. /etc/hosts — add local domain resolution ─────────────────────────────
if [ -n "$APP_DOMAIN" ]; then
  if ! grep -q "$APP_DOMAIN" /etc/hosts 2>/dev/null; then
    echo "${STATIC_IP}  ${APP_DOMAIN} www.${APP_DOMAIN}" >> /etc/hosts
    log "Added ${APP_DOMAIN} → ${STATIC_IP} to /etc/hosts"
  else
    log "/etc/hosts already has ${APP_DOMAIN}"
  fi
fi

# ── 13. Firewall ──────────────────────────────────────────────────────────────
log "Configuring firewall..."
ufw allow 22/tcp   2>/dev/null || true
ufw allow 80/tcp   2>/dev/null || true
ufw deny  3000/tcp 2>/dev/null || true
ufw default deny incoming  2>/dev/null || true
ufw default allow outgoing 2>/dev/null || true
ufw --force enable 2>/dev/null || true
log "Firewall: SSH(22) + HTTP(80) open | Node(3000) blocked"

# ── 14. PM2 — start app ───────────────────────────────────────────────────────
log "Starting app with PM2..."

if [ "$REAL_USER" = "root" ]; then
  pm2 stop airforce-app   2>/dev/null || true
  pm2 delete airforce-app 2>/dev/null || true
  pm2 flush               2>/dev/null || true
  cd "$APP_DIR"
  pm2 start ecosystem.config.cjs --env production
  pm2 save --force
else
  sudo -u "$REAL_USER" bash << PM2EOF
    pm2 stop airforce-app   2>/dev/null || true
    pm2 delete airforce-app 2>/dev/null || true
    pm2 flush               2>/dev/null || true
    cd "$APP_DIR"
    pm2 start ecosystem.config.cjs --env production
    pm2 save --force
PM2EOF
fi

# ── 15. PM2 startup on boot ───────────────────────────────────────────────────
log "Configuring PM2 auto-start on reboot..."
STARTUP_CMD=$(sudo -u "$REAL_USER" pm2 startup systemd -u "$REAL_USER" --hp "$REAL_HOME" 2>/dev/null | grep "sudo env PATH" || true)
if [ -n "$STARTUP_CMD" ]; then
  eval "$STARTUP_CMD" || true
else
  pm2 startup systemd -u "$REAL_USER" --hp "$REAL_HOME" 2>/dev/null || true
fi
systemctl enable "pm2-${REAL_USER}" 2>/dev/null || true
log "PM2 auto-start configured"

# ── 16. PM2 log rotation ──────────────────────────────────────────────────────
if [ "$REAL_USER" = "root" ]; then
  pm2 install pm2-logrotate 2>/dev/null || true
  pm2 set pm2-logrotate:max_size 10M  2>/dev/null || true
  pm2 set pm2-logrotate:retain 7      2>/dev/null || true
  pm2 set pm2-logrotate:compress true 2>/dev/null || true
else
  sudo -u "$REAL_USER" bash << LOGEOF
    pm2 install pm2-logrotate 2>/dev/null || true
    pm2 set pm2-logrotate:max_size 10M  2>/dev/null || true
    pm2 set pm2-logrotate:retain 7      2>/dev/null || true
    pm2 set pm2-logrotate:compress true 2>/dev/null || true
LOGEOF
fi
log "Log rotation configured"

# ── 17. Auto-update via cron (pulls from GitHub every 5 minutes) ─────────────
log "Setting up auto-update cron job..."
CRON_CMD="*/5 * * * * root bash $APP_DIR/update.sh >> $LOG_FILE 2>&1"
CRON_FILE="/etc/cron.d/gaf-wifi-autoupdate"
echo "$CRON_CMD" > "$CRON_FILE"
chmod 644 "$CRON_FILE"
log "Auto-update cron: pulls GitHub every 5 minutes → logs to $LOG_FILE"

# ── 18. Health check ──────────────────────────────────────────────────────────
log "Waiting for server to start..."
HTTP="000"
for i in $(seq 1 20); do
  sleep 3
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health 2>/dev/null || echo "000")
  if [ "$HTTP" = "200" ]; then break; fi
  echo "   Waiting... ($i/20) — HTTP $HTTP"
done

if [ "$HTTP" != "200" ]; then
  warn "Server not responding. PM2 logs:"
  if [ "$REAL_USER" = "root" ]; then
    pm2 logs airforce-app --lines 50 --nostream 2>/dev/null || true
  else
    sudo -u "$REAL_USER" pm2 logs airforce-app --lines 50 --nostream 2>/dev/null || true
  fi
  fail "Server failed to start. Re-run: sudo bash deploy.sh"
fi
log "Node server healthy (HTTP 200)"

# Verify nginx proxy
NGINX_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "http://${STATIC_IP}/api/health" 2>/dev/null || echo "000")
if [ "$NGINX_HTTP" = "200" ]; then
  log "nginx proxy healthy (HTTP 200 via http://${STATIC_IP})"
else
  warn "nginx proxy returned HTTP $NGINX_HTTP"
  warn "Check: sudo nginx -t && sudo systemctl status nginx"
fi

# ── 19. Seed admin ────────────────────────────────────────────────────────────
log "Seeding admin account..."
if [ "$REAL_USER" = "root" ]; then
  cd "$APP_DIR" && NODE_ENV=production ./node_modules/.bin/tsx scripts/reset-admin.ts
else
  sudo -u "$REAL_USER" bash << ADMINEOF
    cd "$APP_DIR"
    NODE_ENV=production ./node_modules/.bin/tsx scripts/reset-admin.ts
ADMINEOF
fi
log "Admin ready"

# ── 20. DNS validation ────────────────────────────────────────────────────────
log "Validating network access..."
echo ""
echo "   Server IP   : ${STATIC_IP}"
echo "   Local domain: ${APP_DOMAIN}"
echo ""
echo "   From other LAN devices, open:"
echo "   → http://${STATIC_IP}"
if [ -n "$APP_DOMAIN" ]; then
  echo "   → http://${APP_DOMAIN}  (if DNS/hosts configured on client)"
fi
echo ""
echo "   To access by domain name from other devices, add this to"
echo "   their hosts file (C:\\Windows\\System32\\drivers\\etc\\hosts on Windows):"
echo "   ${STATIC_IP}  ${APP_DOMAIN}"
echo ""

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deployment completed successfully" >> "$LOG_FILE" 2>/dev/null || true

# ── Done ──────────────────────────────────────────────────────────────────────
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}   Deployment complete!${NC}"
echo ""
echo "   App URL  : http://${STATIC_IP}"
echo "   Domain   : http://${APP_DOMAIN}"
echo "   Login    : admin@airforce.mil"
echo "   Password : Admin@GAF2026!"
echo ""
echo "   pm2 status                — check app"
echo "   pm2 logs airforce-app     — live logs"
echo "   sudo bash update.sh       — manual update"
echo "   cat $LOG_FILE             — deployment log"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
