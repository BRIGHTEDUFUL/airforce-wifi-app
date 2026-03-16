# Air Force Key Manager

Internal credential management system.

## Local Development

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Administrator | `admin@airforce.mil` | `adminpassword` |
| Operator | `operator@airforce.mil` | `operatorpass` |
| Viewer | `viewer@airforce.mil` | `viewerpass` |

---

## Deploy on Ubuntu (Docker)

### 1. Install Docker & Docker Compose

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

### 2. Clone and run

```bash
git clone <your-repo-url> airforce-wifi-app
cd airforce-wifi-app
docker compose up -d --build
```

That's it. No `.env` file needed — a strong `JWT_SECRET` is auto-generated on first start and persisted in the Docker volume so tokens stay valid across restarts.

App is now running at `http://<your-server-ip>:3000`

### Useful commands

```bash
# View logs
docker compose logs -f

# Stop
docker compose down

# Rebuild after code changes
docker compose up -d --build

# The SQLite database persists in a Docker volume (survives container restarts)
docker volume ls   # → lists db_data volume
```

### Optional: Run behind Nginx (recommended for production)

```bash
sudo apt-get install -y nginx
```

`/etc/nginx/sites-available/airforce`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

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

```bash
sudo ln -s /etc/nginx/sites-available/airforce /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```
