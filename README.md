# GAF HQ WiFi Management System

Internal credential and network management portal for Ghana Air Force Headquarters.

## Stack

- Frontend: React 19 + TypeScript + Tailwind CSS v4
- Backend: Express.js + SQLite (better-sqlite3)
- Auth: JWT (8h expiry), bcrypt password hashing
- Vault: AES-256-CBC encrypted passwords

## Default Login

```
Email:    admin@airforce.mil
Password: Admin@GAF2026!
```

**Change this password immediately after first login.**

---

## Option A — Bare Node + nginx (Ubuntu)

### 1. Install dependencies

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx
sudo npm install -g pm2
```

### 2. Clone and build

```bash
cd /var/www
sudo git clone https://github.com/BRIGHTEDUFUL/airforce-wifi-app.git
sudo chown -R $USER:$USER /var/www/airforce-wifi-app
cd /var/www/airforce-wifi-app
npm install
npm run build
mkdir -p data
```

### 3. Start with PM2

```bash
NODE_ENV=production pm2 start "npx tsx server.ts" --name gaf-wifi
pm2 save
pm2 startup   # run the printed command to enable auto-start on reboot
```

### 4. Configure nginx

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

### 5. Open firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw enable
```

### Update

```bash
cd /var/www/airforce-wifi-app
git pull origin main
npm install
npm run build
pm2 restart gaf-wifi
```

---

## Option B — Docker + nginx

### Requirements

- Docker + Docker Compose installed on Ubuntu

### Deploy

```bash
git clone https://github.com/BRIGHTEDUFUL/airforce-wifi-app.git
cd airforce-wifi-app
docker compose up -d --build
```

### Update

```bash
git pull origin main
docker compose up -d --build
```

### Open firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw enable
```

---

## Data Persistence

Both deployment options auto-create on first boot:

- `data/database.db` — SQLite database
- `data/.secret` — JWT signing secret (persists tokens across restarts)

Neither file is committed to git. Do not delete them in production.

---

## Roles

| Role          | Permissions                                      |
|---------------|--------------------------------------------------|
| Administrator | Full access — users, delete, audit logs          |
| Operator      | Read + write, no delete, no user management      |
| Viewer        | Read only, passwords hidden                      |
