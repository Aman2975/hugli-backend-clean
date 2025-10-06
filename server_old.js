const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2');
const { 
  generateOTP, 
  generateResetToken, 
  sendOTPEmail, 
  sendVerificationEmail, 
  sendPasswordResetEmail
} = require('./services/emailService');
const whatsappService = require('./services/whatsappService');
const { ipRestriction } = require('./middleware/ipRestriction');
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
const JWT_SECRET = config.JWT_SECRET;

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
app.use(ipRestriction);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('❌ JWT verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    // Debug logging
    console.log('🔍 Token verified for user:', user.email, 'userId:', user.userId);
    
    if (!user.userId) {
      console.error('❌ Missing userId in token:', user);
      return res.status(403).json({ message: 'Invalid token structure' });
    }
    
    req.user = user;
    next();
  });
};

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const connection = await pool.getConnection();
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    const [tableRows] = await connection.execute('SHOW TABLES');
    connection.release();
    
    res.json({
      message: 'Hugli Printing Press API is running',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      database: {
        connected: true,
        version: versionRows[0].version,
        tables: tableRows.length
      }
    });
  } catch (error) {
    res.status(503).json({
      message: 'Database connection failed',
      timestamp: new Date().toISOString(),
      status: 'unhealthy',
      database: {
        connected: false,
        error: error.message
      }
    });
  }
});

// Note: Authentication endpoints removed - orders are now anonymous

// ==================== ORDERS ENDPOINTS ====================

// Create new order
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

// Note: Order endpoints removed - orders are now sent directly to WhatsApp

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

// Contact form submission
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
    const isReady = whatsappService.isClientReady();
    const hasQR = !!whatsappService.getQRCode();
    
    res.json({
      success: true,
      isReady: isReady,
      hasQRCode: hasQR,
      status: isReady ? 'ready' : hasQR ? 'waiting_for_scan' : 'initializing'
    });
  } catch (error) {
    console.error('❌ Error getting WhatsApp status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting WhatsApp status'
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
    console.log('📧 Email service will be tested when needed');
    
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
  console.log('  - POST /api/orders');
  console.log('  - GET  /api/products');
  console.log('  - POST /api/contact');
  console.log('  - GET  /api/whatsapp/qr');
  console.log('  - GET  /api/whatsapp/status');
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
      const importantTables = ['users', 'orders', 'order_items', 'contact_messages', 'otp_codes'];
      
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
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP for email verification
    await pool.execute(
      'INSERT INTO otp_codes (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [email, otp, 'email_verification', expiresAt]
    );

    // Send OTP email for verification
    const emailResult = await sendOTPEmail(email, otp);
    if (!emailResult.success) {
      console.error('❌ Failed to send OTP email:', emailResult.error);
      // Still return success but warn user
    }

    console.log('✅ User registered successfully:', email);
    res.status(201).json({
      message: 'User registered successfully. Please check your email for the OTP to verify your account.',
      requiresVerification: true,
      verificationType: 'otp',
      user: {
        id: result.insertId,
        name,
        email,
        phone: phone || null,
        company: company || null,
        role: 'user',
        email_verified: false
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login request:', req.body);
    const { email, password, phone } = req.body;
    
    // Determine if input is email or phone
    let loginField, loginValue;
    if (email) {
      loginField = 'email';
      loginValue = email;
    } else if (phone) {
      loginField = 'phone';
      loginValue = phone;
    } else {
      return res.status(400).json({ message: 'Email or phone number is required' });
    }
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Find user by email or phone
    const [users] = await pool.execute(`SELECT * FROM users WHERE ${loginField} = ?`, [loginValue]);
    if (users.length === 0) {
      console.log(`❌ User not found: ${loginField} =`, loginValue);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if user is active
    if (user.status !== 'active') {
      console.log('❌ Inactive user:', user.email);
      return res.status(401).json({ message: 'Account is inactive' });
    }

    // Check if email is verified - if not, send OTP for verification
    if (!user.email_verified) {
      console.log('📧 Unverified email, sending verification OTP:', user.email);
      
      // Generate OTP for email verification
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete any existing OTPs for email verification
      await pool.execute('DELETE FROM otp_codes WHERE email = ? AND purpose = ?', [user.email, 'email_verification']);

      // Store OTP for email verification
      await pool.execute(
        'INSERT INTO otp_codes (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
        [user.email, otp, 'email_verification', expiresAt]
      );

      // Send OTP email
      const emailResult = await sendOTPEmail(user.email, otp);
      if (!emailResult.success) {
        return res.status(500).json({ message: 'Failed to send verification OTP' });
      }

      console.log('📧 Returning verification required response:', {
        message: 'Please verify your email. OTP sent to your email address.',
        requiresVerification: true,
        email: user.email
      });
      return res.status(401).json({ 
        message: 'Please verify your email. OTP sent to your email address.',
        requiresVerification: true,
        email: user.email
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', user.email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ Login successful:', email);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        company: user.company,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Error logging in user' });
  }
});

// Get current user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT id, name, email, phone, company, role, status, created_at FROM users WHERE id = ?', [req.user.userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Profile update request:', req.body);
    const { name, phone, company } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Update user profile
    await pool.execute(
      'UPDATE users SET name = ?, phone = ?, company = ? WHERE id = ?',
      [name, phone || null, company || null, req.user.userId]
    );

    // Get updated user data
    const [updatedUsers] = await pool.execute(
      'SELECT id, name, email, phone, company, role, status, created_at FROM users WHERE id = ?',
      [req.user.userId]
    );

    console.log('✅ Profile updated successfully');
    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      user: updatedUsers[0]
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Change user password
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    console.log('🔒 Password change request');
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get current user data
    const [users] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, req.user.userId]
    );

    console.log('✅ Password changed successfully');
    res.json({ 
      success: true, 
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('❌ Password change error:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
});

// ==================== EMAIL AUTHENTICATION ENDPOINTS ====================

// Send OTP for login
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, phone } = req.body;
    
    if (!email && !phone) {
      return res.status(400).json({ message: 'Email or phone number is required' });
    }

    let userEmail;
    
    // If email is provided, use it directly
    if (email) {
      userEmail = email;
    } else {
      // If phone is provided, find user by phone and get their email
      const [users] = await pool.execute('SELECT email FROM users WHERE phone = ?', [phone]);
      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      userEmail = users[0].email;
    }

    // Check if user exists by email (OTP will always be sent to email)
    const [users] = await pool.execute('SELECT id, name FROM users WHERE email = ?', [userEmail]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate and store OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for this email
    await pool.execute('DELETE FROM otp_codes WHERE email = ? AND purpose = ?', [userEmail, 'login']);

    // Store new OTP
    await pool.execute(
      'INSERT INTO otp_codes (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [userEmail, otp, 'login', expiresAt]
    );

    // Send OTP email
    const emailResult = await sendOTPEmail(userEmail, otp);
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    console.log('✅ OTP sent successfully:', userEmail);
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('❌ Send OTP error:', error);
    res.status(500).json({ message: 'Error sending OTP' });
  }
});

// Verify OTP and login
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, phone, otp } = req.body;
    
    if ((!email && !phone) || !otp) {
      return res.status(400).json({ message: 'Email or phone number and OTP are required' });
    }

    let userEmail;
    
    // If email is provided, use it directly
    if (email) {
      userEmail = email;
    } else {
      // If phone is provided, find user by phone and get their email
      const [users] = await pool.execute('SELECT email FROM users WHERE phone = ?', [phone]);
      if (users.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      userEmail = users[0].email;
    }

    // Find valid OTP using email (OTP is always stored with email)
    const [otpRecords] = await pool.execute(
      'SELECT * FROM otp_codes WHERE email = ? AND otp_code = ? AND purpose = ? AND used = FALSE AND expires_at > NOW()',
      [userEmail, otp, 'login']
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await pool.execute('UPDATE otp_codes SET used = TRUE WHERE id = ?', [otpRecords[0].id]);

    // Get user details
    const [users] = await pool.execute('SELECT * FROM users WHERE email = ?', [userEmail]);
    const user = users[0];

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        name: user.name,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('✅ OTP verified and login successful:', email);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        company: user.company,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({ message: 'Error verifying OTP' });
  }
});

// Verify OTP for email verification (signup)
app.post('/api/auth/verify-email-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    console.log('🔍 OTP Verification Request:', { email, otp });
    
    if (!email || !otp) {
      console.log('❌ Missing email or OTP');
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Find valid OTP for email verification
    console.log('🔍 Searching for OTP in database...');
    const [otpRecords] = await pool.execute(
      'SELECT * FROM otp_codes WHERE email = ? AND otp_code = ? AND purpose = ? AND used = FALSE AND expires_at > NOW()',
      [email, otp, 'email_verification']
    );

    console.log('📧 OTP Records found:', otpRecords.length);
    if (otpRecords.length > 0) {
      console.log('✅ Valid OTP found:', otpRecords[0]);
    } else {
      // Let's check what OTPs exist for this email
      const [allOtps] = await pool.execute(
        'SELECT * FROM otp_codes WHERE email = ? ORDER BY created_at DESC LIMIT 5',
        [email]
      );
      console.log('📧 All OTPs for this email:', allOtps);
    }

    if (otpRecords.length === 0) {
      console.log('❌ Invalid or expired OTP');
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await pool.execute('UPDATE otp_codes SET used = TRUE WHERE id = ?', [otpRecords[0].id]);

    // Update user as verified and active
    await pool.execute('UPDATE users SET email_verified = TRUE, status = ? WHERE email = ?', ['active', email]);

    console.log('✅ Email verified successfully:', email);
    console.log('📧 Sending response:', {
      message: 'Email verified successfully! You can now login to your account.',
      success: true
    });
    res.json({
      message: 'Email verified successfully! You can now login to your account.',
      success: true
    });
  } catch (error) {
    console.error('❌ Verify email OTP error:', error);
    res.status(500).json({ message: 'Error verifying email OTP' });
  }
});

// Send email verification for signup
app.post('/api/auth/send-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists and is not verified
    const [users] = await pool.execute('SELECT id, name, email_verified FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    if (user.email_verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate verification token
    const verificationToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Delete any existing verification tokens
    await pool.execute('DELETE FROM email_verifications WHERE user_id = ?', [user.id]);

    // Store verification token
    await pool.execute(
      'INSERT INTO email_verifications (user_id, email, verification_token, expires_at) VALUES (?, ?, ?, ?)',
      [user.id, email, verificationToken, expiresAt]
    );

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationToken);
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send verification email' });
    }

    console.log('✅ Verification email sent successfully:', email);
    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    console.error('❌ Send verification error:', error);
    res.status(500).json({ message: 'Error sending verification email' });
  }
});

// Verify email
app.get('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    // Find valid verification token
    const [verificationRecords] = await pool.execute(
      'SELECT * FROM email_verifications WHERE verification_token = ? AND verified = FALSE AND expires_at > NOW()',
      [token]
    );

    if (verificationRecords.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    const verification = verificationRecords[0];

    // Mark email as verified
    await pool.execute('UPDATE users SET email_verified = TRUE, status = ? WHERE id = ?', ['active', verification.user_id]);
    await pool.execute('UPDATE email_verifications SET verified = TRUE WHERE id = ?', [verification.id]);

    console.log('✅ Email verified successfully:', verification.email);
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('❌ Verify email error:', error);
    res.status(500).json({ message: 'Error verifying email' });
  }
});

// Resend email verification OTP
app.post('/api/auth/resend-verification-otp', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists and is not verified
    const [users] = await pool.execute('SELECT id, name, email_verified FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    if (user.email_verified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    // Generate new OTP for email verification
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTPs for email verification
    await pool.execute('DELETE FROM otp_codes WHERE email = ? AND purpose = ?', [email, 'email_verification']);

    // Store new OTP
    await pool.execute(
      'INSERT INTO otp_codes (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [email, otp, 'email_verification', expiresAt]
    );

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send OTP email' });
    }

    console.log('✅ Email verification OTP resent successfully:', email);
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('❌ Resend verification OTP error:', error);
    res.status(500).json({ message: 'Error sending OTP' });
  }
});

// Send password reset email
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user exists
    const [users] = await pool.execute('SELECT id, name FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Generate OTP for password reset
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing OTP codes for password reset
    await pool.execute('DELETE FROM otp_codes WHERE email = ? AND purpose = ?', [email, 'password_reset']);

    // Store OTP for password reset
    await pool.execute(
      'INSERT INTO otp_codes (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)',
      [email, otp, 'password_reset', expiresAt]
    );

    // Send OTP email for password reset
    const emailResult = await sendOTPEmail(email, otp);
    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send password reset OTP' });
    }

    console.log('✅ Password reset OTP sent successfully:', email);
    res.json({ 
      message: 'Password reset OTP sent successfully. Please check your email.',
      requiresOTP: true,
      email: email
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ message: 'Error sending password reset OTP' });
  }
});

// Reset password with OTP
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    // Find valid OTP for password reset
    const [otpRecords] = await pool.execute(
      'SELECT * FROM otp_codes WHERE email = ? AND otp_code = ? AND purpose = ? AND used = FALSE AND expires_at > NOW()',
      [email, otp, 'password_reset']
    );

    if (otpRecords.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const otpRecord = otpRecords[0];

    // Get user ID
    const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = users[0].id;

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password and mark OTP as used
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    await pool.execute('UPDATE otp_codes SET used = TRUE WHERE id = ?', [otpRecord.id]);

    console.log('✅ Password reset successfully for user:', userId);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

// ==================== USER ADDRESSES ENDPOINTS ====================

// Get user addresses
app.get('/api/auth/addresses', authenticateToken, async (req, res) => {
  try {
    const [addresses] = await pool.execute(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [req.user.userId]
    );
    res.json(addresses);
  } catch (error) {
    console.error('❌ Addresses fetch error:', error);
    res.status(500).json({ message: 'Error fetching addresses' });
  }
});

// Add new address
app.post('/api/auth/addresses', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address, city, state, pincode, country, is_default } = req.body;
    
    if (!name || !phone || !address) {
      return res.status(400).json({ message: 'Name, phone, and address are required' });
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await pool.execute('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?', [req.user.userId]);
    }

    const [result] = await pool.execute(
      'INSERT INTO user_addresses (user_id, name, phone, address, city, state, pincode, country, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.userId, name, phone, address, city || null, state || null, pincode || null, country || 'India', is_default || false]
    );

    res.status(201).json({
      message: 'Address added successfully',
      address: {
        id: result.insertId,
        user_id: req.user.userId,
        name,
        phone,
        address,
        city,
        state,
        pincode,
        country,
        is_default
      }
    });
  } catch (error) {
    console.error('❌ Address add error:', error);
    res.status(500).json({ message: 'Error adding address' });
  }
});

// Update address
app.put('/api/auth/addresses/:id', authenticateToken, async (req, res) => {
  try {
    const addressId = req.params.id;
    const { name, phone, address, city, state, pincode, country, is_default } = req.body;
    
    if (!name || !phone || !address) {
      return res.status(400).json({ message: 'Name, phone, and address are required' });
    }

    // Check if address belongs to user
    const [existingAddresses] = await pool.execute(
      'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, req.user.userId]
    );

    if (existingAddresses.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await pool.execute('UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND id != ?', [req.user.userId, addressId]);
    }

    await pool.execute(
      'UPDATE user_addresses SET name = ?, phone = ?, address = ?, city = ?, state = ?, pincode = ?, country = ?, is_default = ? WHERE id = ? AND user_id = ?',
      [name, phone, address, city || null, state || null, pincode || null, country || 'India', is_default || false, addressId, req.user.userId]
    );

    res.json({ 
      success: true, 
      message: 'Address updated successfully'
    });
  } catch (error) {
    console.error('❌ Address update error:', error);
    res.status(500).json({ message: 'Error updating address' });
  }
});

// Delete address
app.delete('/api/auth/addresses/:id', authenticateToken, async (req, res) => {
  try {
    const addressId = req.params.id;

    // Check if address belongs to user
    const [existingAddresses] = await pool.execute(
      'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, req.user.userId]
    );

    if (existingAddresses.length === 0) {
      return res.status(404).json({ message: 'Address not found' });
    }

    await pool.execute(
      'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
      [addressId, req.user.userId]
    );

    res.json({ 
      success: true, 
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('❌ Address deletion error:', error);
    res.status(500).json({ message: 'Error deleting address' });
  }
});

// ==================== ORDERS ENDPOINTS ====================

// Create new order
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

// Note: Order endpoints removed - orders are now sent directly to WhatsApp

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

// Submit contact form
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, company, subject, message, serviceType } = req.body;
    
    // Only name is required
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

// Get WhatsApp QR Code for initial setup
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

// Get WhatsApp service status
app.get('/api/whatsapp/status', async (req, res) => {
  try {
    const isReady = whatsappService.isClientReady();
    const hasQR = !!whatsappService.getQRCode();
    
    res.json({
      success: true,
      isReady: isReady,
      hasQRCode: hasQR,
      status: isReady ? 'ready' : hasQR ? 'waiting_for_scan' : 'initializing'
    });
  } catch (error) {
    console.error('❌ Error getting WhatsApp status:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting WhatsApp status'
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



// Database connection test function
async function testDatabaseConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log(`📡 Database Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`👤 Database User: ${process.env.DB_USER || 'root'}`);
    console.log(`🗄️  Database Name: ${process.env.DB_NAME || 'hugly_printing_db'}`);
    console.log(`🔌 Database Port: ${process.env.DB_PORT || 3306}`);
    console.log('');
    
    // Test basic connection
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful');
    
    // Get database info
    const [versionRows] = await connection.execute('SELECT VERSION() as version');
    const [tableRows] = await connection.execute('SHOW TABLES');
    
    console.log(`📊 MySQL Version: ${versionRows[0].version}`);
    console.log(`📋 Tables found: ${tableRows.length}`);
    
    // List important tables
    const importantTables = ['users', 'orders', 'order_items', 'contact_messages', 'otp_codes'];
    const existingTables = tableRows.map(row => Object.values(row)[0]);
    
    console.log('🔍 Important tables status:');
    importantTables.forEach(tableName => {
      const status = existingTables.includes(tableName) ? '✅' : '❌';
      console.log(`   ${status} ${tableName}`);
    });
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.error(`   User: ${process.env.DB_USER || 'root'}`);
    console.error(`   Database: ${process.env.DB_NAME || 'hugly_printing_db'}`);
    console.error(`   Port: ${process.env.DB_PORT || 3306}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check if MySQL server is running');
    console.log('   2. Verify database credentials in .env file');
    console.log('   3. Ensure database exists');
    console.log('   4. Check MySQL user permissions');
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
    console.log('📧 Email service will be tested when needed');
    
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
  console.log('  - POST /api/auth/register');
  console.log('  - POST /api/auth/login');
  console.log('  - GET  /api/auth/profile');
  console.log('  - GET  /api/auth/addresses');
  console.log('  - POST /api/auth/addresses');
          console.log('  - POST /api/orders');
  console.log('  - GET  /api/products');
  console.log('  - POST /api/contact');
          console.log('  - GET  /api/whatsapp/qr');
          console.log('  - GET  /api/whatsapp/status');
});
