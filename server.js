const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2');
const whatsappService = require('./services/whatsappService');

// Load environment variables - try .env file first, then use system environment
try {
  require('dotenv').config();
} catch (error) {
  console.log('No .env file found, using system environment variables');
}

// Import configuration
const config = require('./config');

const app = express();
const PORT = config.PORT;

// Create MySQL connection pool
const pool = mysql.createPool({
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  port: config.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

// Middleware
app.use(cors({
  origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// IP Restriction Middleware (applied to all routes)
const { ipRestriction } = require('./middleware/ipRestriction');
app.use(ipRestriction);

// ==================== ORDERS ENDPOINTS ====================

// Create new order (Anonymous - no authentication required)
app.post('/api/orders', async (req, res) => {
  console.log('🚀 Order creation request received');
  console.log('📦 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { items, customerInfo, deliveryInfo, preferences } = req.body;
    
    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('❌ Validation failed: No items provided');
      return res.status(400).json({ 
        success: false,
        message: 'Order items are required' 
      });
    }
    
    if (!customerInfo || !customerInfo.name || !customerInfo.email) {
      console.log('❌ Validation failed: Missing customer info');
      return res.status(400).json({ 
        success: false,
        message: 'Customer name and email are required' 
      });
    }
    
    console.log('✅ Validation passed');
    
    // Generate order ID
    const orderId = uuidv4();
    console.log('🆔 Generated order ID:', orderId);
    
    // Prepare order data for WhatsApp
    const orderData = {
      orderId,
      items,
      customerInfo,
      deliveryInfo,
      preferences
    };
    
    console.log('📱 Sending order to WhatsApp...');
    
    try {
      // Send to WhatsApp if service is ready
      if (whatsappService.isClientReady()) {
        const whatsappResult = await whatsappService.sendOrderMessage(orderData);
        
        console.log('✅ Order sent to WhatsApp successfully:', whatsappResult.messageId);
        
        res.status(201).json({
          success: true,
          orderId: orderId,
          message: 'Order sent to WhatsApp successfully! We will contact you soon.',
          whatsappMessageId: whatsappResult.messageId
        });
      } else {
        console.log('⚠️ WhatsApp service not ready, order cannot be processed');
        
        res.status(503).json({
          success: false,
          message: 'Order service is temporarily unavailable. Please try again later or contact us directly.',
          whatsappStatus: 'not_ready'
        });
      }
    } catch (whatsappError) {
      console.error('❌ WhatsApp sending failed:', whatsappError);
      
      res.status(500).json({
        success: false,
        message: 'Failed to send order. Please contact us directly.',
        error: whatsappError.message
      });
    }
    
  } catch (error) {
    console.error('❌ Order processing failed:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to process order. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== PRODUCTS ENDPOINTS ====================

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const [products] = await pool.execute('SELECT * FROM products ORDER BY name');
    res.json(products);
  } catch (error) {
    console.error('❌ Products fetch error:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// ==================== CONTACT ENDPOINTS ====================

// Contact form submission (Anonymous - no authentication required)
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, company, subject, message, serviceType } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Save to database first (backup)
    const [result] = await pool.execute(
      'INSERT INTO contact_messages (name, email, phone, company, subject, message, service_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email || null, phone || null, company || null, subject || null, message || null, serviceType || null]
    );

    console.log(`📧 Contact message received from ${name} (${email || 'no email'})`);
    
    // Send to WhatsApp if service is ready
    try {
      if (whatsappService.isClientReady()) {
        const whatsappResult = await whatsappService.sendMessage({
          name, email, phone, company, subject, message, serviceType
        });
        
        console.log('✅ WhatsApp message sent successfully:', whatsappResult.messageId);
        
        res.status(201).json({
          message: 'Contact message sent successfully to WhatsApp',
          id: result.insertId,
          whatsappMessageId: whatsappResult.messageId
        });
      } else {
        console.log('⚠️ WhatsApp service not ready, message saved to database only');
        
        res.status(201).json({
          message: 'Contact message saved successfully. WhatsApp service is not ready.',
          id: result.insertId,
          whatsappStatus: 'not_ready'
        });
      }
    } catch (whatsappError) {
      console.error('❌ WhatsApp sending failed:', whatsappError);
      
      res.status(201).json({
        message: 'Contact message saved successfully. WhatsApp delivery failed.',
        id: result.insertId,
        whatsappError: whatsappError.message
      });
    }
    
  } catch (error) {
    console.error('❌ Contact form error:', error);
    res.status(500).json({ message: 'Error submitting contact form' });
  }
});

// ==================== WHATSAPP ENDPOINTS ====================

// Get WhatsApp QR code
app.get('/api/whatsapp/qr', async (req, res) => {
  try {
    const qrCode = whatsappService.getQRCode();
    
    if (qrCode) {
      res.json({
        success: true,
        qrCode: qrCode,
        message: 'QR Code available for scanning'
      });
    } else if (whatsappService.isClientReady()) {
      res.json({
        success: true,
        qrCode: null,
        message: 'WhatsApp client is already authenticated and ready'
      });
    } else {
      res.json({
        success: false,
        qrCode: null,
        message: 'WhatsApp client is initializing. Please wait and try again.'
      });
    }
  } catch (error) {
    console.error('❌ Error getting WhatsApp QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting WhatsApp QR code'
    });
  }
});

// Get WhatsApp status
app.get('/api/whatsapp/status', async (req, res) => {
  try {
    const status = whatsappService.getStatus();
    
    res.json({
      success: true,
      isReady: status.isReady,
      hasQRCode: status.hasQRCode,
      isInitializing: status.isInitializing,
      reconnectAttempts: status.reconnectAttempts,
      maxReconnectAttempts: status.maxReconnectAttempts,
      targetNumber: status.targetNumber,
      status: status.isReady ? 'ready' : status.hasQRCode ? 'waiting_for_scan' : status.isInitializing ? 'initializing' : 'disconnected'
    });
  } catch (error) {
    console.error('❌ Error getting WhatsApp status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting WhatsApp status'
    });
  }
});

// Restart WhatsApp service
app.post('/api/whatsapp/restart', async (req, res) => {
  try {
    console.log('🔄 Manual WhatsApp service restart requested');
    await whatsappService.restart();
    
    res.json({
      success: true,
      message: 'WhatsApp service restart initiated'
    });
  } catch (error) {
    console.error('❌ Error restarting WhatsApp service:', error);
    res.status(500).json({
      success: false,
      message: 'Error restarting WhatsApp service',
      error: error.message
    });
  }
});

// ==================== HEALTH CHECK ====================

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 as test');
    const dbConnected = rows && rows.length > 0;
    
    res.json({
      message: 'Hugli Printing Press API is running',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      database: {
        connected: dbConnected,
        version: dbConnected ? 'Connected' : 'Disconnected'
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'API is running but database connection failed',
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      database: {
        connected: false,
        error: error.message
      }
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Test database connection function
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log(`📡 Database Host: ${config.DB_HOST}`);
    console.log(`👤 Database User: ${config.DB_USER}`);
    console.log(`🗄️  Database Name: ${config.DB_NAME}`);
    console.log(`🔌 Database Port: ${config.DB_PORT}`);
    
    const [rows] = await pool.execute('SELECT 1 as test');
    if (rows && rows.length > 0) {
      console.log('✅ Database connection successful');
      
      // Get MySQL version
      const [versionRows] = await pool.execute('SELECT VERSION() as version');
      console.log(`📊 MySQL Version: ${versionRows[0].version}`);
      
      // Check tables
      const [tableRows] = await pool.execute('SHOW TABLES');
      console.log(`📋 Tables found: ${tableRows.length}`);
      
      // Check important tables
      const tableNames = tableRows.map(row => Object.values(row)[0]);
      const importantTables = ['contact_messages'];
      
      console.log('🔍 Important tables status:');
      importantTables.forEach(table => {
        if (tableNames.includes(table)) {
          console.log(`   ✅ ${table}`);
        } else {
          console.log(`   ❌ ${table} (missing)`);
        }
      });
      
      return true;
    } else {
      console.log('❌ Database connection failed - no response');
      return false;
    }
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

// Start server
app.listen(PORT, async () => {
  console.log('🚀 Hugli Printing Press Server Started!');
  console.log(`🌐 Server running on port ${PORT}`);
  console.log('='.repeat(50));
  
  // Test database connection
  const dbConnected = await testDatabaseConnection();
  console.log('='.repeat(50));
  
  if (dbConnected) {
    console.log('✅ Ready to handle all requests');
    
    // Initialize WhatsApp service
    try {
      console.log('📱 Initializing WhatsApp service...');
      await whatsappService.initialize();
      console.log('📱 WhatsApp service initialization started');
      console.log('   - Check console for QR code to scan');
      console.log('   - Visit /api/whatsapp/status to check status');
      console.log('   - Visit /api/whatsapp/qr to get QR code');
    } catch (error) {
      console.log('⚠️  WhatsApp service initialization failed:', error.message);
      console.log('   Contact forms will still work but without WhatsApp integration');
    }
  } else {
    console.log('⚠️  Server started but database connection failed');
    console.log('   Some features may not work properly');
  }
  
  console.log('📋 Available endpoints:');
  console.log('  - GET  /api/health');
  console.log('  - POST /api/orders (Anonymous)');
  console.log('  - GET  /api/products');
  console.log('  - POST /api/contact (Anonymous)');
  console.log('  - GET  /api/whatsapp/qr');
  console.log('  - GET  /api/whatsapp/status');
  console.log('  - POST /api/whatsapp/restart');
  console.log('');
  console.log('🔓 No authentication required for orders and contact forms!');
});
