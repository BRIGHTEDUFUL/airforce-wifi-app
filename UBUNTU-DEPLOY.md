# 🚀 Ubuntu Deployment - Quick Start

## One-Command Deployment

On your Ubuntu server (192.168.11.10), run:

```bash
git clone https://github.com/BRIGHTEDUFUL/airforce-wifi-app.git
cd airforce-wifi-app
chmod +x deploy.sh
sudo ./deploy.sh
```

That's it! The script will:
- ✅ Install Node.js 20, nginx, PM2
- ✅ Install all dependencies
- ✅ Build the frontend
- ✅ Configure nginx reverse proxy
- ✅ Start the app with PM2
- ✅ Create default admin user

**Access**: http://192.168.11.10

**Login**:
- Email: `admin@airforce.mil`
- Password: `Admin@GAF2026!`

---

## What Gets Installed

The `deploy.sh` script automatically installs:

1. **Node.js 20.x** (via NodeSource repository)
2. **nginx** (reverse proxy on port 80)
3. **PM2** (process manager)
4. **App dependencies** (via npm install)

---

## After Deployment

### Check Status
```bash
pm2 status
```

### View Logs
```bash
pm2 logs gaf-wifi-app
```

### Restart App
```bash
pm2 restart gaf-wifi-app
```

### Stop App
```bash
pm2 stop gaf-wifi-app
```

---

## Update App

When you push changes to GitHub:

```bash
cd airforce-wifi-app
./update.sh
```

This will:
- Pull latest code
- Reinstall dependencies
- Rebuild frontend
- Restart PM2

---

## Manual Deployment (if needed)

If you prefer manual steps:

```bash
# 1. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install nginx
sudo apt-get install -y nginx

# 3. Install PM2
sudo npm install -g pm2

# 4. Clone and setup
git clone https://github.com/BRIGHTEDUFUL/airforce-wifi-app.git
cd airforce-wifi-app

# 5. Install dependencies
npm install

# 6. Build frontend
npm run build

# 7. Configure nginx
sudo cp nginx/gaf-wifi.conf /etc/nginx/sites-available/gaf-wifi
sudo ln -s /etc/nginx/sites-available/gaf-wifi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 8. Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## Troubleshooting

### Port 3000 already in use
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
pm2 restart gaf-wifi-app
```

### Nginx not working
```bash
sudo nginx -t
sudo systemctl status nginx
sudo systemctl restart nginx
```

### Can't access from network
```bash
# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 3000/tcp
```

### Database errors
```bash
# Check permissions
ls -la data/
sudo chown -R $USER:$USER data/

# Reset database (⚠️ deletes all data)
rm -rf data/database.db
pm2 restart gaf-wifi-app
```

---

## Network Configuration

The app is configured for:
- **Server IP**: 192.168.11.10
- **Port**: 3000 (internal)
- **Public Access**: Port 80 (via nginx)

If your Ubuntu server has a different IP, update `.env`:

```bash
nano .env
# Change BASE_URL=http://192.168.11.10 to your IP
pm2 restart gaf-wifi-app
```

---

## Verification

After deployment, verify everything works:

```bash
# 1. Check environment
npm run verify

# 2. Check PM2 status
pm2 status

# 3. Check nginx
sudo systemctl status nginx

# 4. Test health endpoint
curl http://localhost:3000/api/health

# 5. Test from browser
# Open: http://192.168.11.10
```

---

## Important Notes

- ✅ App runs exactly as on Windows
- ✅ No code changes needed
- ✅ All environment variables auto-configured
- ✅ Database auto-creates on first run
- ✅ JWT secret auto-generates
- ✅ Default admin user auto-seeds

---

## Production Checklist

After deployment:

1. ✅ Change default admin password
2. ✅ Verify app accessible from network
3. ✅ Check PM2 is running
4. ✅ Check nginx is running
5. ✅ Test login functionality
6. ✅ Test all modules (Devices, WiFi, Vault, etc.)

---

## Support

If you encounter issues:

1. Check logs: `pm2 logs gaf-wifi-app`
2. Check nginx: `sudo nginx -t`
3. Check environment: `npm run verify`
4. Review DEPLOYMENT.md for detailed troubleshooting

---

**Ready to deploy!** Just run `sudo ./deploy.sh` on your Ubuntu server.
