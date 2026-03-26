#!/bin/bash
# =============================================================================
# GAF WiFi Management System — Production Deployment
# Ubuntu 20.04/22.04/24.04 | Node 20 | nginx | PM2 | dnsmasq
#
# Usage:  chmod +x deploy.sh && sudo ./deploy.sh
# Safe:   Idempotent — re-running will NOT break anything
# =============================================================================

set -e

# ── Variables (edit these if needed) ─────────────────────────────────────────
DOMAIN="wifiapp.airforce"
SERVER_IP="192.168.11.10"
GATEWAY="192.168.11.1"
APP_DIR="/var/www/wifiapp"
REPO="https://github.com/BRIGHTEDUFUL/airforce-wifi-app.git"
APP_NAME="wifiapp"
NODE_VERSION="20"
LOG_FILE="/var/log/wifiapp-deploy.log"
UPDATE_SCRIPT="/usr/local/bin/wifiapp-update.sh"

# ── Logging ───────────────────────────────────────────────────────────────────
touch "$LOG_FILE" 2>/dev/null || true
_log() { local lvl="$1"; shift; echo "[$(date '+%Y-%m-%d %H:%M:%S')] [$lvl] $*" | tee -a "$LOG_FILE"; }
info()    { _log "INFO"  "$*"; }
warn()    { _log "WARN"  "$*"; }
error()   { _log "ERROR" "$*"; exit 1; }
section() { echo ""; echo "==> $*"; _log "INFO" "=== $* ==="; }

# ── Root check ────────────────────────────────────────────────────────────────
[ "$(id -u)" -eq 0 ] || error "Run with: sudo ./deploy.sh"

if [ -n "${SUDO_USER:-}" ] && [ "${SUDO_USER}" != "root" ]; then
  REAL_USER="$SUDO_USER"
else
  REAL_USER="root"
fi
REAL_HOME=$(getent passwd "$REAL_USER" | cut -d: -f6)

_log "INFO" "=== Deployment started: user=$REAL_USER domain=$DOMAIN ip=$SERVER_IP ==="
echo ""
echo "============================================================"
echo "  GAF WiFi — Deployment"
echo "  Domain : http://${DOMAIN}"
echo "  IP     : ${SERVER_IP}"
echo "  AppDir : ${APP_DIR}"
echo "============================================================"

# =============================================================================
section "1. System packages"
# =============================================================================
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  build-essential python3 curl git net-tools ufw \
  ca-certificates gnupg nginx dnsmasq dnsutils psmisc
info "System packages installed"

# =============================================================================
section "2. Node.js ${NODE_VERSION}"
# =============================================================================
if ! command -v node &>/dev/null || [[ "$(node -v 2>/dev/null)" != v${NODE_VERSION}* ]]; then
  info "Installing Node.js ${NODE_VERSION}..."
  apt-get remove -y nodejs npm 2>/dev/null || true
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x -o /tmp/nodesource_setup.sh
  bash /tmp/nodesource_setup.sh
  apt-get install -y -qq nodejs
  rm -f /tmp/nodesource_setup.sh
  info "Node.js $(node -v) installed"
else
  info "Node.js $(node -v) already installed — skipping"
fi

# =============================================================================
section "3. PM2"
# =============================================================================
if ! command -v pm2 &>/dev/null; then
  info "Installing PM2..."
  npm install -g pm2
fi
info "PM2 $(pm2 -v) ready"

# =============================================================================
section "4. Clone or update repo"
# =============================================================================
mkdir -p /var/www
if [ -d "$APP_DIR/.git" ]; then
  info "Repo exists — pulling latest..."
  git -C "$APP_DIR" fetch origin main
  git -C "$APP_DIR" reset --hard origin/main
else
  info "Cloning repository..."
  git clone "$REPO" "$APP_DIR"
fi
chown -R "$REAL_USER:$REAL_USER" "$APP_DIR"
cd "$APP_DIR"
info "Repo: $(git -C $APP_DIR log -1 --format='%h %s')"

# =============================================================================
section "5. .env file"
# =============================================================================
mkdir -p "$APP_DIR/data" "$APP_DIR/logs"
chown -R "$REAL_USER:$REAL_USER" "$APP_DIR/data" "$APP_DIR/logs"
chmod 750 "$APP_DIR/data"

if [ ! -f "$APP_DIR/.env" ]; then
  info "Creating .env..."
  cat > "$APP_DIR/.env" << ENVEOF
PORT=3000
HOST=0.0.0.0
SERVER_IP=${SERVER_IP}
DOMAIN=${DOMAIN}
APP_DNS=${SERVER_IP}
APP_DOMAIN=${DOMAIN}
BASE_URL=http://${DOMAIN}
GATEWAY=${GATEWAY}
JWT_SECRET=
JWT_EXPIRY=8h
GEMINI_API_KEY=
ENVEOF
  chmod 600 "$APP_DIR/.env"
  chown "$REAL_USER:$REAL_USER" "$APP_DIR/.env"
  info ".env created"
else
  # Idempotent: only add missing keys
  grep -q '^SERVER_IP=' "$APP_DIR/.env" || echo "SERVER_IP=${SERVER_IP}" >> "$APP_DIR/.env"
  grep -q '^DOMAIN='    "$APP_DIR/.env" || echo "DOMAIN=${DOMAIN}"       >> "$APP_DIR/.env"
  grep -q '^HOST='      "$APP_DIR/.env" || echo "HOST=0.0.0.0"           >> "$APP_DIR/.env"
  info ".env already exists — preserved (missing keys added)"
fi

# =============================================================================
section "6. Static IP via netplan (SAFE)"
# =============================================================================
NETPLAN_CONF="/etc/netplan/99-wifiapp-static.yaml"
IFACE=$(ip -o link show | awk -F': ' \
  '$2 !~ /^lo$/ && $2 !~ /^docker/ && $2 !~ /^br-/ && $2 !~ /^veth/ && $2 !~ /^virbr/ \
  { gsub(/@.*/, "", $2); print $2; exit }')

if [ -z "$IFACE" ]; then
  warn "No network interface detected — skipping static IP"
else
  CURRENT_IP=$(ip -4 addr show "$IFACE" 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1 || true)
  if [ "$CURRENT_IP" = "$SERVER_IP" ]; then
    info "Static IP ${SERVER_IP} already set on $IFACE — skipping"
  else
    info "Configuring static IP: $IFACE ${CURRENT_IP:-none} → ${SERVER_IP}"

    # Backup existing configs that reference this interface
    for f in /etc/netplan/*.yaml /etc/netplan/*.yml; do
      [ -f "$f" ] && [ "$f" != "$NETPLAN_CONF" ] && grep -q "$IFACE" "$f" 2>/dev/null && \
        cp "$f" "${f}.bak.$(date +%s)" && info "Backed up: $f"
    done

    cat > "$NETPLAN_CONF" << NETEOF
network:
  version: 2
  renderer: networkd
  ethernets:
    ${IFACE}:
      dhcp4: false
      addresses: [${SERVER_IP}/24]
      routes:
        - to: default
          via: ${GATEWAY}
      nameservers:
        addresses: [127.0.0.1, 8.8.8.8]
NETEOF
    chmod 600 "$NETPLAN_CONF"

    # SAFE: use netplan generate + netplan try (reverts automatically if broken)
    info "Running netplan generate..."
    netplan generate || error "netplan generate failed — aborting to protect SSH"

    info "Running netplan try (30s timeout — auto-reverts if broken)..."
    # netplan try exits 0 on success, non-zero if user rejects or timeout
    if netplan try --timeout 30 2>/dev/null; then
      sleep 3
      NEW_IP=$(ip -4 addr show "$IFACE" 2>/dev/null | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | head -1 || true)
      if [ "$NEW_IP" = "$SERVER_IP" ]; then
        info "Static IP confirmed: ${SERVER_IP} on $IFACE"
      else
        warn "IP is ${NEW_IP:-unknown} after netplan try — may need reboot"
      fi
    else
      warn "netplan try did not confirm — config reverted. Current IP preserved."
      warn "To apply manually: sudo netplan apply"
    fi
  fi
fi

# =============================================================================
section "7. npm install + build"
# =============================================================================
npm cache clean --force 2>/dev/null || true
if [ "$REAL_USER" = "root" ]; then
  cd "$APP_DIR"
  rm -rf node_modules
  npm install --no-audit --no-fund
  npm run build
else
  sudo -u "$REAL_USER" bash << BUILDEOF
    cd "$APP_DIR"
    rm -rf node_modules
    npm install --no-audit --no-fund
    npm run build
BUILDEOF
fi
[ -d "$APP_DIR/dist" ] || error "Build failed — dist/ not created"
info "Build complete"

# =============================================================================
section "8. dnsmasq — LAN DNS (port 53 conflict fix)"
# =============================================================================

# Fully stop and disable systemd-resolved to free port 53
if systemctl is-active --quiet systemd-resolved 2>/dev/null; then
  info "Stopping systemd-resolved to free port 53..."
  systemctl stop systemd-resolved
  systemctl disable systemd-resolved
  info "systemd-resolved stopped and disabled"
fi

# Replace /etc/resolv.conf with static file pointing to local dnsmasq
if [ -L /etc/resolv.conf ] || [ -f /etc/resolv.conf ]; then
  rm -f /etc/resolv.conf
fi
cat > /etc/resolv.conf << 'RESEOF'
nameserver 127.0.0.1
nameserver 8.8.8.8
RESEOF
chmod 644 /etc/resolv.conf
info "/etc/resolv.conf set to use local dnsmasq"

# Kill anything still on port 53
fuser -k 53/udp 2>/dev/null || true
fuser -k 53/tcp 2>/dev/null || true
sleep 1

# Write dnsmasq config (idempotent — always overwrite)
cat > /etc/dnsmasq.d/wifiapp.conf << DNSEOF
# GAF WiFi — LAN DNS (auto-generated by deploy.sh)
listen-address=0.0.0.0
bind-interfaces
address=/${DOMAIN}/${SERVER_IP}
address=/.${DOMAIN}/${SERVER_IP}
server=8.8.8.8
server=1.1.1.1
no-resolv
cache-size=1000
DNSEOF
info "dnsmasq config written"

systemctl enable dnsmasq
systemctl restart dnsmasq
sleep 2

if systemctl is-active --quiet dnsmasq; then
  info "dnsmasq running — ${DOMAIN} → ${SERVER_IP}"
else
  error "dnsmasq failed to start — check: sudo systemctl status dnsmasq"
fi

# =============================================================================
section "9. nginx (hardened)"
# =============================================================================
NGINX_SITE="/etc/nginx/sites-available/${APP_NAME}"

# Write nginx config directly (no placeholder substitution needed)
cat > "$NGINX_SITE" << NGINXEOF
# GAF WiFi — nginx (generated by deploy.sh)
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name ${DOMAIN} www.${DOMAIN} ${SERVER_IP};

    client_max_body_size  50M;
    client_body_timeout   60s;
    client_header_timeout 30s;
    keepalive_timeout     65s;
    send_timeout          60s;

    gzip              on;
    gzip_vary         on;
    gzip_proxied      any;
    gzip_comp_level   5;
    gzip_min_length   1000;
    gzip_types
        text/plain text/css application/json
        application/javascript text/javascript
        image/svg+xml application/wasm;

    add_header X-Frame-Options        "SAMEORIGIN"                      always;
    add_header X-Content-Type-Options "nosniff"                         always;
    add_header X-XSS-Protection       "1; mode=block"                   always;
    add_header Referrer-Policy        "strict-origin-when-cross-origin" always;

    # Static assets — Vite hashes filenames, cache forever
    location ~* ^/assets/.+\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp|wasm)$ {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        access_log off;
    }

    # API — no cache
    location /api/ {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Connection        "";
        proxy_connect_timeout 10s;
        proxy_send_timeout    60s;
        proxy_read_timeout    60s;
        add_header Cache-Control "no-store" always;
    }

    # Health check — silent
    location = /api/health {
        proxy_pass http://127.0.0.1:3000;
        access_log off;
        add_header Cache-Control "no-store" always;
    }

    # SPA + WebSocket
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade    \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host              \$host;
        proxy_set_header X-Real-IP         \$remote_addr;
        proxy_set_header X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_connect_timeout  10s;
        proxy_send_timeout     60s;
        proxy_read_timeout     60s;
        proxy_buffering         on;
        proxy_buffer_size       8k;
        proxy_buffers           16 8k;
        proxy_busy_buffers_size 16k;
    }
}
NGINXEOF

# Enable site (idempotent)
ln -sf "$NGINX_SITE" "/etc/nginx/sites-enabled/${APP_NAME}"
rm -f /etc/nginx/sites-enabled/default

# Test config before reloading — SAFE
nginx -t || error "nginx config test failed — NOT reloading to protect service"
systemctl enable nginx
systemctl reload nginx 2>/dev/null || systemctl restart nginx
info "nginx running — http://${DOMAIN} and http://${SERVER_IP}"

# =============================================================================
section "10. /etc/hosts"
# =============================================================================
if ! grep -q "$DOMAIN" /etc/hosts 2>/dev/null; then
  echo "${SERVER_IP}  ${DOMAIN} www.${DOMAIN}" >> /etc/hosts
  info "/etc/hosts: added ${DOMAIN}"
else
  info "/etc/hosts: ${DOMAIN} already present"
fi

# =============================================================================
section "11. Firewall (UFW)"
# =============================================================================
# Set defaults FIRST, then add rules — order matters for UFW
ufw --force reset 2>/dev/null || true          # clean slate — removes duplicate rules
ufw default deny incoming  2>/dev/null || true
ufw default allow outgoing 2>/dev/null || true

# Allow all required ports
ufw allow 22/tcp   comment 'SSH'        2>/dev/null || true
ufw allow 80/tcp   comment 'HTTP-nginx' 2>/dev/null || true
ufw allow 443/tcp  comment 'HTTPS'      2>/dev/null || true
ufw allow 53/tcp   comment 'DNS-tcp'    2>/dev/null || true
ufw allow 53/udp   comment 'DNS-udp'    2>/dev/null || true

# Block direct Node access from outside (nginx proxies it)
ufw deny 3000/tcp  comment 'Node-internal-only' 2>/dev/null || true

# Enable firewall
ufw --force enable 2>/dev/null || true

info "UFW rules applied:"
ufw status numbered 2>/dev/null | grep -E "ALLOW|DENY" | while read -r line; do
  info "  $line"
done

# =============================================================================
section "12. PM2 ecosystem config"
# =============================================================================
# Write ecosystem.config.js to APP_DIR (plain JS, no .env reading needed —
# env vars are passed directly via env_production block)
cat > "$APP_DIR/ecosystem.config.js" << 'ECOEOF'
module.exports = {
  apps: [
    {
      name: 'wifiapp',
      script: './node_modules/.bin/tsx',
      args: 'server.ts',
      cwd: '/var/www/wifiapp',
      interpreter: 'none',
      env_production: {
        NODE_ENV: 'production',
        PORT: '3000',
        HOST: '0.0.0.0',
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      max_memory_restart: '300M',
      kill_timeout: 5000,
      error_file: 'logs/err.log',
      out_file:   'logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
ECOEOF
chown "$REAL_USER:$REAL_USER" "$APP_DIR/ecosystem.config.js"
info "ecosystem.config.js written to $APP_DIR"

# =============================================================================
section "13. PM2 — start / restart app"
# =============================================================================
if [ "$REAL_USER" = "root" ]; then
  pm2 stop   wifiapp 2>/dev/null || true
  pm2 delete wifiapp 2>/dev/null || true
  pm2 flush          2>/dev/null || true
  cd "$APP_DIR"
  pm2 start ecosystem.config.js --env production
  pm2 save --force
else
  sudo -u "$REAL_USER" bash << PM2EOF
    pm2 stop   wifiapp 2>/dev/null || true
    pm2 delete wifiapp 2>/dev/null || true
    pm2 flush          2>/dev/null || true
    cd "$APP_DIR"
    pm2 start ecosystem.config.js --env production
    pm2 save --force
PM2EOF
fi

# PM2 startup on boot (idempotent)
STARTUP_CMD=$(sudo -u "$REAL_USER" pm2 startup systemd -u "$REAL_USER" --hp "$REAL_HOME" 2>/dev/null | grep "sudo env PATH" || true)
if [ -n "$STARTUP_CMD" ]; then
  eval "$STARTUP_CMD" || true
else
  pm2 startup systemd -u "$REAL_USER" --hp "$REAL_HOME" 2>/dev/null || true
fi
systemctl enable "pm2-${REAL_USER}" 2>/dev/null || true
info "PM2 auto-start on reboot configured"

# PM2 log rotation
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
info "PM2 log rotation configured"

# =============================================================================
section "14. Auto-update script + cron"
# =============================================================================
cat > "$UPDATE_SCRIPT" << UPDATEEOF
#!/bin/bash
# GAF WiFi — Auto-update (runs every 5 min via cron)
set -e

APP_DIR="${APP_DIR}"
LOG_FILE="${LOG_FILE}"
APP_NAME="${APP_NAME}"

cd "\$APP_DIR"

# Only update if there are new commits
git fetch origin main 2>/dev/null || exit 0
LOCAL=\$(git rev-parse HEAD)
REMOTE=\$(git rev-parse origin/main)
[ "\$LOCAL" = "\$REMOTE" ] && exit 0

echo "[\$(date '+%Y-%m-%d %H:%M:%S')] [UPDATE] New commits — updating..." >> "\$LOG_FILE"
git reset --hard origin/main

# Restore .env if wiped
if [ ! -f "\$APP_DIR/.env" ]; then
  cat > "\$APP_DIR/.env" << ENVEOF
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
  chmod 600 "\$APP_DIR/.env"
fi

npm install --no-audit --no-fund

# Build only if build script exists
if node -e "require('./package.json').scripts.build" 2>/dev/null; then
  npm run build
fi

pm2 restart "\$APP_NAME"
echo "[\$(date '+%Y-%m-%d %H:%M:%S')] [UPDATE] Done" >> "\$LOG_FILE"
UPDATEEOF

chmod +x "$UPDATE_SCRIPT"
info "Update script written: $UPDATE_SCRIPT"

# Cron (idempotent — overwrite)
cat > /etc/cron.d/wifiapp-autoupdate << CRONEOF
# GAF WiFi — auto-pull from GitHub every 5 minutes
*/5 * * * * root $UPDATE_SCRIPT >> $LOG_FILE 2>&1
CRONEOF
chmod 644 /etc/cron.d/wifiapp-autoupdate
info "Cron: auto-update every 5 min"

# =============================================================================
section "15. Seed admin"
# =============================================================================
if [ "$REAL_USER" = "root" ]; then
  cd "$APP_DIR" && NODE_ENV=production ./node_modules/.bin/tsx scripts/reset-admin.ts
else
  sudo -u "$REAL_USER" bash << ADMINEOF
    cd "$APP_DIR"
    NODE_ENV=production ./node_modules/.bin/tsx scripts/reset-admin.ts
ADMINEOF
fi
info "Admin account ready"

# =============================================================================
section "16. Validation"
# =============================================================================
info "Waiting for Node server to start..."
HTTP="000"
for i in $(seq 1 20); do
  sleep 3
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/api/health 2>/dev/null || echo "000")
  [ "$HTTP" = "200" ] && break
  echo "   Waiting... ($i/20)"
done

# 1. Node health check
if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
  info "[OK] Node health check passed — http://localhost:3000/api/health"
else
  if [ "$REAL_USER" = "root" ]; then
    pm2 logs wifiapp --lines 30 --nostream 2>/dev/null || true
  else
    sudo -u "$REAL_USER" pm2 logs wifiapp --lines 30 --nostream 2>/dev/null || true
  fi
  error "[ERROR] Node server not responding — check PM2 logs above"
fi

# 2. nginx check
if curl -sf http://localhost > /dev/null 2>&1; then
  info "[OK] nginx check passed — http://localhost"
else
  warn "[WARN] nginx check failed — run: sudo nginx -t"
fi

# 3. DNS check
DNS_RESULT=$(nslookup "$DOMAIN" 127.0.0.1 2>/dev/null | grep -oP '(?<=Address: )\d+\.\d+\.\d+\.\d+' | head -1 || true)
if [ "$DNS_RESULT" = "$SERVER_IP" ]; then
  info "[OK] DNS check passed — ${DOMAIN} → ${SERVER_IP}"
else
  warn "[WARN] DNS check: got '${DNS_RESULT:-no result}' expected '${SERVER_IP}'"
  warn "       Set router DHCP DNS to ${SERVER_IP} for LAN-wide domain resolution"
fi

_log "INFO" "=== Deployment complete ==="

# =============================================================================
echo ""
echo "============================================================"
echo "  Deployment successful"
echo "  http://${DOMAIN}"
echo "  http://${SERVER_IP}  (direct IP — always works)"
echo ""
echo "  Login    : admin@airforce.mil"
echo "  Password : Admin@GAF2026!"
echo ""
echo "  LAN DNS  : Set router DHCP → DNS = ${SERVER_IP}"
echo "             Then all devices resolve http://${DOMAIN}"
echo ""
echo "  pm2 status              — app status"
echo "  pm2 logs wifiapp        — live logs"
echo "  sudo $UPDATE_SCRIPT     — manual update"
echo "  cat $LOG_FILE           — deploy log"
echo "============================================================"
echo ""
