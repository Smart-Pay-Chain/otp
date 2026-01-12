# @smart-pay-chain/otp

<div align="center">

[![npm version](https://img.shields.io/npm/v/@smart-pay-chain/otp.svg?style=flat-square)](https://www.npmjs.com/package/@smart-pay-chain/otp)
[![npm downloads](https://img.shields.io/npm/dm/@smart-pay-chain/otp.svg?style=flat-square)](https://www.npmjs.com/package/@smart-pay-chain/otp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg?style=flat-square)](https://nodejs.org/)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg?style=flat-square)](https://github.com/Smart-Pay-Chain/otp)
[![Coverage](https://img.shields.io/badge/coverage-90%25-brightgreen.svg?style=flat-square)](https://github.com/Smart-Pay-Chain/otp)

**Official TypeScript/JavaScript SDK for Smart Pay Chain OTP Verification Service**

[Website](https://smartpaychain.com) • [Documentation](https://docs.smartpaychain.com) • [NPM Package](https://www.npmjs.com/package/@smart-pay-chain/otp) • [GitHub](https://github.com/Smart-Pay-Chain/otp)

</div>

---

Send and verify one-time passwords via SMS, WhatsApp, and Voice with ease.

## What's New in v2.1

🆕 **Phone Authentication** - Complete passwordless auth with JWT tokens  
🆕 **Admin Role Support** - RBAC with USER/ADMIN roles  
🆕 **Brand Management** - Two-stage brand approval workflow  
🆕 **API Key Handling** - Secure key generation and one-time secret reveal  
🆕 **Backend Integration** - Full guide for sms-service integration  

## What's New in v2.0

🆕 **Test Mode** - Development-friendly testing with fixed OTP codes and test phone numbers  
🆕 **Status Endpoints** - Check OTP status and get codes for testing  
🆕 **Auto-Configuration** - SDK auto-configures from server settings  
🆕 **Mobile Examples** - Complete React Native integration example  
🆕 **Idempotency** - Automatic idempotency keys for retry safety  
🆕 **Enhanced Errors** - Machine-readable error codes for better handling  

[See Migration Guide](#migration-from-v1-to-v2)

## Features

✨ **Multiple Channels** - Send OTPs via SMS, WhatsApp, or Voice  
🔒 **Secure** - Built-in encryption, timing-safe comparisons, and rate limiting  
🎯 **Type-Safe** - Full TypeScript support with comprehensive type definitions  
🔄 **Retry Logic** - Automatic retries for transient failures  
📱 **Mobile Ready** - React Native example and mobile integration guide  
🔐 **Phone Authentication** - Complete passwordless auth with JWT tokens  
👥 **Admin Support** - Role-based access control (RBAC)  
🏢 **Brand Management** - Two-stage approval workflow  
🧪 **Test Mode** - Development testing with fixed codes  
📦 **Lightweight** - Minimal dependencies  
🧪 **Well-Tested** - Comprehensive test coverage  
📚 **Well-Documented** - Extensive documentation and examples  

## Installation

```bash
npm install @smart-pay-chain/otp
```

or

```bash
yarn add @smart-pay-chain/otp
```

## Quick Start

```typescript
import { OtpClient, OtpChannel } from '@smart-pay-chain/otp';

// Initialize the client
const client = new OtpClient({
  apiKey: 'your-api-key-here',
  autoConfig: true, // v2.0: Auto-fetch server configuration
});

// Send an OTP
const result = await client.sendOtp({
  phoneNumber: '+995568000865',
  channel: OtpChannel.SMS,
});

console.log('OTP sent! Request ID:', result.requestId);

// v2.0: Check status
const status = await client.getStatus(result.requestId);
console.log('Current status:', status.status);

// Verify the OTP
const verification = await client.verifyOtp({
  requestId: result.requestId,
  code: '123456', // Code entered by user
});

if (verification.success) {
  console.log('Phone number verified! ✓');
}
```

## Table of Contents

- [What's New in v2.0](#whats-new-in-v20)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Test Mode](#test-mode)
- [Configuration](#configuration)
- [Usage](#usage)
  - [Sending OTP](#sending-otp)
  - [Verifying OTP](#verifying-otp)
  - [Resending OTP](#resending-otp)
  - [Checking Status](#checking-status)
  - [SDK Configuration](#sdk-configuration)
- [Mobile App Integration](#mobile-app-integration)
- [Error Handling](#error-handling)
- [Idempotency](#idempotency)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Migration from v1 to v2](#migration-from-v1-to-v2)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Test Mode

Test mode allows you to test OTP flows without sending real SMS messages. Perfect for development and automated testing!

```typescript
// Check if server is in test mode
const testMode = await client.isTestMode();
if (testMode) {
  console.log('Test mode enabled - use test phone numbers');
}

// Use test phone numbers
import { TEST_PHONE_NUMBERS, TEST_OTP_CODE } from '@smart-pay-chain/otp';

const result = await client.sendOtp({
  phoneNumber: TEST_PHONE_NUMBERS.SUCCESS, // +15005550006
});

// In test mode, OTP code is always: 123456
const verification = await client.verifyOtp({
  requestId: result.requestId,
  code: TEST_OTP_CODE, // '123456'
});
```

**Test Phone Numbers:**
- `+15005550006` - Always succeeds
- `+15005550007` - SMS send fails
- `+15005550008` - Rate limit exceeded
- `+15005550009` - Insufficient balance
- `+15005550010` - Brand not authorized

**For Development/Testing Only:**
```typescript
// Get actual OTP code (WARNING: Never use in production!)
const status = await client.getStatusWithCode(result.requestId);
console.log('OTP Code:', status.otpCode); // For automated tests
```

## Configuration

### Client Options

```typescript
const client = new OtpClient({
  apiKey: 'your-api-key-here',        // Required: Your API key
  baseUrl: 'https://custom.api.com',  // Optional: Custom base URL
  timeout: 30000,                      // Optional: Request timeout (ms)
  maxRetries: 3,                       // Optional: Max retry attempts
  autoConfig: true,                    // Optional: Auto-fetch server config
  platform: 'react-native',            // Optional: SDK platform
  language: 'typescript',              // Optional: SDK language
  headers: {                           // Optional: Custom headers
    'X-App-Version': '1.0.0',
  },
});
```

## Usage

### Sending OTP

Send an OTP to a phone number using your preferred channel:

```typescript
const result = await client.sendOtp({
  phoneNumber: '+995568000865',    // Required: E.164 format
  channel: OtpChannel.SMS,          // Optional: SMS, WHATSAPP, or VOICE
  ttl: 300,                         // Optional: Time-to-live (60-600 seconds)
  length: 6,                        // Optional: Code length (4-8 digits)
  metadata: {                       // Optional: Custom metadata
    userId: 'user_12345',
    action: 'login',
  },
  idempotencyKey: 'unique-key',    // Optional: Prevent duplicate sends
});

console.log(result.requestId);     // Save this for verification
console.log(result.expiresAt);     // When the OTP expires
console.log(result.status);        // Current status
```

### Verifying OTP

Verify the OTP code entered by the user:

```typescript
const result = await client.verifyOtp({
  requestId: 'req_123456',         // From sendOtp response
  code: '123456',                   // User-entered code
  ipAddress: '192.168.1.1',        // Optional but recommended
  userAgent: 'Mozilla/5.0...',     // Optional
});

if (result.success) {
  console.log('Verified!', result.message);
  // Proceed with authentication
} else {
  console.log('Failed:', result.message);
  // Show error to user
}
```

### Resending OTP

Resend the OTP if the user didn't receive it:

```typescript
const result = await client.resendOtp({
  requestId: 'req_123456',
});

console.log('New request ID:', result.requestId);
console.log('Expires at:', result.expiresAt);
```

### Checking Status

Check the current status of an OTP request:

```typescript
const status = await client.getStatus('req_123456');

console.log('Status:', status.status); // 'PENDING' | 'SENT' | 'VERIFIED' | 'EXPIRED' | 'FAILED'
console.log('Attempts:', status.attempts);
console.log('Max attempts:', status.maxAttempts);
console.log('Is expired:', status.isExpired);
console.log('Expires at:', status.expiresAt);
```

### SDK Configuration

Get server configuration (auto-cached for 1 hour):

```typescript
const config = await client.getConfig();

console.log('OTP config:', config.otpConfig);
console.log('Rate limits:', config.rateLimits);
console.log('Test mode:', config.features.testMode);
console.log('Supported countries:', config.supportedCountries);
```

## Mobile App Integration

The SDK is designed to run on your backend server, not directly in mobile apps. This keeps your API keys secure.

See our comprehensive [Mobile Apps Guide](./examples/MOBILE_APPS.md) for:
- React Native integration ([complete example](./examples/react-native-example.tsx))
- Flutter/Dart integration
- iOS native (Swift)
- Android native (Kotlin)
- Passwordless authentication with refresh tokens
- Security best practices

**Quick Example:**

```typescript
// Backend API
router.post('/auth/send-otp', async (req, res) => {
  const result = await otpClient.sendOtp({
    phoneNumber: req.body.phoneNumber,
  });
  res.json({ requestId: result.requestId });
});

// Mobile app calls your backend
fetch('https://yourapi.com/auth/send-otp', {
  method: 'POST',
  body: JSON.stringify({ phoneNumber: '+995568000865' }),
});
```

## Error Handling

The SDK provides specific error classes for different scenarios:

```typescript
import {
  OtpError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  OtpExpiredError,
  InvalidOtpError,
} from '@smart-pay-chain/otp';

try {
  const result = await client.verifyOtp({ ... });
} catch (error) {
  if (error instanceof InvalidOtpError) {
    console.log('Wrong code. Please try again.');
  } else if (error instanceof OtpExpiredError) {
    console.log('OTP expired. Request a new one.');
  } else if (error instanceof RateLimitError) {
    console.log('Too many attempts. Please wait.');
  } else if (error instanceof OtpError) {
    // Generic OTP error
    console.log('Error:', error.message);
    console.log('Code:', error.code);
    console.log('Retryable:', error.retryable);
  }
}
```

### Error Properties

All OTP errors include:

- `message`: Human-readable error message
- `code`: Error code (e.g., `OTP_EXPIRED`, `INVALID_OTP_CODE`)
- `statusCode`: HTTP status code
- `retryable`: Whether the request can be retried
- `details`: Additional error details (optional)
- `requestId`: Request ID for debugging (optional)

## Idempotency

The SDK automatically generates unique idempotency keys for send/resend operations to prevent duplicate requests:

```typescript
// Automatic idempotency (recommended)
const result = await client.sendOtp({
  phoneNumber: '+995568000865',
  // SDK auto-generates: X-Idempotency-Key: {timestamp}-{random}
});

// Manual idempotency key (for custom requirements)
const result = await client.sendOtp({
  phoneNumber: '+995568000865',
  idempotencyKey: 'my-unique-key-123',
});
```

**Benefits:**
- Prevents duplicate OTPs on network retries
- Safe for flaky mobile networks
- Automatic for all send/resend operations

## API Reference

### OtpClient

#### `constructor(config: OtpClientConfig)`

Create a new OTP client instance.

#### `sendOtp(options: SendOtpOptions): Promise<SendOtpResponse>`

Send an OTP to a phone number.

**Parameters:**
- `phoneNumber` (string, required): Phone number in E.164 format
- `channel` (OtpChannel, optional): Delivery channel (default: SMS)
- `ttl` (number, optional): Time-to-live in seconds (60-600, default: 300)
- `length` (number, optional): OTP code length (4-8, default: 6)
- `metadata` (object, optional): Custom metadata
- `idempotencyKey` (string, optional): Idempotency key

**Returns:**
- `requestId` (string): Unique request identifier
- `expiresAt` (Date): Expiration timestamp
- `status` (string): Current status

#### `verifyOtp(options: VerifyOtpOptions): Promise<VerifyOtpResponse>`

Verify an OTP code.

**Parameters:**
- `requestId` (string, required): Request ID from sendOtp
- `code` (string, required): OTP code to verify
- `ipAddress` (string, optional): User's IP address
- `userAgent` (string, optional): User's user agent

**Returns:**
- `success` (boolean): Whether verification succeeded
- `message` (string): Result message

#### `resendOtp(options: ResendOtpOptions): Promise<SendOtpResponse>`

Resend an OTP.

**Parameters:**
- `requestId` (string, required): Original request ID

**Returns:**
Same as `sendOtp()`

#### `getStatus(requestId: string): Promise<OtpStatus>`

Get OTP status (authenticated endpoint).

**Parameters:**
- `requestId` (string, required): Request ID

**Returns:**
- `id` (string): Request ID
- `phoneNumber` (string): Phone number (masked)
- `channel` (OtpChannel): Delivery channel
- `status` (string): Current status
- `attempts` (number): Verification attempts
- `maxAttempts` (number): Maximum attempts allowed
- `expiresAt` (Date): Expiration time
- `verifiedAt` (Date | null): Verification time
- `createdAt` (Date): Creation time
- `isExpired` (boolean): Whether OTP is expired

#### `getStatusWithCode(requestId: string): Promise<OtpStatusWithCode>`

Get OTP status with code (public endpoint, for testing/development only).

**WARNING**: This returns the actual OTP code. Only use in test/development!

**Returns:** Same as `getStatus()` plus:
- `otpCode` (string): The actual OTP code
- `smsProvider` (string | null): SMS provider used
- `smsMessageId` (string | null): Provider message ID

#### `getConfig(forceRefresh?: boolean): Promise<SdkConfiguration>`

Get SDK configuration from server (cached for 1 hour).

**Parameters:**
- `forceRefresh` (boolean, optional): Force refresh cached config

**Returns:** Server configuration including rate limits, features, test mode status, etc.

#### `testConnection(): Promise<boolean>`

Test connectivity to the OTP service.

**Returns:** `true` if connected, `false` otherwise

#### `isTestMode(): Promise<boolean>`

Check if server is in test mode.

**Returns:** `true` if test mode is enabled

### Types

#### `OtpChannel`

```typescript
enum OtpChannel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  VOICE = 'VOICE',
}
```

#### `ErrorCode`

```typescript
enum ErrorCode {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  INVALID_PHONE_NUMBER = 'INVALID_PHONE_NUMBER',
  OTP_EXPIRED = 'OTP_EXPIRED',
  OTP_MAX_ATTEMPTS = 'OTP_MAX_ATTEMPTS',
  INVALID_OTP_CODE = 'INVALID_OTP_CODE',
  OTP_NOT_FOUND = 'OTP_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  // ... and more
}
```

See [types.ts](./src/types.ts) for complete type definitions.

## Examples

The SDK includes comprehensive examples:

- **[Basic Usage](./examples/basic-usage.ts)** - Simple send and verify flow
- **[Advanced Usage](./examples/advanced-usage.ts)** - Error handling, metadata, retries
- **[Test Mode](./examples/test-mode-example.ts)** 🆕 - Testing with fixed OTP codes
- **[Express Integration](./examples/express-integration.ts)** - Backend API with Express.js
- **[Phone Authentication](./examples/phone-authentication.ts)** 🆕 - Complete passwordless auth with JWT
- **[React Integration](./examples/react-example.tsx)** - Frontend form with React
- **[React Native](./examples/react-native-example.tsx)** 🆕 - Mobile app integration
- **[Mobile Apps Guide](./examples/MOBILE_APPS.md)** 🆕 - Flutter, iOS, Android examples
- **[Backend Integration Guide](./BACKEND_INTEGRATION_GUIDE.md)** 🆕 - Full sms-service integration

See the [examples directory](./examples/) for more details.

## Migration from v1 to v2

All v1.0 code continues to work in v2.0! No breaking changes.

**New Features in v2.0:**

```typescript
// v2.0 additions (optional)
const client = new OtpClient({
  apiKey: 'your-key',
  autoConfig: true,  // NEW: Auto-fetch server config
});

// NEW: Check OTP status
const status = await client.getStatus(requestId);

// NEW: Get OTP code for testing
const testStatus = await client.getStatusWithCode(requestId);

// NEW: Check test mode
const testMode = await client.isTestMode();

// NEW: Test connectivity
const connected = await client.testConnection();
```

**Automatic Improvements:**
- Idempotency keys auto-generated for all send/resend operations
- SDK version tracking headers automatically included
- Enhanced error codes for better error handling

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm test -- --coverage
```

## Best Practices

1. **Security**
   - Never expose your API key in frontend code
   - Use backend endpoints to proxy OTP requests
   - Implement rate limiting on your endpoints
   - Use HTTPS for all requests

2. **User Experience**
   - Show clear error messages to users
   - Display OTP expiration time
   - Implement resend functionality
   - Limit verification attempts (3-5 max)

3. **Production**
   - Use environment variables for API keys
   - Implement proper logging and monitoring
   - Handle all error cases gracefully
   - Use idempotency keys for critical flows

## Requirements

- Node.js >= 16.0.0
- TypeScript >= 5.0.0 (if using TypeScript)

## Support

Need help? We're here for you!

- 🌐 **Website**: [smartpaychain.com](https://smartpaychain.com)
- 📚 **Documentation**: [docs.smartpaychain.com](https://docs.smartpaychain.com)
- 🐛 **Issues**: [GitHub Issues](https://github.com/Smart-Pay-Chain/otp/issues)
- 📧 **Email**: [support@smartpaychain.com](mailto:support@smartpaychain.com)
- 💬 **Community**: [Join our Discord](https://smartpaychain.com/discord)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

MIT License - see the [LICENSE](./LICENSE) file for details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

---

<div align="center">

### 🏢 About Smart Pay Chain

**Smart Pay Chain** is a leading provider of blockchain-based payment solutions and verification services.

🌐 [smartpaychain.com](https://smartpaychain.com) | 📧 [contact@smartpaychain.com](mailto:contact@smartpaychain.com)

**Products & Services**
- 🔐 OTP Verification Service (SMS, WhatsApp, Voice)
- 💳 Payment Processing Solutions
- ⛓️ Blockchain Integration Services
- 🔒 Secure Authentication Systems

---

Made with ❤️ by Smart Pay Chain

[![Follow us on Twitter](https://img.shields.io/twitter/follow/smartpaychain?style=social)](https://twitter.com/smartpaychain)
[![Star on GitHub](https://img.shields.io/github/stars/Smart-Pay-Chain/otp?style=social)](https://github.com/Smart-Pay-Chain/otp)

© 2025 Smart Pay Chain. All rights reserved.

</div>

