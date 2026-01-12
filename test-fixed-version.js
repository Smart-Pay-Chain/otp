/**
 * Quick test script to verify the Authorization header fix in v2.1.6
 * Run: node test-fixed-version.js
 */

const { OtpClient, OtpChannel } = require('./dist/index.js');

// Your API key from Railway
const API_KEY = 'otps_SuyMJx5YaJXmuAA7LLf6PPm8ARkKu6C3';
const TEST_PHONE = '+995568000865';

async function testAuthorizationHeader() {
  console.log('🧪 Testing OTP SDK v2.1.6 with Authorization header fix...\n');

  try {
    // Initialize client
    const client = new OtpClient({
      apiKey: API_KEY,
      baseUrl: 'https://otp-service-production-ge.up.railway.app',
    });

    console.log('✅ Client initialized');
    console.log(`📱 Sending OTP to: ${TEST_PHONE}`);
    console.log('⏳ Please wait...\n');

    // Send OTP
    const result = await client.sendOtp({
      phoneNumber: TEST_PHONE,
      channel: OtpChannel.SMS,
    });

    console.log('🎉 SUCCESS! OTP sent successfully!');
    console.log('📋 Response:');
    console.log('   Request ID:', result.requestId);
    console.log('   Expires At:', result.expiresAt);
    console.log('   Status:', result.status);
    console.log('\n✅ Authorization header is working correctly!');
    console.log('🚀 v2.1.6 is ready to publish!');
  } catch (error) {
    console.error('❌ ERROR:', error.message);

    if (error.code === 'AUTHENTICATION_FAILED') {
      console.error('\n⚠️  Authorization header is still not working!');
      console.error('   This means the local build has an issue.');
    } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
      console.log('\n✅ Authorization IS working! (Rate limit means auth passed)');
      console.log('🚀 v2.1.6 is ready to publish!');
    } else {
      console.error('\n⚠️  Unexpected error:', error);
    }
  }
}

// Run the test
testAuthorizationHeader();
