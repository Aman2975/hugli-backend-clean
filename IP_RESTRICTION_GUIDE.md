# IP Restriction Guide

## Overview
This backend now includes IP restriction middleware to control access to your API endpoints. You can restrict access to specific IP addresses for enhanced security.

## Configuration

### Environment Variables
Add these to your `.env` file or set as system environment variables:

```bash
# Enable/disable IP restriction
ENABLE_IP_RESTRICTION=true

# Comma-separated list of allowed IP addresses
ALLOWED_IPS=127.0.0.1,192.168.1.100,10.0.0.50
```

### Default Configuration
- **ENABLE_IP_RESTRICTION**: `false` (disabled by default)
- **ALLOWED_IPS**: `['127.0.0.1', '::1', '::ffff:127.0.0.1']` (localhost only)

## IP Restriction Levels

### 1. General IP Restriction
- Applied to **ALL API endpoints**
- Controlled by `ENABLE_IP_RESTRICTION` setting
- Uses `ALLOWED_IPS` configuration

### 2. Admin IP Restriction
- Applied to **ALL admin endpoints** (`/api/admin/*`)
- **Always enforced** when IP restriction is enabled
- Stricter security for administrative functions

## Admin Endpoints with IP Restriction
- `POST /api/admin/login`
- `GET /api/admin/orders`
- `GET /api/admin/orders/:orderId`
- `PUT /api/admin/orders/:orderId/status`
- `DELETE /api/admin/orders/:orderId`
- `DELETE /api/admin/orders/status/:status`
- `GET /api/admin/contacts`
- `PUT /api/admin/contacts/:contactId/status`

## Usage Examples

### Enable IP Restriction for Production
```bash
# In your .env file
ENABLE_IP_RESTRICTION=true
ALLOWED_IPS=192.168.1.100,192.168.1.101,10.0.0.50
```

### Allow Multiple IP Addresses
```bash
# Comma-separated list
ALLOWED_IPS=127.0.0.1,192.168.1.100,192.168.1.101,10.0.0.50,203.0.113.1
```

### Disable IP Restriction (Development)
```bash
# In your .env file
ENABLE_IP_RESTRICTION=false
```

## Response Format

### Access Denied Response
```json
{
  "success": false,
  "message": "Access denied from this IP address",
  "error": "IP_RESTRICTION",
  "clientIP": "192.168.1.200",
  "timestamp": "2024-01-05T10:30:00.000Z"
}
```

### Admin Access Denied Response
```json
{
  "success": false,
  "message": "Admin access denied from this IP address",
  "error": "ADMIN_IP_RESTRICTION",
  "clientIP": "192.168.1.200",
  "timestamp": "2024-01-05T10:30:00.000Z"
}
```

## Logging

The middleware logs all access attempts:
- ✅ **Allowed access**: `IP Access Allowed: 192.168.1.100`
- 🚫 **Denied access**: `IP Access Denied: 192.168.1.200`
- 🔐 **Admin access**: `Admin IP Access Allowed: 192.168.1.100`

## Security Considerations

1. **IPv6 Support**: The middleware handles both IPv4 and IPv6 addresses
2. **Proxy Support**: Handles `X-Forwarded-For` headers for reverse proxies
3. **Normalization**: Automatically normalizes IP addresses for comparison
4. **Admin Protection**: Admin endpoints always enforce IP restriction when enabled

## Testing

### Test with curl
```bash
# Test from allowed IP
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","message":"Hello"}'

# Test from different IP (should be denied if not in ALLOWED_IPS)
curl -X POST http://your-server:5000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

## Troubleshooting

### Common Issues

1. **Localhost not working**: Ensure `127.0.0.1` or `::1` is in `ALLOWED_IPS`
2. **IPv6 issues**: Add both IPv4 and IPv6 versions of your IP
3. **Proxy issues**: Check if your server is behind a reverse proxy

### Debug Mode
Check server logs for IP restriction messages:
```
🔧 Configuration loaded:
   IP Restriction: ENABLED
   Allowed IPs: 127.0.0.1, 192.168.1.100
✅ IP Access Allowed: 127.0.0.1
🚫 IP Access Denied: 192.168.1.200
```
