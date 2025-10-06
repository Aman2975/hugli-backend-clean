# Ubuntu Server Setup Guide for Hugli Backend

## 🚨 **Current Error:**
```
Error destroying existing client: Cannot read properties of null (reading 'close')
❌ Error initializing WhatsApp service: Error: Failed to launch the browser process!
/root/hugli/ww2/hugli-backend-clean/node_modules/puppeteer-core/.local-chromium/linux-1045629/chrome-linux/chrome: error while loading shared libraries: libnss3.so: cannot open shared object file: No such file or directory
```

## 🔧 **Solution: Install Chrome Dependencies**

### **Step 1: Update System Packages**
```bash
sudo apt update
sudo apt upgrade -y
```

### **Step 2: Install Chrome Dependencies**
```bash
# Install essential Chrome/Puppeteer dependencies
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
    xdg-utils
```

### **Step 3: Install Additional Dependencies**
```bash
# Install missing NSS library specifically
sudo apt install -y libnss3-dev

# Install X11 libraries for headless mode
sudo apt install -y xvfb

# Install additional Chrome dependencies
sudo apt install -y \
    libgconf-2-4 \
    libxkbcommon0 \
    libxss1 \
    libgtk-3-0 \
    libgbm1
```

### **Step 4: Alternative - Install Google Chrome**
```bash
# Add Google Chrome repository
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list

# Install Google Chrome
sudo apt update
sudo apt install -y google-chrome-stable
```

## 🔧 **Configure Puppeteer for Server Environment**

### **Step 5: Update WhatsApp Service Configuration**

Create or update the Puppeteer configuration in your WhatsApp service:

```javascript
// In services/whatsappService.js, update the initialize method
const { Client, LocalAuth } = require('whatsapp-web.js');

class WhatsAppService {
  async initialize() {
    try {
      console.log('🚀 Initializing WhatsApp Web Client...');
      
      // Destroy existing client if any
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (error) {
          console.log('⚠️ Error destroying existing client:', error.message);
        }
        this.client = null;
      }

      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'hugli-printing-whatsapp'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ],
          executablePath: '/usr/bin/google-chrome-stable' // Use system Chrome if available
        }
      });

      // Rest of your initialization code...
    } catch (error) {
      console.error('❌ Error initializing WhatsApp service:', error.message);
      throw error;
    }
  }
}
```

## 🚀 **Alternative Solutions**

### **Option 1: Use System Chrome**
```bash
# Find Chrome executable path
which google-chrome-stable
# or
which chromium-browser

# Update Puppeteer config to use system Chrome
executablePath: '/usr/bin/google-chrome-stable'
```

### **Option 2: Install Chromium**
```bash
# Install Chromium browser
sudo apt install -y chromium-browser

# Update Puppeteer config
executablePath: '/usr/bin/chromium-browser'
```

### **Option 3: Use Xvfb for Headless Mode**
```bash
# Install Xvfb
sudo apt install -y xvfb

# Start WhatsApp service with Xvfb
xvfb-run -a node server.js
```

## 🔧 **Environment Variables for Server**

Create a `.env` file with server-specific settings:

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hugli_printing_db

# WhatsApp Configuration
WHATSAPP_TARGET_NUMBER=917837315102

# Puppeteer Configuration
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Disable IP restriction for server deployment
ENABLE_IP_RESTRICTION=false
```

## 🧪 **Testing the Fix**

### **Step 6: Test Chrome Installation**
```bash
# Test if Chrome is working
google-chrome-stable --version

# Test headless mode
google-chrome-stable --headless --no-sandbox --disable-gpu --dump-dom https://www.google.com
```

### **Step 7: Test WhatsApp Service**
```bash
# Start the server
npm start

# Check logs for WhatsApp initialization
# Should see: "✅ WhatsApp Client is ready!"
```

## 🚨 **Common Issues and Solutions**

### **Issue 1: Permission Denied**
```bash
# Fix Chrome permissions
sudo chmod +x /usr/bin/google-chrome-stable
```

### **Issue 2: Missing Fonts**
```bash
# Install additional fonts
sudo apt install -y fonts-noto-color-emoji fonts-noto-cjk
```

### **Issue 3: Memory Issues**
```bash
# Increase swap space if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 📋 **Complete Setup Script**

Create a setup script `setup-ubuntu.sh`:

```bash
#!/bin/bash

echo "🚀 Setting up Hugli Backend on Ubuntu Server..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Chrome dependencies
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

# Install Google Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt update
sudo apt install -y google-chrome-stable

echo "✅ Setup complete! Chrome should now work with Puppeteer."
echo "🔧 Remember to update your WhatsApp service configuration."
```

## 🎯 **Next Steps After Fix**

1. **Install Dependencies:** Run the Chrome dependency installation commands
2. **Update Configuration:** Modify your WhatsApp service to use system Chrome
3. **Test Service:** Start the server and verify WhatsApp initialization
4. **Monitor Logs:** Check for successful WhatsApp client connection

## 📞 **Contact Information Updated**

The backend now uses:
- **Email:** bhavnishgarg94@gmail.com
- **Phone:** +91-7837315102

---

**After following these steps, your WhatsApp service should work properly on the Ubuntu server!** 🎉
