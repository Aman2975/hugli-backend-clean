const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Add your password if needed
  database: 'hugli_printing_db',
  port: 3306
};

async function testOTPFlow() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🔍 Testing OTP Flow...\n');
    
    // 1. Check if there are any unverified users
    const [users] = await connection.execute(
      'SELECT id, name, email, phone, email_verified, status FROM users WHERE email_verified = FALSE LIMIT 5'
    );
    
    console.log('📋 Unverified users:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}, Phone: ${user.phone}, Verified: ${user.email_verified}, Status: ${user.status}`);
    });
    
    if (users.length === 0) {
      console.log('✅ All users are verified!');
      return;
    }
    
    // 2. Check OTP codes for email verification
    const [otpCodes] = await connection.execute(
      'SELECT * FROM otp_codes WHERE purpose = ? ORDER BY created_at DESC LIMIT 5',
      ['email_verification']
    );
    
    console.log('\n📧 Recent email verification OTPs:');
    otpCodes.forEach(otp => {
      console.log(`- Email: ${otp.email}, OTP: ${otp.otp_code}, Used: ${otp.used}, Expires: ${otp.expires_at}`);
    });
    
    // 3. Test: Find user by phone and get their email
    const testPhone = users[0].phone;
    if (testPhone) {
      console.log(`\n🔍 Testing phone lookup for: ${testPhone}`);
      const [phoneUsers] = await connection.execute(
        'SELECT id, name, email, phone, email_verified FROM users WHERE phone = ?',
        [testPhone]
      );
      
      if (phoneUsers.length > 0) {
        const user = phoneUsers[0];
        console.log(`✅ Found user by phone: ${user.name} (${user.email})`);
        console.log(`   Email verified: ${user.email_verified}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

testOTPFlow();
