const axios = require('axios');

async function restartWhatsApp() {
  try {
    console.log('🔄 Restarting WhatsApp service...');
    
    const response = await axios.post('http://localhost:5000/api/whatsapp/restart');
    
    if (response.data.success) {
      console.log('✅ WhatsApp service restart initiated successfully');
      console.log('📱 Please check the server logs for QR code if needed');
    } else {
      console.log('❌ Failed to restart WhatsApp service:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error restarting WhatsApp service:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the restart
restartWhatsApp();
