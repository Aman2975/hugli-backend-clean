const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('../config');

class WhatsAppService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.qrCode = null;
    this.targetNumber = config.WHATSAPP_TARGET_NUMBER || '917347320510';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 10000; // 10 seconds
    this.isInitializing = false;
    console.log('📱 WhatsApp target number configured:', this.targetNumber);
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('⚠️ WhatsApp service is already initializing...');
      return;
    }

    try {
      this.isInitializing = true;
      console.log('🚀 Initializing WhatsApp Web Client...');
      
      // Clean up existing client if any
      if (this.client) {
        try {
          await this.client.destroy();
        } catch (e) {
          console.log('⚠️ Error destroying existing client:', e.message);
        }
      }
      
      // Create WhatsApp client with local auth
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
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ],
          timeout: 60000
        }
      });

      // Event handlers
      this.client.on('qr', (qr) => {
        console.log('📱 WhatsApp QR Code generated');
        this.qrCode = qr;
        qrcode.generate(qr, { small: true });
      });

      this.client.on('ready', () => {
        console.log('✅ WhatsApp Client is ready!');
        this.isReady = true;
        this.qrCode = null;
        this.reconnectAttempts = 0;
        this.isInitializing = false;
      });

      this.client.on('authenticated', () => {
        console.log('🔐 WhatsApp Client authenticated');
      });

      this.client.on('auth_failure', (msg) => {
        console.error('❌ WhatsApp authentication failed:', msg);
        this.isInitializing = false;
      });

      this.client.on('disconnected', (reason) => {
        console.log('📱 WhatsApp Client disconnected:', reason);
        this.isReady = false;
        this.isInitializing = false;
        
        // Attempt to reconnect if not manually disconnected
        if (reason !== 'MANUAL') {
          this.attemptReconnect();
        }
      });

      // Initialize the client
      await this.client.initialize();
      
    } catch (error) {
      console.error('❌ Error initializing WhatsApp service:', error);
      this.isInitializing = false;
      
      // Attempt to reconnect after delay
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      } else {
        console.error('❌ Max reconnection attempts reached. WhatsApp service failed.');
      }
    }
  }

  async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached. Stopping reconnection.');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect WhatsApp service (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(async () => {
      try {
        await this.initialize();
      } catch (error) {
        console.error('❌ Reconnection attempt failed:', error.message);
      }
    }, this.reconnectDelay);
  }

  async sendMessage(formData) {
    try {
      if (!this.isReady || !this.client) {
        throw new Error('WhatsApp client is not ready. Please wait for QR code scan.');
      }

      // Check if client is still connected
      if (this.client.pupBrowser && !this.client.pupBrowser.isConnected()) {
        console.log('⚠️ WhatsApp browser connection lost, attempting to reconnect...');
        await this.attemptReconnect();
        throw new Error('WhatsApp connection lost. Attempting to reconnect...');
      }

      // Format the message
      const message = this.formatContactMessage(formData);
      
      // Send message to target number
      const chatId = `${this.targetNumber}@c.us`;
      console.log('📱 Sending WhatsApp message to:', chatId);
      console.log('📱 Target number configured as:', this.targetNumber);
      
      const result = await this.client.sendMessage(chatId, message);
      
      console.log('✅ WhatsApp message sent successfully:', result.id);
      console.log('✅ Message sent to:', result.to);
      
      return {
        success: true,
        messageId: result.id,
        message: 'Message sent to WhatsApp successfully'
      };
      
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error);
      
      // If it's a session closed error, mark as not ready and attempt reconnect
      if (error.message.includes('Session closed') || error.message.includes('Execution context was destroyed')) {
        console.log('🔄 WhatsApp session lost, marking as not ready and attempting reconnect...');
        this.isReady = false;
        this.attemptReconnect();
      }
      
      throw error;
    }
  }

  async sendOrderMessage(orderData) {
    try {
      if (!this.isReady || !this.client) {
        throw new Error('WhatsApp client is not ready. Please wait for QR code scan.');
      }

      // Check if client is still connected
      if (this.client.pupBrowser && !this.client.pupBrowser.isConnected()) {
        console.log('⚠️ WhatsApp browser connection lost, attempting to reconnect...');
        await this.attemptReconnect();
        throw new Error('WhatsApp connection lost. Attempting to reconnect...');
      }

      // Format the order message
      const message = this.formatOrderMessage(orderData);
      
      // Send message to target number
      const chatId = `${this.targetNumber}@c.us`;
      console.log('📱 Sending WhatsApp order message to:', chatId);
      console.log('📱 Target number configured as:', this.targetNumber);
      
      const result = await this.client.sendMessage(chatId, message);
      
      console.log('✅ WhatsApp order message sent successfully:', result.id);
      console.log('✅ Order message sent to:', result.to);
      
      return {
        success: true,
        messageId: result.id,
        message: 'Order sent to WhatsApp successfully'
      };
      
    } catch (error) {
      console.error('❌ Error sending order to WhatsApp:', error);
      
      // If it's a session closed error, mark as not ready and attempt reconnect
      if (error.message.includes('Session closed') || error.message.includes('Execution context was destroyed')) {
        console.log('🔄 WhatsApp session lost, marking as not ready and attempting reconnect...');
        this.isReady = false;
        this.attemptReconnect();
      }
      
      throw error;
    }
  }

  formatContactMessage(formData) {
    const timestamp = new Date().toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    let message = `📧 *New Contact Form Submission*\n\n`;
    
    message += `👤 *Name:* ${formData.name}\n`;
    message += `📧 *Email:* ${formData.email || 'Not provided'}\n`;
    message += `📞 *Phone:* ${formData.phone || 'Not provided'}\n`;
    message += `🏢 *Company:* ${formData.company || 'Not provided'}\n`;
    message += `📝 *Subject:* ${formData.subject || 'Not provided'}\n`;
    message += `🔧 *Service Required:* ${formData.serviceType || 'Not specified'}\n`;
    
    if (formData.message) {
      message += `\n💬 *Message:*\n${formData.message}\n`;
    }
    
    message += `\n⏰ *Submitted:* ${timestamp}\n`;
    message += `\n---\n`;
    message += `📱 *Sent from Hugli Printing Press Website*`;
    
    return message;
  }

  formatOrderMessage(orderData) {
    const timestamp = new Date().toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    
    const orderId = orderData.orderId || 'N/A';
    
    // Format customer info
    const customerInfo = orderData.customerInfo || {};
    const deliveryInfo = orderData.deliveryInfo || {};
    const preferences = orderData.preferences || {};
    const items = orderData.items || [];
    
    let message = `🛒 *NEW ORDER RECEIVED*\n\n`;
    message += `🆔 *Order ID:* ${orderId}\n\n`;
    
    message += `👤 *Customer Information:*\n`;
    message += `• Name: ${customerInfo.name || 'Not provided'}\n`;
    message += `• Email: ${customerInfo.email || 'Not provided'}\n`;
    message += `• Phone: ${customerInfo.phone || 'Not provided'}\n`;
    message += `• Company: ${customerInfo.company || 'Not provided'}\n`;
    message += `• Address: ${customerInfo.address || 'Not provided'}\n\n`;
    
    message += `🚚 *Delivery Information:*\n`;
    message += `• Type: ${deliveryInfo.deliveryType || 'Pickup'}\n`;
    message += `• Address: ${deliveryInfo.deliveryAddress || 'Not provided'}\n`;
    message += `• Date: ${deliveryInfo.deliveryDate || 'Not specified'}\n`;
    message += `• Time: ${deliveryInfo.deliveryTime || 'Not specified'}\n`;
    message += `• Instructions: ${deliveryInfo.specialInstructions || 'None'}\n\n`;
    
    message += `⚙️ *Preferences:*\n`;
    message += `• Urgency: ${preferences.urgency || 'Normal'}\n`;
    message += `• Contact Method: ${preferences.contactMethod || 'Phone'}\n`;
    message += `• Preferred Time: ${preferences.preferredContactTime || 'Anytime'}\n\n`;
    
    message += `📦 *Order Items:*\n`;
    
    // Add items
    items.forEach((item, index) => {
      message += `${index + 1}. *${item.name}*\n`;
      if (item.description) {
        message += `   📝 ${item.description}\n`;
      }
      message += `   🔢 Quantity: ${item.quantity || 1}\n`;
      
      // Add options if any
      if (item.options && Object.keys(item.options).length > 0) {
        message += `   ⚙️ Options:\n`;
        Object.entries(item.options).forEach(([key, value]) => {
          message += `     • ${key}: ${value}\n`;
        });
      }
      message += `\n`;
    });

    message += `⏰ *Order Placed:* ${timestamp}\n`;
    message += `📱 *Sent from Hugli Printing Press Website*`;

    return message;
  }

  getQRCode() {
    return this.qrCode;
  }

  isClientReady() {
    return this.isReady;
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.destroy();
        this.isReady = false;
        this.isInitializing = false;
        console.log('📱 WhatsApp client disconnected');
      }
    } catch (error) {
      console.error('❌ Error disconnecting WhatsApp client:', error);
    }
  }

  async restart() {
    console.log('🔄 Restarting WhatsApp service...');
    try {
      await this.disconnect();
      this.reconnectAttempts = 0;
      await this.initialize();
    } catch (error) {
      console.error('❌ Error restarting WhatsApp service:', error);
      throw error;
    }
  }

  getStatus() {
    return {
      isReady: this.isReady,
      isInitializing: this.isInitializing,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      hasQRCode: !!this.qrCode,
      targetNumber: this.targetNumber
    };
  }
}

// Create singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;
