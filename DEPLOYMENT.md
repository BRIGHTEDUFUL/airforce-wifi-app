# GAF WiFi Management System - Deployment Guide

## 🚀 Fully Standalone Application

This is a **fully integrated full-stack application** where the Express.js backend serves the React frontend in production. No separate frontend server needed.

---

## 📋 Environment Variables

All environment variables are properly configured and connected:

### `.env` Configuration

```env
# Server Configuration
PORT=3000                          # ✅ Connected to server.ts
BASE_URL=http://192.168.11.10      # ✅ Connected to CORS configuration

# JWT Authentication
JWT_SECRET=                        # ✅ Auto-generated on first run (saved to data/.secret)
JWT_EXPIRY=8h                      # ✅ Connected to JWT token expiration

# Optional Features
GEMINI_API_KEY=                    # ✅ For future AI features (optional)
```

### Environment Variable Usage Map

| Variable | File | Purpose | Status |
|----------|------|---------|--------|
| `PORT` | `server.ts` | Server listen port | ✅ Connected |
| `BASE_URL` | `server.ts` | CORS allowed origin | ✅ Connected |
| `JWT_SECRET` | `server.ts` | JWT signing key (auto-generated if empty) | ✅ Connected |
| `JWT_EXPIRY` | `server.ts` | Token expiration time | ✅ Connected |
| `NODE_ENV` | `server.ts`, `database.ts` | Production/development mode | ✅ Connected |

---

## 🏗️ Application Architecture

### Standalone Full-Stack Design

```
┌─────────────────────────────────────────┐
│         Single Node.js Process          │
├─────────────────────────────────────────┤
│  Express.js Server (Port 3000)          │
│  ├─ API Routes (/api/*)                 │
│  ├─ Static Files (dist/)                │
│  └─ SPA Fallback (index.html)           │
├─────────────────────────────────────────┤
│  SQLite Database (database.db)          │
│  └─ Auto-initialized on startup         │
└─────────────────────────────────────────┘
```

### How It Works

1. **Development Mode** (`npm run dev`):
   - Vite dev server proxies `/api/*` to Express backend
   - Hot module replacement enabled
   - Backend runs on port 3000

2. **Production Mode** (`npm start`):
   - Express serves built React app from `dist/`
   - All requests to `/api/*` → API routes
   - All other requests → `dist/index.html` (SPA)
   - Single process, single port (3000)

---

## 🔧 Deployment Methods

### Method 1: Direct Node.js (Recommended for Ubuntu)

```bash
# 1. Clone and setup
git clone https://github.com/BRIGHTEDUFUL/airforce-wifi-app.git
cd airforce-wifi-app

# 2. Run automated deployment script
chmod +x deploy.sh
sudo ./deploy.sh

# The script will:
# - Install Node.js 20, nginx, PM2
# - Clean install dependencies
# - Build frontend
# - Configure nginx reverse proxy
# - Start app with PM2
# - Seed default admin user
```

**Access**: `http://192.168.11.10`

### Method 2: Docker Compose

```bash
# 1. Ensure .env is configured
cp .env.example .env
nano .env  # Edit if needed

# 2. Start with Docker Compose
docker-compose up -d

# 3. Check logs
docker-compose logs -f app
```

**Access**: `http://192.168.11.10`

### Method 3: Manual Deployment

```bash
# 1. Install dependencies
npm install

# 2. Build frontend
npm run build

# 3. Start production server
npm start

# Or with PM2
pm2 start ecosystem.config.js --env production
```

---

## 🔐 Default Credentials

```
Email:    admin@airforce.mil
Password: Admin@GAF2026!
```

**⚠️ IMPORTANT**: Change password immediately after first login!

---

## 🌐 Network Configuration

### Static IP Setup
- **Server IP**: `192.168.11.10`
- **Port**: `3000` (internal)
- **Public Access**: Port `80` via nginx reverse proxy

### Nginx Configuration
- Proxies `http://192.168.11.10:80` → `http://127.0.0.1:3000`
- Handles gzip compression
- WebSocket support for HMR (dev mode)
- Security headers
- Keepalive connections

---

## 📁 File Structure

```
airforce-wifi-app/
├── server.ts              # Express backend + frontend serving
├── database.ts            # SQLite database initialization
├── .env                   # Environment variables (gitignored)
├── .env.example           # Environment template
├── dist/                  # Built frontend (generated)
├── data/                  # Production database & secrets
│   ├── database.db        # SQLite database
│   └── .secret            # Auto-generated JWT secret
├── src/                   # React frontend source
├── nginx/                 # Nginx configurations
│   ├── nginx.conf         # Docker nginx config
│   └── gaf-wifi.conf      # Ubuntu nginx config
├── scripts/
│   └── reset-admin.ts     # Admin password reset utility
├── deploy.sh              # Automated Ubuntu deployment
├── update.sh              # Update script (pull + rebuild)
├── ecosystem.config.js    # PM2 configuration
├── Dockerfile             # Docker image definition
└── docker-compose.yml     # Docker Compose orchestration
```

---

## 🔄 Updates

```bash
# Pull latest changes and rebuild
chmod +x update.sh
./update.sh

# Or manually
git pull origin main
rm -rf node_modules
npm install
npm run build
pm2 restart gaf-wifi-app
```

---

## 🛠️ Maintenance

### Reset Admin Password
```bash
npm run reset-admin
```

### View Logs (PM2)
```bash
pm2 logs gaf-wifi-app
```

### View Logs (Docker)
```bash
docker-compose logs -f app
```

### Restart Application
```bash
# PM2
pm2 restart gaf-wifi-app

# Docker
docker-compose restart app

# Systemd (if configured)
sudo systemctl restart gaf-wifi-app
```

### Database Backup
```bash
# Development
cp database.db database.backup.db

# Production
cp data/database.db data/database.backup.db
```

---

## ✅ Verification Checklist

- [x] All environment variables connected
- [x] Backend serves frontend in production
- [x] Database auto-initializes on startup
- [x] JWT secret auto-generates if not provided
- [x] CORS configured for local network (192.168.x.x)
- [x] Nginx reverse proxy configured
- [x] PM2 process manager configured
- [x] Docker deployment configured
- [x] Health check endpoint (`/api/health`)
- [x] Auto-logout on token expiry
- [x] Graceful shutdown handlers
- [x] Production error handlers

---

## 🔍 Troubleshooting

### App won't start
```bash
# Check if port 3000 is in use
sudo lsof -i :3000

# Check PM2 status
pm2 status

# View error logs
pm2 logs gaf-wifi-app --err
```

### Database errors
```bash
# Ensure data directory exists
mkdir -p data

# Check permissions
ls -la data/

# Reset database (⚠️ deletes all data)
rm data/database.db
npm start  # Will recreate with default admin
```

### Network access issues
```bash
# Check nginx status
sudo systemctl status nginx

# Test nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
```

---

## 📊 System Requirements

- **OS**: Ubuntu 20.04+ (or any Linux with Node.js support)
- **Node.js**: 20.x or higher
- **RAM**: 512MB minimum, 1GB recommended
- **Disk**: 500MB for app + dependencies
- **Network**: Static IP on 192.168.x.x subnet

---

## 🎯 Production Checklist

Before deploying to production:

1. ✅ Change default admin password
2. ✅ Set strong `JWT_SECRET` in `.env` (or let it auto-generate)
3. ✅ Configure `BASE_URL` to match your server IP
4. ✅ Enable firewall and allow only port 80
5. ✅ Set up regular database backups
6. ✅ Configure nginx SSL/TLS if needed
7. ✅ Review CORS settings in `server.ts`
8. ✅ Set up monitoring (PM2 or systemd)

---

## 📞 Support

For issues or questions:
- Check logs: `pm2 logs gaf-wifi-app`
- Review this guide
- Check GitHub repository issues

---

**Version**: 1.0.0  
**Last Updated**: 2026-03-24  
**Deployment Status**: ✅ Production Ready
