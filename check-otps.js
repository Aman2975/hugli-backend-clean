const mysql = require('mysql2/promise');

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Add your password if needed
  database: 'hugli_printing_db',
  port: 3306
};

async function checkOTPsForUser(email) {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log(`🔍 Checking OTPs for user: ${email}\n`);
    
    // Check all OTPs for this email
    const [otps] = await connection.execute(
      'SELECT * FROM otp_codes WHERE email = ? ORDER BY created_at DESC LIMIT 10',
      [email]
    );
    
    console.log(`📧 Found ${otps.length} OTP records:`);
    otps.forEach((otp, index) => {
      console.log(`${index + 1}. OTP: ${otp.otp_code}`);
      console.log(`   Purpose: ${otp.purpose}`);
      console.log(`   Used: ${otp.used}`);
      console.log(`   Created: ${otp.created_at}`);
      console.log(`   Expires: ${otp.expires_at}`);
      console.log(`   Expired: ${new Date() > new Date(otp.expires_at)}`);
      console.log('');
    });
    
    // Check user verification status
    const [users] = await connection.execute(
      'SELECT id, name, email, email_verified, status FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length > 0) {
      const user = users[0];
      console.log('👤 User info:');
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Email Verified: ${user.email_verified}`);
      console.log(`   Status: ${user.status}`);
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: node check-otps.js <email>');
  console.log('Example: node check-otps.js amandeep@gmail.com');
  process.exit(1);
}

checkOTPsForUser(email);
