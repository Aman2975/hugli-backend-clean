// Production Configuration for VPS Deployment
// This file provides fallback values when .env files are not available

const config = {
  // Server Configuration
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'production',
  
  // Database Configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'amanvps',
  DB_PASSWORD: process.env.DB_PASSWORD || 'Aman@2003',
  DB_NAME: process.env.DB_NAME || 'hugli_printing_db',
  DB_PORT: process.env.DB_PORT || 3306,
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'hugli-jwt-secret-key-2024-production',
  
  // Email Configuration
  GMAIL_USER: process.env.GMAIL_USER || 'bhavnishgarg94@gmail.com',
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || 'ilsk pond lszj xjsi',
  
  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // WhatsApp Configuration
  WHATSAPP_TARGET_NUMBER: process.env.WHATSAPP_TARGET_NUMBER || '919464820510',
  
  // IP Restriction Configuration
  ALLOWED_IPS: process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : ['127.0.0.1', '::1', '::ffff:127.0.0.1'],
  ENABLE_IP_RESTRICTION: process.env.ENABLE_IP_RESTRICTION === 'true' || false,
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};

// Validate required configuration
const requiredConfig = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingConfig = requiredConfig.filter(key => !config[key]);

if (missingConfig.length > 0) {
  console.warn('⚠️  Missing configuration:', missingConfig.join(', '));
  console.warn('Using default values. Please set environment variables for production.');
}

// Log configuration (without sensitive data)
console.log('🔧 Configuration loaded:');
console.log(`   Port: ${config.PORT}`);
console.log(`   Environment: ${config.NODE_ENV}`);
console.log(`   Database: ${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`);
console.log(`   Database User: ${config.DB_USER}`);
console.log(`   CORS Origin: ${config.CORS_ORIGIN}`);
console.log(`   IP Restriction: ${config.ENABLE_IP_RESTRICTION ? 'ENABLED' : 'DISABLED'}`);
if (config.ENABLE_IP_RESTRICTION) {
  console.log(`   Allowed IPs: ${config.ALLOWED_IPS.join(', ')}`);
}

module.exports = config;
