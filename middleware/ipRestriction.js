const config = require('../config');

/**
 * IP Restriction Middleware
 * Restricts access to specific IP addresses
 */
const ipRestriction = (req, res, next) => {
  // Skip IP restriction if disabled
  if (!config.ENABLE_IP_RESTRICTION) {
    return next();
  }

  // Get client IP address
  const clientIP = req.ip || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                   req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   '127.0.0.1';

  // Normalize IP addresses (handle IPv6 localhost variants)
  const normalizedClientIP = clientIP.replace('::ffff:', '');

  // Check if IP is allowed
  const isAllowed = config.ALLOWED_IPS.some(allowedIP => {
    const normalizedAllowedIP = allowedIP.replace('::ffff:', '');
    return normalizedClientIP === normalizedAllowedIP;
  });

  if (!isAllowed) {
    console.log(`🚫 IP Access Denied: ${clientIP} (normalized: ${normalizedClientIP})`);
    console.log(`📋 Allowed IPs: ${config.ALLOWED_IPS.join(', ')}`);
    
    return res.status(403).json({
      success: false,
      message: 'Access denied from this IP address',
      error: 'IP_RESTRICTION',
      clientIP: normalizedClientIP,
      timestamp: new Date().toISOString()
    });
  }

  // Log allowed access
  console.log(`✅ IP Access Allowed: ${clientIP} (normalized: ${normalizedClientIP})`);
  next();
};

/**
 * Admin IP Restriction Middleware (stricter for admin endpoints)
 */
const adminIpRestriction = (req, res, next) => {
  // For admin endpoints, always enforce IP restriction
  const clientIP = req.ip || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                   req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                   '127.0.0.1';

  const normalizedClientIP = clientIP.replace('::ffff:', '');

  // Check if IP is allowed
  const isAllowed = config.ALLOWED_IPS.some(allowedIP => {
    const normalizedAllowedIP = allowedIP.replace('::ffff:', '');
    return normalizedClientIP === normalizedAllowedIP;
  });

  if (!isAllowed) {
    console.log(`🚫 Admin IP Access Denied: ${clientIP} (normalized: ${normalizedClientIP})`);
    console.log(`📋 Allowed IPs: ${config.ALLOWED_IPS.join(', ')}`);
    
    return res.status(403).json({
      success: false,
      message: 'Admin access denied from this IP address',
      error: 'ADMIN_IP_RESTRICTION',
      clientIP: normalizedClientIP,
      timestamp: new Date().toISOString()
    });
  }

  console.log(`✅ Admin IP Access Allowed: ${clientIP} (normalized: ${normalizedClientIP})`);
  next();
};

module.exports = {
  ipRestriction,
  adminIpRestriction
};
