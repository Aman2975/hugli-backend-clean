// PM2 Ecosystem Configuration for Hugli Printing Press
// This file defines how PM2 should run the application

module.exports = {
  apps: [{
    name: 'hugli-backend',
    script: 'server.js',
    cwd: '/var/www/hugli-printing/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DB_HOST: 'localhost',
      DB_USER: 'hugli_user',
      DB_PASSWORD: 'hugli_password_123',
      DB_NAME: 'hugli_printing_db',
      DB_PORT: 3306,
      JWT_SECRET: 'hugli-jwt-secret-key-2024-production',
      GMAIL_USER: 'your-email@gmail.com',
      GMAIL_APP_PASSWORD: 'your-app-password',
      CORS_ORIGIN: '*'
    },
    error_file: '/var/log/pm2/hugli-backend-error.log',
    out_file: '/var/log/pm2/hugli-backend-out.log',
    log_file: '/var/log/pm2/hugli-backend.log',
    time: true
  }]
};
