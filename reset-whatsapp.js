const fs = require('fs');
const path = require('path');

console.log('🔄 Resetting WhatsApp client...');

// Remove session directories
const authDir = '.wwebjs_auth';
const cacheDir = '.wwebjs_cache';

try {
    if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
        console.log('✅ Removed .wwebjs_auth directory');
    }
    
    if (fs.existsSync(cacheDir)) {
        fs.rmSync(cacheDir, { recursive: true, force: true });
        console.log('✅ Removed .wwebjs_cache directory');
    }
    
    console.log('🎉 WhatsApp client reset complete!');
    console.log('📝 You can now restart your application with: npm start');
    
} catch (error) {
    console.error('❌ Error resetting WhatsApp client:', error.message);
}
