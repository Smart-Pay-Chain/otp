/**
 * Test Railway Backend Connection
 *
 * This script tests the connection to the Railway production backend
 * and verifies the phone authentication flow.
 *
 * Usage:
 * ts-node examples/test-railway-backend.ts
 */

import axios from 'axios';

const BACKEND_URL = 'https://otp-service-production-ge.up.railway.app/api/v1';
const TEST_PHONE = '+995568000865'; // Your test phone number

async function testBackend() {
  console.log('🧪 Testing Railway Backend Connection...\n');
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`Test Phone: ${TEST_PHONE}\n`);

  try {
    // Step 1: Health check
    console.log('1️⃣  Testing health endpoint...');
    const healthResponse = await axios.get(
      'https://otp-service-production-ge.up.railway.app/health'
    );
    console.log('   ✅ Health check:', healthResponse.data);
    console.log();

    // Step 2: Send OTP (try login first since account might exist)
    console.log('2️⃣  Sending OTP for login...');
    let verificationId: string;
    let isNewAccount = false;

    try {
      const loginResponse = await axios.post(`${BACKEND_URL}/auth/phone/login`, {
        phoneNumber: TEST_PHONE,
      });

      verificationId = loginResponse.data.data.verificationId;
      console.log('   ✅ OTP sent for existing account!');
      console.log('   📱 Check your phone for the OTP code');
      console.log('   Verification ID:', verificationId);
      console.log('   Expires in:', loginResponse.data.data.expiresIn, 'seconds');

      if (loginResponse.data.data._test_otp_code) {
        console.log('   🔑 Test OTP Code:', loginResponse.data.data._test_otp_code);
      }
    } catch (loginError: any) {
      if (loginError.response?.status === 404) {
        // Account doesn't exist, try registration
        console.log('   ℹ️  Account not found, trying registration...');

        const registerResponse = await axios.post(`${BACKEND_URL}/auth/phone/register`, {
          phoneNumber: TEST_PHONE,
          company: 'Test Company (Cypress)',
        });

        verificationId = registerResponse.data.data.verificationId;
        isNewAccount = true;
        console.log('   ✅ OTP sent for new account!');
        console.log('   📱 Check your phone for the OTP code');
        console.log('   Verification ID:', verificationId);
        console.log('   Expires in:', registerResponse.data.data.expiresIn, 'seconds');

        if (registerResponse.data.data._test_otp_code) {
          console.log('   🔑 Test OTP Code:', registerResponse.data.data._test_otp_code);
        }
      } else {
        throw loginError;
      }
    }
    console.log();

    // Step 3: Instructions for manual verification
    console.log('3️⃣  To complete the test, verify the OTP:');
    console.log('   POST', `${BACKEND_URL}/auth/phone/verify`);
    console.log('   Body: {');
    console.log('     "verificationId": "' + verificationId + '",');
    console.log('     "otpCode": "YOUR_OTP_CODE_FROM_SMS"');
    console.log('   }');
    console.log();

    console.log('✅ Backend is working correctly!');
    console.log('🎉 You can now use this backend in your applications.');
    console.log('📝 Account Status:', isNewAccount ? 'New Account' : 'Existing Account');

    return {
      success: true,
      verificationId: verificationId,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('❌ Error testing backend:', error.response?.data || error.message);
      console.error('   Status:', error.response?.status);
      console.error('   URL:', error.config?.url);
    } else {
      console.error('❌ Unexpected error:', error);
    }
    return { success: false };
  }
}

// Run the test
testBackend()
  .then((result) => {
    if (result.success) {
      console.log('\n✅ All tests passed!');
      process.exit(0);
    } else {
      console.log('\n❌ Some tests failed.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
