# WhatsApp Service Troubleshooting Guide

## Common Issues and Solutions

### 1. "Session closed" or "Execution context was destroyed" Errors

**Symptoms:**
- Error: `Protocol error (Runtime.callFunctionOn): Session closed`
- Error: `Execution context was destroyed`
- WhatsApp messages fail to send

**Causes:**
- Browser session disconnected
- WhatsApp Web session expired
- Network connectivity issues
- Memory issues

**Solutions:**

#### Automatic Recovery (Recommended)
The improved WhatsApp service now has automatic reconnection:
- Automatically detects session loss
- Attempts reconnection up to 5 times
- 10-second delay between attempts
- No manual intervention needed in most cases

#### Manual Restart
If automatic recovery fails, manually restart the service:

```bash
# Method 1: Using the restart script
node restart-whatsapp.js

# Method 2: Using API endpoint
curl -X POST http://localhost:5000/api/whatsapp/restart

# Method 3: Restart the entire server
# Stop: Ctrl+C or kill process
# Start: npm start
```

### 2. QR Code Issues

**Symptoms:**
- No QR code generated
- QR code not updating
- Cannot scan QR code

**Solutions:**

1. **Check QR Code:**
   ```bash
   curl http://localhost:5000/api/whatsapp/qr
   ```

2. **Check Status:**
   ```bash
   curl http://localhost:5000/api/whatsapp/status
   ```

3. **Force Restart:**
   ```bash
   curl -X POST http://localhost:5000/api/whatsapp/restart
   ```

### 3. Service Not Ready

**Symptoms:**
- `isReady: false`
- Messages not sending
- Service shows as disconnected

**Solutions:**

1. **Check Service Status:**
   ```bash
   curl http://localhost:5000/api/whatsapp/status
   ```

2. **Expected Response:**
   ```json
   {
     "success": true,
     "isReady": true,
     "hasQRCode": false,
     "isInitializing": false,
     "reconnectAttempts": 0,
     "maxReconnectAttempts": 5,
     "targetNumber": "917347320510",
     "status": "ready"
   }
   ```

3. **If Not Ready:**
   - Scan QR code if `hasQRCode: true`
   - Wait for initialization if `isInitializing: true`
   - Restart service if stuck

### 4. Performance Issues

**Symptoms:**
- Slow message sending
- High memory usage
- Frequent disconnections

**Solutions:**

1. **Monitor Memory:**
   ```bash
   # Check Node.js process memory
   tasklist | findstr node
   ```

2. **Restart Periodically:**
   - Restart service every 24 hours
   - Monitor server logs for memory issues

3. **System Resources:**
   - Ensure adequate RAM (minimum 2GB)
   - Close unnecessary applications
   - Monitor CPU usage

## API Endpoints

### Get WhatsApp Status
```bash
GET /api/whatsapp/status
```
Returns detailed status information including connection state, reconnection attempts, and target number.

### Get QR Code
```bash
GET /api/whatsapp/qr
```
Returns the current QR code for WhatsApp Web authentication.

### Restart Service
```bash
POST /api/whatsapp/restart
```
Manually restarts the WhatsApp service (useful for troubleshooting).

## Log Monitoring

### Key Log Messages to Watch:

**Success Messages:**
- `✅ WhatsApp Client is ready!`
- `✅ WhatsApp message sent successfully`
- `🔐 WhatsApp Client authenticated`

**Warning Messages:**
- `⚠️ WhatsApp service is already initializing`
- `⚠️ WhatsApp browser connection lost`
- `🔄 Attempting to reconnect WhatsApp service`

**Error Messages:**
- `❌ WhatsApp authentication failed`
- `❌ Error sending WhatsApp message`
- `❌ Max reconnection attempts reached`

## Best Practices

1. **Regular Monitoring:**
   - Check service status periodically
   - Monitor server logs for errors
   - Watch for memory usage

2. **Preventive Maintenance:**
   - Restart service daily during low traffic
   - Monitor WhatsApp Web session
   - Keep server updated

3. **Backup Plans:**
   - Always save contact messages to database
   - Have manual contact methods available
   - Monitor order processing

## Emergency Procedures

### Complete Service Failure
1. Stop the server: `Ctrl+C`
2. Wait 10 seconds
3. Restart: `npm start`
4. Scan QR code when prompted
5. Test with a contact form submission

### Persistent Issues
1. Clear WhatsApp session data:
   ```bash
   # Delete session files (be careful!)
   rm -rf .wwebjs_auth
   ```
2. Restart server
3. Scan QR code again

### Contact Information
- Target Number: 917347320510
- Service runs on port 5000
- Database backup available for contact messages
