export default {
  apps: [
    {
      name: 'airforce-app',
      script: './node_modules/.bin/tsx',
      args: 'server.ts',
      cwd: '/var/www/airforce-wifi-app',
      interpreter: 'none',

      // Production environment — dotenv in server.ts loads .env for the rest
      env_production: {
        NODE_ENV: 'production',
        PORT: '3000',
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
