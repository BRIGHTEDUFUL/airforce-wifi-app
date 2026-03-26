// PM2 ecosystem config — CommonJS, maximum compatibility
// Reads .env at startup and injects all vars into the running process
const path = require('path');
const fs   = require('fs');

const APP_DIR = '/var/www/wifiapp';
const envPath = path.join(APP_DIR, '.env');
const env = {};

if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i === -1) return;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (k) env[k] = v;
  });
}

const SERVER_IP = env.SERVER_IP || env.APP_DNS    || '192.168.11.10';
const DOMAIN    = env.DOMAIN    || env.APP_DOMAIN || 'wifiapp.airforce';

module.exports = {
  apps: [
    {
      name: 'wifiapp',
      script: './node_modules/.bin/tsx',
      args: 'server.ts',
      cwd: APP_DIR,
      interpreter: 'none',

      env_production: {
        NODE_ENV:       'production',
        PORT:           env.PORT       || '3000',
        HOST:           env.HOST       || '0.0.0.0',
        SERVER_IP,
        DOMAIN,
        APP_DNS:        SERVER_IP,
        APP_DOMAIN:     DOMAIN,
        BASE_URL:       env.BASE_URL   || `http://${DOMAIN}`,
        JWT_SECRET:     env.JWT_SECRET || '',
        JWT_EXPIRY:     env.JWT_EXPIRY || '8h',
        GEMINI_API_KEY: env.GEMINI_API_KEY || '',
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
