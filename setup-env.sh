#!/bin/bash

# Environment Setup Script for VPS Deployment
# This script sets up environment variables for the Hugli Printing Press application

echo "🔧 Setting up environment variables for Hugli Printing Press..."

# Function to set environment variable
set_env_var() {
    local var_name=$1
    local var_value=$2
    local file_path=$3
    
    if [ -z "$var_value" ]; then
        echo "⚠️  Warning: $var_name is empty"
        return 1
    fi
    
    # Add to .bashrc for persistence
    if ! grep -q "export $var_name=" ~/.bashrc; then
        echo "export $var_name=\"$var_value\"" >> ~/.bashrc
        echo "✅ Added $var_name to ~/.bashrc"
    else
        echo "ℹ️  $var_name already exists in ~/.bashrc"
    fi
    
    # Export for current session
    export $var_name="$var_value"
    echo "✅ Set $var_name for current session"
}

# Database Configuration
echo ""
echo "📊 Database Configuration:"
read -p "Database Host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database User (default: hugli_user): " DB_USER
DB_USER=${DB_USER:-hugli_user}

read -s -p "Database Password: " DB_PASSWORD
echo ""

read -p "Database Name (default: hugli_printing_db): " DB_NAME
DB_NAME=${DB_NAME:-hugli_printing_db}

read -p "Database Port (default: 3306): " DB_PORT
DB_PORT=${DB_PORT:-3306}

# Server Configuration
echo ""
echo "🖥️  Server Configuration:"
read -p "Server Port (default: 5000): " PORT
PORT=${PORT:-5000}

read -p "Node Environment (default: production): " NODE_ENV
NODE_ENV=${NODE_ENV:-production}

# JWT Configuration
echo ""
echo "🔐 Security Configuration:"
read -s -p "JWT Secret (press Enter for auto-generated): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "✅ Auto-generated JWT secret"
fi
echo ""

# Email Configuration
echo ""
echo "📧 Email Configuration:"
read -p "Gmail User (your-email@gmail.com): " GMAIL_USER
read -s -p "Gmail App Password: " GMAIL_APP_PASSWORD
echo ""

# CORS Configuration
echo ""
echo "🌐 CORS Configuration:"
read -p "CORS Origin (default: *): " CORS_ORIGIN
CORS_ORIGIN=${CORS_ORIGIN:-*}

# Set all environment variables
echo ""
echo "🔧 Setting environment variables..."

set_env_var "DB_HOST" "$DB_HOST"
set_env_var "DB_USER" "$DB_USER"
set_env_var "DB_PASSWORD" "$DB_PASSWORD"
set_env_var "DB_NAME" "$DB_NAME"
set_env_var "DB_PORT" "$DB_PORT"
set_env_var "PORT" "$PORT"
set_env_var "NODE_ENV" "$NODE_ENV"
set_env_var "JWT_SECRET" "$JWT_SECRET"
set_env_var "GMAIL_USER" "$GMAIL_USER"
set_env_var "GMAIL_APP_PASSWORD" "$GMAIL_APP_PASSWORD"
set_env_var "CORS_ORIGIN" "$CORS_ORIGIN"

# Create systemd environment file
echo ""
echo "📝 Creating systemd environment file..."
sudo tee /etc/systemd/system/hugli-printing.env > /dev/null << EOF
# Hugli Printing Press Environment Variables
DB_HOST=$DB_HOST
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_PORT=$DB_PORT
PORT=$PORT
NODE_ENV=$NODE_ENV
JWT_SECRET=$JWT_SECRET
GMAIL_USER=$GMAIL_USER
GMAIL_APP_PASSWORD=$GMAIL_APP_PASSWORD
CORS_ORIGIN=$CORS_ORIGIN
EOF

echo "✅ Created /etc/systemd/system/hugli-printing.env"

# Create PM2 ecosystem file
echo ""
echo "📝 Creating PM2 ecosystem file..."
cat > /var/www/hugli-printing/backend/ecosystem.config.js << EOF
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
      DB_HOST: '$DB_HOST',
      DB_USER: '$DB_USER',
      DB_PASSWORD: '$DB_PASSWORD',
      DB_NAME: '$DB_NAME',
      DB_PORT: '$DB_PORT',
      PORT: '$PORT',
      JWT_SECRET: '$JWT_SECRET',
      GMAIL_USER: '$GMAIL_USER',
      GMAIL_APP_PASSWORD: '$GMAIL_APP_PASSWORD',
      CORS_ORIGIN: '$CORS_ORIGIN'
    }
  }]
};
EOF

echo "✅ Created PM2 ecosystem file"

# Reload environment
echo ""
echo "🔄 Reloading environment..."
source ~/.bashrc

echo ""
echo "🎉 Environment setup completed!"
echo ""
echo "📋 Summary:"
echo "   Database: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo "   Server Port: $PORT"
echo "   Environment: $NODE_ENV"
echo "   JWT Secret: ${JWT_SECRET:0:10}..."
echo "   Email: $GMAIL_USER"
echo "   CORS Origin: $CORS_ORIGIN"
echo ""
echo "🚀 Next steps:"
echo "   1. Restart your application: pm2 restart hugli-backend"
echo "   2. Check logs: pm2 logs hugli-backend"
echo "   3. Test API: curl http://localhost:$PORT/api/health"
echo ""
echo "💡 To update environment variables later, run this script again or edit:"
echo "   - ~/.bashrc (for user environment)"
echo "   - /etc/systemd/system/hugli-printing.env (for systemd)"
echo "   - /var/www/hugli-printing/backend/ecosystem.config.js (for PM2)"
