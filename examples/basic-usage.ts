/**
 * Basic Usage Example
 *
 * This example demonstrates the basic OTP workflow:
 * 1. Send an OTP to a phone number
 * 2. Verify the OTP code
 */

import { OtpClient, OtpChannel } from '@smart-pay-chain/otp';

async function basicExample() {
  // Initialize the client with your API key
  const client = new OtpClient({
    apiKey: process.env.OTP_API_KEY || 'your-api-key-here',
  });

  try {
    // Step 1: Send an OTP
    console.log('Sending OTP...');
    const sendResult = await client.sendOtp({
      phoneNumber: '+995555123456',
      channel: OtpChannel.SMS,
      ttl: 300, // 5 minutes
      length: 6,
    });

    console.log('OTP sent successfully!');
    console.log('Request ID:', sendResult.requestId);
    console.log('Expires at:', sendResult.expiresAt);
    console.log('Status:', sendResult.status);

    // Step 2: Verify the OTP (in a real app, the user would enter this code)
    console.log('\nVerifying OTP...');
    const verifyResult = await client.verifyOtp({
      requestId: sendResult.requestId,
      code: '123456', // In production, this comes from user input
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
    });

    if (verifyResult.success) {
      console.log('✓ OTP verified successfully!');
      console.log('Message:', verifyResult.message);
    } else {
      console.log('✗ OTP verification failed');
      console.log('Message:', verifyResult.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
basicExample();

