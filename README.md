# GAF HQ WiFi Management System

Internal credential management system for Ghana Air Force HQ.

---

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Administrator | `admin@airforce.mil` | `adminpassword` |
| Operator | `operator@airforce.mil` | `operatorpass` |
| Viewer | `viewer@airforce.mil` | `viewerpass` |

---

## Deploy on Fresh Ubuntu Server (Docker)

### Step 1 — Install Docker

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo tee /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

Verify:

```bash
docker --version
docker compose version
```

---

### Step 2 — Install Git and Clone the Repo

```bash
sudo apt-get install -y git
git clone https://github.com/BRIGHTEDUFUL/airforce-wifi-app.git
cd airforce-wifi-app
```

---

### Step 3 — Build and Start

```bash
docker compose up -d --build
```

No `.env` file needed. A strong JWT secret is auto-generated on first boot and saved to the Docker volume so it persists across restarts.

---

### Step 4 — Verify

```bash
docker compose ps
docker compose logs -f
```

Expected output:

```
Generated JWT_SECRET and saved to /app/data/.secret
Seeded user: admin@airforce.mil / adminpassword [Administrator]
Seeded user: operator@airforce.mil / operatorpass [Operator]
Seeded user: viewer@airforce.mil / viewerpass [Viewer]
Air Force Key Manager running at http://localhost:3000
```

App is live at: `http://<your-server-ip>:3000`

---

### Useful Commands

```bash
# View live logs
docker compose logs -f

# Stop the app
docker compose down

# Restart
docker compose restart

# Pull latest code and rebuild
git pull
docker compose up -d --build

# List volumes (DB and secret persist here)
docker volume ls
docker volume inspect airforce-wifi-app_db_data
```

> `docker compose down` does NOT delete data. Use `docker compose down -v` only if you want to wipe the database.

---

### Optional — Nginx Reverse Proxy (Port 80)

```bash
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/airforce
```

Paste the following (replace `your-server-ip-or-domain`):

```nginx
server {
    listen 80;
    server_name your-server-ip-or-domain;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/airforce /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

App is now accessible on port 80 with no port number in the URL.

---

## Local Development

```bash
npm install
npm run dev
# → http://localhost:3000
```
