/**
 * Advanced Usage Example
 *
 * This example demonstrates advanced features:
 * - Custom metadata
 * - Idempotency keys
 * - Error handling
 * - Resending OTP
 * - Multiple channels
 */

import {
  OtpClient,
  OtpChannel,
  OtpError,
  RateLimitError,
  OtpExpiredError,
  InvalidOtpError,
} from '@smart-pay-chain/otp';

async function advancedExample() {
  // Initialize with custom configuration
  const client = new OtpClient({
    apiKey: process.env.OTP_API_KEY || 'your-api-key-here',
    baseUrl: 'https://otp-service-production-ge.up.railway.app', // Optional: custom base URL
    timeout: 60000, // 60 seconds
    maxRetries: 3,
    headers: {
      'X-App-Version': '1.0.0',
    },
  });

  try {
    // Send OTP with metadata and idempotency key
    console.log('Sending OTP with metadata...');
    const sendResult = await client.sendOtp({
      phoneNumber: '+995568000865', // Your test phone number
      channel: OtpChannel.WHATSAPP,
      ttl: 600, // 10 minutes
      length: 8,
      metadata: {
        userId: 'user_12345',
        action: 'login',
        ipAddress: '192.168.1.1',
      },
      idempotencyKey: `otp-${Date.now()}`, // Prevents duplicate sends
    });

    console.log('OTP sent via WhatsApp!');
    console.log('Request ID:', sendResult.requestId);

    // Simulate user not receiving the OTP - resend it
    console.log('\nResending OTP...');
    const resendResult = await client.resendOtp({
      requestId: sendResult.requestId,
    });

    console.log('OTP resent successfully!');
    console.log('New Request ID:', resendResult.requestId);

    // Verify with proper error handling
    console.log('\nVerifying OTP with error handling...');
    await verifyWithRetry(client, resendResult.requestId, '12345678');
  } catch (error) {
    handleError(error);
  }
}

/**
 * Verify OTP with retry logic for specific errors
 */
async function verifyWithRetry(
  client: OtpClient,
  requestId: string,
  code: string,
  maxAttempts: number = 3
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await client.verifyOtp({
        requestId,
        code,
        ipAddress: '192.168.1.1',
        userAgent: 'MyApp/1.0',
      });

      if (result.success) {
        console.log(`✓ Verified successfully on attempt ${attempt}`);
        return;
      }
    } catch (error) {
      if (error instanceof InvalidOtpError) {
        console.log(`✗ Invalid OTP code (attempt ${attempt}/${maxAttempts})`);
        if (attempt === maxAttempts) {
          throw error;
        }
        // In a real app, prompt user for code again
      } else if (error instanceof OtpExpiredError) {
        console.log('✗ OTP has expired');
        throw error;
      } else if (error instanceof RateLimitError) {
        console.log('✗ Rate limit exceeded, waiting...');
        await sleep(5000); // Wait 5 seconds
      } else {
        throw error;
      }
    }
  }
}

/**
 * Handle different types of errors
 */
function handleError(error: unknown): void {
  if (error instanceof OtpError) {
    console.error('\n❌ OTP Error:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('Status:', error.statusCode);
    console.error('Retryable:', error.retryable);
    console.error('Request ID:', error.requestId);

    if (error.details) {
      console.error('Details:', error.details);
    }

    // Handle specific error types
    if (error instanceof RateLimitError) {
      console.log('\n💡 Tip: Implement exponential backoff or ask user to wait');
    } else if (error instanceof OtpExpiredError) {
      console.log('\n💡 Tip: Prompt user to request a new OTP');
    } else if (error instanceof InvalidOtpError) {
      console.log('\n💡 Tip: Ask user to check the code and try again');
    }
  } else if (error instanceof Error) {
    console.error('\n❌ Unexpected error:', error.message);
  } else {
    console.error('\n❌ Unknown error:', error);
  }
}

/**
 * Helper to sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run the example
advancedExample();
