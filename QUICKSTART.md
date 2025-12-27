# Quick Start Guide

Get started with @smartpaychain/otp-sdk v2.0 in 5 minutes!

## What's New in v2.0

- 🧪 Test mode with fixed OTP codes
- 📊 Status checking methods
- 🔄 Automatic idempotency
- 📱 React Native examples
- ⚙️ Auto-configuration from server

## Installation

```bash
npm install @smartpaychain/otp-sdk
```

## Basic Usage

### 1. Initialize the Client

```typescript
import { OtpClient } from '@smartpaychain/otp-sdk';

const client = new OtpClient({
  apiKey: 'your-api-key-here',
  autoConfig: true, // v2.0: Auto-configure from server
});
```

### 2. Send an OTP

```typescript
const result = await client.sendOtp({
  phoneNumber: '+995555123456', // Must be in E.164 format
});

// Save the requestId for verification
console.log('Request ID:', result.requestId);
console.log('Expires at:', result.expiresAt);
```

### 3. Verify the OTP

```typescript
const verification = await client.verifyOtp({
  requestId: result.requestId,
  code: '123456', // Code entered by user
});

if (verification.success) {
  console.log('Phone verified! ✓');
  // Proceed with your app logic
}
```

### 4. Check Status (v2.0)

```typescript
const status = await client.getStatus(result.requestId);
console.log('Status:', status.status);
console.log('Attempts:', status.attempts);
console.log('Expired:', status.isExpired);
```

## Quick Start with Test Mode

Perfect for development and automated testing!

### 1. Check if Test Mode is Enabled

```typescript
import { OtpClient, TEST_PHONE_NUMBERS, TEST_OTP_CODE } from '@smartpaychain/otp-sdk';

const client = new OtpClient({
  apiKey: process.env.OTP_API_KEY,
});

const testMode = await client.isTestMode();
console.log('Test mode:', testMode);
```

### 2. Use Test Phone Numbers

```typescript
if (testMode) {
  // Send OTP using test phone number
  const result = await client.sendOtp({
    phoneNumber: TEST_PHONE_NUMBERS.SUCCESS, // +15005550006
  });

  // Verify with fixed test code
  const verification = await client.verifyOtp({
    requestId: result.requestId,
    code: TEST_OTP_CODE, // Always '123456' in test mode
  });

  console.log('Verified:', verification.success);
}
```

### 3. Get OTP Code for Testing

```typescript
// For automated tests only!
const result = await client.sendOtp({
  phoneNumber: TEST_PHONE_NUMBERS.SUCCESS,
});

// Get the actual OTP code
const status = await client.getStatusWithCode(result.requestId);
console.log('OTP Code:', status.otpCode); // '123456'

// Verify automatically
await client.verifyOtp({
  requestId: result.requestId,
  code: status.otpCode,
});
```

## Mobile App Quick Start

### 1. Backend Setup (Express.js)

```typescript
import { OtpClient } from '@smartpaychain/otp-sdk';

const otpClient = new OtpClient({
  apiKey: process.env.OTP_API_KEY,
});

app.post('/auth/send-otp', async (req, res) => {
  const result = await otpClient.sendOtp({
    phoneNumber: req.body.phoneNumber,
  });
  res.json({ requestId: result.requestId });
});

app.post('/auth/verify-otp', async (req, res) => {
  const result = await otpClient.verifyOtp({
    requestId: req.body.requestId,
    code: req.body.code,
  });
  
  if (result.success) {
    // Generate JWT token
    const token = jwt.sign({ phoneNumber }, SECRET, { expiresIn: '15m' });
    res.json({ success: true, token });
  } else {
    res.status(400).json({ error: result.message });
  }
});
```

### 2. React Native Frontend

```typescript
// See examples/react-native-example.tsx for complete UI

const sendOtp = async (phoneNumber: string) => {
  const response = await fetch('https://yourapi.com/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber }),
  });
  return response.json();
};

const verifyOtp = async (requestId: string, code: string) => {
  const response = await fetch('https://yourapi.com/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ requestId, code }),
  });
  return response.json();
};
```

## Complete Example

```typescript
import { OtpClient, OtpChannel, OtpError } from '@smartpaychain/otp-sdk';

async function verifyPhoneNumber(phoneNumber: string, userCode: string) {
  const client = new OtpClient({
    apiKey: process.env.OTP_API_KEY!,
  });

  try {
    // Step 1: Send OTP
    const otpResult = await client.sendOtp({
      phoneNumber,
      channel: OtpChannel.SMS,
      ttl: 300, // 5 minutes
    });

    console.log(`OTP sent to ${phoneNumber}`);

    // Step 2: Verify OTP (in real app, user enters code)
    const verification = await client.verifyOtp({
      requestId: otpResult.requestId,
      code: userCode,
      ipAddress: '192.168.1.1', // Optional but recommended
    });

    return verification.success;
  } catch (error) {
    if (error instanceof OtpError) {
      console.error('OTP Error:', error.message);
      console.error('Code:', error.code);
    }
    return false;
  }
}

// Usage
const isVerified = await verifyPhoneNumber('+995555123456', '123456');
```

## Environment Setup

Create a `.env` file:

```env
OTP_API_KEY=your-api-key-here
```

Load it in your app:

```typescript
import dotenv from 'dotenv';
dotenv.config();

const client = new OtpClient({
  apiKey: process.env.OTP_API_KEY!,
});
```

## Common Options

### Send OTP Options

```typescript
await client.sendOtp({
  phoneNumber: '+995555123456',  // Required: E.164 format
  channel: OtpChannel.SMS,        // Optional: SMS, WHATSAPP, VOICE
  ttl: 300,                       // Optional: 60-600 seconds
  length: 6,                      // Optional: 4-8 digits
  metadata: { userId: '123' },    // Optional: Custom data
  idempotencyKey: 'unique-key',   // Optional: Prevent duplicates
});
```

### Verify OTP Options

```typescript
await client.verifyOtp({
  requestId: 'req_123',          // Required: From sendOtp
  code: '123456',                // Required: User-entered code
  ipAddress: '192.168.1.1',      // Optional but recommended
  userAgent: 'Mozilla/5.0...',   // Optional
});
```

## Error Handling

```typescript
import {
  OtpError,
  InvalidOtpError,
  OtpExpiredError,
  RateLimitError,
} from '@smartpaychain/otp-sdk';

try {
  await client.verifyOtp({ ... });
} catch (error) {
  if (error instanceof InvalidOtpError) {
    // Wrong code
    console.log('Invalid code. Please try again.');
  } else if (error instanceof OtpExpiredError) {
    // Expired
    console.log('OTP expired. Request a new one.');
  } else if (error instanceof RateLimitError) {
    // Too many attempts
    console.log('Too many attempts. Please wait.');
  } else if (error instanceof OtpError) {
    // Other OTP errors
    console.log('Error:', error.message);
  }
}
```

## Next Steps

- Check out the [complete documentation](./README.md)
- Explore [examples](./examples/)
- Read the [API reference](./README.md#api-reference)
- Learn about [best practices](./README.md#best-practices)

## Getting Help

- **Documentation**: Full docs in [README.md](./README.md)
- **Examples**: See [examples/](./examples/)
- **Issues**: [GitHub Issues](https://github.com/Smart-Pay-Chain/otp/issues)
- **Email**: support@smartpaychain.com

## API Key

Get your API key from the [Smart Pay Chain Dashboard](https://dashboard.smartpaychain.com).

## Phone Number Format

All phone numbers must be in [E.164 format](https://en.wikipedia.org/wiki/E.164):

✅ `+995555123456` - Correct  
✅ `+12025551234` - Correct  
❌ `555-123-4567` - Wrong  
❌ `0555123456` - Wrong  

## Support

Need help? We're here for you!

- 📧 Email: support@smartpaychain.com
- 🐛 Issues: https://github.com/Smart-Pay-Chain/otp/issues
- 📖 Docs: https://docs.smartpaychain.com

