<div align="center">

<img src="public/images.jpeg" alt="Ghana Air Force Crest" width="120" height="120" style="border-radius: 20px;" />

<br/>

# GAF HQ WiFi Management System

**Secure internal credential and network management portal**
**Ghana Air Force Headquarters**

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)

<br/>

> 🔐 **Classified System** — Authorized Personnel Only. All activities are monitored and logged.

</div>

---

## ✨ Features

| Module | Description |
|---|---|
| 🖥️ **Dashboard** | Live system overview, metrics, quick actions |
| 📡 **Devices** | Network hardware inventory with IP tracking |
| 📶 **WiFi Credentials** | Secure storage for all network access points |
| 🔑 **Password Vault** | AES-256 encrypted credential storage |
| 📝 **Secure Notes** | Internal documentation with pin & archive |
| 💬 **Messages** | System-wide alerts and communications |
| 📊 **Analytics** | Charts, module usage, activity trends |
| ⚡ **Password Generator** | Random & structured password generation |
| 🕵️ **Audit Logs** | Full read-only history of all system actions |
| 👥 **User Management** | Role-based access control with 3 tiers |

---

## 🛡️ Access Roles

| Role | Permissions |
|---|---|
| 🔴 **Administrator** | Full access — users, delete, audit logs, all modules |
| 🔵 **Operator** | Read + write — no delete, no user management |
| ⚪ **Viewer** | Read only — passwords hidden |

---

## 🚀 Quick Start

### Default Credentials

```
Email:    admin@airforce.mil
Password: Admin@GAF2026!
```

> ⚠️ Change this password immediately after first login.

---

## 🐳 Option A — Docker (Recommended)

> Requires Docker + Docker Compose on the server.

```bash
# Clone
git clone https://github.com/BRIGHTEDUFUL/airforce-wifi-app.git
cd airforce-wifi-app

# Build and start
docker compose up -d --build
```

App is live at `http://<server-ip>`

**Update:**
```bash
git pull origin main
docker compose up -d --build
```

---

## 🖥️ Option B — Bare Node + nginx (Ubuntu)

### 1 — Install dependencies

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2
```

### 2 — Clone, install, build

```bash
cd /var/www
sudo git clone https://github.com/BRIGHTEDUFUL/airforce-wifi-app.git
sudo chown -R $USER:$USER /var/www/airforce-wifi-app
cd /var/www/airforce-wifi-app

npm install
npm run build
mkdir -p data
```

> No `.env` configuration needed — defaults are pre-configured for `192.168.11.10`.

### 3 — Start with PM2

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup    # run the printed command to enable auto-start on reboot
```

### 4 — Configure nginx

```bash
sudo nano /etc/nginx/sites-available/gaf-wifi
```

```nginx
server {
    listen 80;
    server_name _;
    client_max_body_size 10M;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/gaf-wifi /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### 5 — Open firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw enable
```

**Update:**
```bash
cd /var/www/airforce-wifi-app
git pull origin main
npm install && npm run build
pm2 restart gaf-wifi
```

---

## 🗄️ Data Persistence

Both deployment options auto-create on first boot — no manual setup needed:

| File | Purpose |
|---|---|
| `data/database.db` | SQLite database — all records |
| `data/.secret` | JWT signing secret — persists tokens across restarts |

> Neither file is committed to git. Do not delete them in production.

---

## 🏗️ Tech Stack

```
Frontend          Backend           Infrastructure
─────────────     ─────────────     ──────────────
React 19          Express.js        Docker
TypeScript 5.8    SQLite            nginx
Tailwind CSS v4   JWT Auth          PM2
Vite 6            bcrypt            Ubuntu
Recharts          AES-256-CBC
Motion
```

---

## 📁 Project Structure

```
airforce-wifi-app/
├── src/
│   ├── pages/          # All page components
│   ├── components/     # Sidebar
│   ├── hooks/          # useAuth, useTheme, usePermissions
│   └── lib/            # utils, password generator
├── nginx/
│   └── nginx.conf      # nginx reverse proxy config
├── server.ts           # Express API server
├── database.ts         # SQLite schema + seeding
├── Dockerfile          # Multi-stage production build
└── docker-compose.yml  # App + nginx orchestration
```

---

<div align="center">

**Ghana Air Force Headquarters — Network Operations**

*All activities on this system are monitored, recorded, and subject to audit.*

</div>
