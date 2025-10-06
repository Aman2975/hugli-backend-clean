#!/bin/bash

# Hugli Backend Ubuntu Server Setup Script
# This script installs all required dependencies for WhatsApp Web integration

echo "🚀 Setting up Hugli Backend on Ubuntu Server..."
echo "================================================="

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js already installed: $(node --version)"
fi

# Install essential Chrome/Puppeteer dependencies
echo "🌐 Installing Chrome dependencies..."
sudo apt install -y \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libnss3-dev \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    xvfb

# Install additional Chrome dependencies
echo "🔧 Installing additional Chrome dependencies..."
sudo apt install -y \
    libgconf-2-4 \
    libxkbcommon0 \
    libxss1 \
    libgtk-3-0 \
    libgbm1 \
    libgconf-2-4 \
    libxrandr2 \
    libxss1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0

# Add Google Chrome repository and install Chrome
echo "🌐 Installing Google Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable

# Install additional fonts
echo "🔤 Installing additional fonts..."
sudo apt install -y fonts-noto-color-emoji fonts-noto-cjk

# Install PM2 globally for process management
echo "⚙️ Installing PM2..."
sudo npm install -g pm2

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Create environment file template
echo "📝 Creating environment file template..."
cat > .env.example << EOF
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hugli_printing_db

# Email Configuration
GMAIL_USER=bhavnishgarg94@gmail.com
GMAIL_APP_PASSWORD=your_app_password

# WhatsApp Configuration
WHATSAPP_TARGET_NUMBER=917837315102

# Puppeteer Configuration
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# IP Restriction (Optional)
ENABLE_IP_RESTRICTION=false
ALLOWED_IPS=127.0.0.1,::1
EOF

# Test Chrome installation
echo "🧪 Testing Chrome installation..."
if google-chrome-stable --version &> /dev/null; then
    echo "✅ Chrome installed successfully: $(google-chrome-stable --version)"
else
    echo "❌ Chrome installation failed"
fi

# Test headless Chrome
echo "🧪 Testing headless Chrome..."
if google-chrome-stable --headless --no-sandbox --disable-gpu --dump-dom https://www.google.com &> /dev/null; then
    echo "✅ Headless Chrome working correctly"
else
    echo "❌ Headless Chrome test failed"
fi

# Create PM2 ecosystem file
echo "⚙️ Creating PM2 ecosystem configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'hugli-backend',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# Create logs directory
mkdir -p logs

echo ""
echo "🎉 Setup completed successfully!"
echo "================================"
echo ""
echo "📋 Next steps:"
echo "1. Copy .env.example to .env and configure your environment variables"
echo "2. Set up your MySQL database"
echo "3. Run 'npm start' to start the server"
echo "4. Or use PM2: 'pm2 start ecosystem.config.js'"
echo ""
echo "🔧 Useful commands:"
echo "- Start server: npm start"
echo "- Start with PM2: pm2 start ecosystem.config.js"
echo "- View PM2 logs: pm2 logs"
echo "- Restart WhatsApp: pm2 restart hugli-backend"
echo ""
echo "📱 WhatsApp Setup:"
echo "- The server will generate a QR code on first run"
echo "- Scan the QR code with WhatsApp Web to authenticate"
echo "- Once authenticated, WhatsApp messages will work automatically"
echo ""
echo "🐛 Troubleshooting:"
echo "- Check logs: pm2 logs hugli-backend"
echo "- Restart service: pm2 restart hugli-backend"
echo "- Check Chrome: google-chrome-stable --version"
echo ""
echo "✅ Your Hugli Backend is ready for production!"
