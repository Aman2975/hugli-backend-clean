const fetch = require('node-fetch');

async function testOTPVerification() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('🔍 Testing OTP Verification...\n');
    
    // First, let's try to login with phone to trigger OTP
    console.log('📱 Step 1: Login with phone number');
    const loginResponse = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: '9876543210',
        password: 'password123'
      })
    });
    
    const loginResult = await loginResponse.json();
    console.log('Login Response:', loginResult);
    
    if (loginResult.requiresVerification && loginResult.email) {
      console.log('✅ OTP should be sent to:', loginResult.email);
      
      // Now let's check what OTP was actually created
      console.log('\n🔍 Step 2: Checking OTP in database...');
      
      // We need to check the database directly to see the OTP
      const mysql = require('mysql2/promise');
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'hugli_printing_db',
        port: 3306
      });
      
      const [otpRecords] = await connection.execute(
        'SELECT * FROM otp_codes WHERE email = ? AND purpose = ? AND used = FALSE ORDER BY created_at DESC LIMIT 1',
        [loginResult.email, 'email_verification']
      );
      
      if (otpRecords.length > 0) {
        const otp = otpRecords[0].otp_code;
        console.log('📧 Found OTP:', otp);
        
        // Now test OTP verification
        console.log('\n🔍 Step 3: Testing OTP verification');
        const otpResponse = await fetch(`${baseURL}/auth/verify-email-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: loginResult.email,
            otp: otp
          })
        });
        
        const otpResult = await otpResponse.json();
        console.log('OTP Verification Response:', otpResult);
        
        if (otpResult.success) {
          console.log('✅ OTP verification successful!');
        } else {
          console.log('❌ OTP verification failed:', otpResult.message);
        }
        
      } else {
        console.log('❌ No OTP found in database');
      }
      
      await connection.end();
      
    } else {
      console.log('❌ Login did not trigger email verification');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOTPVerification();
