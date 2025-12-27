/**
 * Test Mode Example
 *
 * This example demonstrates how to use test mode for development and automated testing.
 * Test mode allows you to test OTP flows without sending real SMS messages.
 */

import { OtpClient, TEST_PHONE_NUMBERS, TEST_OTP_CODE } from '@smartpaychain/otp-sdk';

async function testModeExample() {
  const client = new OtpClient({
    apiKey: process.env.OTP_API_KEY || 'your-api-key-here',
    autoConfig: true, // Auto-detect test mode from server
  });

  console.log('=== OTP SDK Test Mode Example ===\n');

  // Check if server is in test mode
  const testMode = await client.isTestMode();
  console.log(`Test mode enabled: ${testMode}`);

  if (!testMode) {
    console.log('\n⚠️  Server is not in test mode.');
    console.log('To enable test mode, set TEST_MODE=true on the server.');
    return;
  }

  console.log('\n✓ Server is in test mode - safe to use test phone numbers\n');

  // Get server configuration
  const config = await client.getConfig();
  console.log('Test mode configuration:');
  console.log('- Test phone numbers:', config.testMode?.testPhoneNumbers);
  console.log('- Fixed OTP code:', config.testMode?.fixedOtpCode);
  console.log('');

  // Example 1: Successful OTP flow
  console.log('=== Example 1: Successful OTP Flow ===');
  try {
    const sendResult = await client.sendOtp({
      phoneNumber: TEST_PHONE_NUMBERS.SUCCESS,
    });

    console.log('✓ OTP sent successfully');
    console.log(`Request ID: ${sendResult.requestId}`);
    console.log(`Expires at: ${sendResult.expiresAt}`);

    // In test mode, you can get the actual OTP code for automated testing
    const statusWithCode = await client.getStatusWithCode(sendResult.requestId);
    console.log(`OTP Code: ${statusWithCode.otpCode}`);
    console.log(`(In test mode, this is always: ${TEST_OTP_CODE})`);

    // Verify with the fixed test code
    const verifyResult = await client.verifyOtp({
      requestId: sendResult.requestId,
      code: TEST_OTP_CODE,
    });

    console.log(`✓ Verification ${verifyResult.success ? 'successful' : 'failed'}`);
    console.log('');
  } catch (error: any) {
    console.error('✗ Error:', error.message);
  }

  // Example 2: Testing error scenarios
  console.log('=== Example 2: SMS Send Failure ===');
  try {
    await client.sendOtp({
      phoneNumber: TEST_PHONE_NUMBERS.SMS_FAIL,
    });
    console.log('✗ Should have failed');
  } catch (error: any) {
    console.log('✓ Expected error:', error.message);
    console.log(`Error code: ${error.code}`);
  }
  console.log('');

  console.log('=== Example 3: Rate Limit Exceeded ===');
  try {
    await client.sendOtp({
      phoneNumber: TEST_PHONE_NUMBERS.RATE_LIMIT,
    });
    console.log('✗ Should have failed');
  } catch (error: any) {
    console.log('✓ Expected error:', error.message);
    console.log(`Error code: ${error.code}`);
    console.log(`Retryable: ${error.retryable}`);
  }
  console.log('');

  console.log('=== Example 4: Insufficient Balance ===');
  try {
    await client.sendOtp({
      phoneNumber: TEST_PHONE_NUMBERS.INSUFFICIENT_BALANCE,
    });
    console.log('✗ Should have failed');
  } catch (error: any) {
    console.log('✓ Expected error:', error.message);
    console.log(`Error code: ${error.code}`);
  }
  console.log('');

  console.log('=== Example 5: Brand Not Authorized (Georgian numbers) ===');
  try {
    await client.sendOtp({
      phoneNumber: TEST_PHONE_NUMBERS.BRAND_NOT_AUTH,
    });
    console.log('✗ Should have failed');
  } catch (error: any) {
    console.log('✓ Expected error:', error.message);
    console.log(`Error code: ${error.code}`);
  }
  console.log('');

  // Example 6: Automated testing pattern
  console.log('=== Example 6: Automated Testing Pattern ===');
  const result = await testOtpFlow(TEST_PHONE_NUMBERS.SUCCESS, TEST_OTP_CODE);
  console.log(`Automated test ${result ? 'PASSED ✓' : 'FAILED ✗'}`);
  console.log('');

  console.log('=== Test Mode Best Practices ===');
  console.log('1. Never use test mode in production');
  console.log('2. Use getStatusWithCode() only in test/dev environments');
  console.log('3. Test all error scenarios with test phone numbers');
  console.log('4. Use fixed OTP code (123456) for automated tests');
  console.log('5. Check server test mode status before running tests');
}

/**
 * Automated testing pattern
 */
async function testOtpFlow(phoneNumber: string, expectedCode: string): Promise<boolean> {
  try {
    const client = new OtpClient({
      apiKey: process.env.OTP_API_KEY || 'your-api-key-here',
    });

    // Send OTP
    const sendResult = await client.sendOtp({ phoneNumber });

    // Get the actual code (test mode only!)
    const status = await client.getStatusWithCode(sendResult.requestId);

    // Verify it matches expected
    if (status.otpCode !== expectedCode) {
      console.log(`Code mismatch: expected ${expectedCode}, got ${status.otpCode}`);
      return false;
    }

    // Verify OTP
    const verifyResult = await client.verifyOtp({
      requestId: sendResult.requestId,
      code: expectedCode,
    });

    return verifyResult.success;
  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

/**
 * Integration test example
 */
async function integrationTests() {
  console.log('=== Running Integration Tests ===\n');

  const client = new OtpClient({
    apiKey: process.env.OTP_API_KEY || 'your-api-key-here',
    autoConfig: true,
  });

  // Ensure test mode is enabled
  const testMode = await client.isTestMode();
  if (!testMode) {
    console.error('✗ Test mode not enabled on server');
    process.exit(1);
  }

  const tests = [
    {
      name: 'Send and verify OTP',
      phone: TEST_PHONE_NUMBERS.SUCCESS,
      shouldSucceed: true,
    },
    {
      name: 'SMS send failure',
      phone: TEST_PHONE_NUMBERS.SMS_FAIL,
      shouldSucceed: false,
    },
    {
      name: 'Rate limit exceeded',
      phone: TEST_PHONE_NUMBERS.RATE_LIMIT,
      shouldSucceed: false,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await client.sendOtp({ phoneNumber: test.phone });

      if (test.shouldSucceed) {
        console.log(`✓ ${test.name}`);
        passed++;
      } else {
        console.log(`✗ ${test.name} - Should have failed`);
        failed++;
      }
    } catch (error: any) {
      if (!test.shouldSucceed) {
        console.log(`✓ ${test.name} - Failed as expected (${error.code})`);
        passed++;
      } else {
        console.log(`✗ ${test.name} - Unexpected error: ${error.message}`);
        failed++;
      }
    }
  }

  console.log(`\n=== Test Results ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${tests.length}`);

  process.exit(failed > 0 ? 1 : 0);
}

// Choose which example to run
const example = process.argv[2] || 'basic';

switch (example) {
  case 'basic':
    testModeExample();
    break;
  case 'integration':
    integrationTests();
    break;
  default:
    console.log('Usage: ts-node test-mode-example.ts [basic|integration]');
}

