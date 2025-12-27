# API Reference

Complete API reference for @smart-pay-chain/otp v2.0

## Table of Contents

- [OtpClient](#otpclient)
- [Methods](#methods)
- [Types](#types)
- [Error Classes](#error-classes)
- [Constants](#constants)

## OtpClient

Main client class for OTP operations.

### Constructor

```typescript
new OtpClient(config: OtpClientConfig)
```

**Parameters:**

```typescript
interface OtpClientConfig {
  apiKey: string;              // Required: Your API key
  baseUrl?: string;            // Optional: Custom base URL
  timeout?: number;            // Optional: Request timeout in ms (default: 30000)
  maxRetries?: number;         // Optional: Max retry attempts (default: 3)
  autoConfig?: boolean;        // Optional: Auto-fetch server config (default: false)
  platform?: SdkPlatform;      // Optional: 'node' | 'browser' | 'react-native'
  language?: SdkLanguage;      // Optional: 'typescript' | 'javascript'
  headers?: Record<string, string>; // Optional: Custom headers
}
```

**Example:**

```typescript
const client = new OtpClient({
  apiKey: 'your-api-key',
  autoConfig: true,
  platform: 'react-native',
});
```

## Methods

### sendOtp()

Send an OTP to a phone number.

```typescript
async sendOtp(options: SendOtpOptions): Promise<SendOtpResponse>
```

**Parameters:**

```typescript
interface SendOtpOptions {
  phoneNumber: string;         // Required: E.164 format
  channel?: OtpChannel;        // Optional: 'SMS' | 'WHATSAPP' | 'VOICE'
  ttl?: number;                // Optional: 60-600 seconds (default: 300)
  length?: number;             // Optional: 4-8 digits (default: 6)
  metadata?: Record<string, any>; // Optional: Custom metadata
  idempotencyKey?: string;     // Optional: Auto-generated if not provided
}
```

**Returns:**

```typescript
interface SendOtpResponse {
  requestId: string;           // Unique request ID
  expiresAt: Date;             // Expiration timestamp
  status: string;              // 'PENDING' | 'SENT' | etc.
}
```

**Example:**

```typescript
const result = await client.sendOtp({
  phoneNumber: '+995555123456',
  channel: OtpChannel.SMS,
  ttl: 300,
  metadata: { userId: '12345' },
});
```

---

### verifyOtp()

Verify an OTP code.

```typescript
async verifyOtp(options: VerifyOtpOptions): Promise<VerifyOtpResponse>
```

**Parameters:**

```typescript
interface VerifyOtpOptions {
  requestId: string;           // Required: From sendOtp()
  code: string;                // Required: 4-8 digit code
  ipAddress?: string;          // Optional: User's IP
  userAgent?: string;          // Optional: User's user agent
}
```

**Returns:**

```typescript
interface VerifyOtpResponse {
  success: boolean;            // Whether verification succeeded
  message: string;             // Result message
}
```

**Example:**

```typescript
const result = await client.verifyOtp({
  requestId: 'req_123456',
  code: '123456',
  ipAddress: '192.168.1.1',
});

if (result.success) {
  console.log('Verified!');
}
```

---

### resendOtp()

Resend an OTP with a new code.

```typescript
async resendOtp(options: ResendOtpOptions): Promise<SendOtpResponse>
```

**Parameters:**

```typescript
interface ResendOtpOptions {
  requestId: string;           // Required: Original request ID
}
```

**Returns:** Same as `sendOtp()`

**Example:**

```typescript
const result = await client.resendOtp({
  requestId: 'req_123456',
});
```

---

### getStatus()

Get OTP status (authenticated endpoint).

```typescript
async getStatus(requestId: string): Promise<OtpStatus>
```

**Parameters:**
- `requestId` (string): Request ID from sendOtp()

**Returns:**

```typescript
interface OtpStatus {
  id: string;
  phoneNumber: string;         // Masked: '+9955***56'
  channel: OtpChannel;
  status: 'PENDING' | 'SENT' | 'VERIFIED' | 'EXPIRED' | 'FAILED';
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  verifiedAt: Date | null;
  createdAt: Date;
  isExpired: boolean;
}
```

**Example:**

```typescript
const status = await client.getStatus('req_123456');
console.log('Status:', status.status);
console.log('Attempts:', status.attempts);
console.log('Expired:', status.isExpired);
```

---

### getStatusWithCode()

Get OTP status with actual code (public endpoint, for testing only).

```typescript
async getStatusWithCode(requestId: string): Promise<OtpStatusWithCode>
```

**⚠️ WARNING**: Returns actual OTP code. Only use in test/development!

**Parameters:**
- `requestId` (string): Request ID from sendOtp()

**Returns:** Same as `getStatus()` plus:

```typescript
interface OtpStatusWithCode extends OtpStatus {
  otpCode: string;             // Actual OTP code
  smsProvider: string | null;  // Provider used
  smsMessageId: string | null; // Provider message ID
}
```

**Example:**

```typescript
// For automated testing only!
const status = await client.getStatusWithCode('req_123456');
console.log('OTP Code:', status.otpCode);

// Use in automated test
await client.verifyOtp({
  requestId: 'req_123456',
  code: status.otpCode,
});
```

---

### getConfig()

Get SDK configuration from server (cached for 1 hour).

```typescript
async getConfig(forceRefresh?: boolean): Promise<SdkConfiguration>
```

**Parameters:**
- `forceRefresh` (boolean, optional): Force refresh cached config

**Returns:**

```typescript
interface SdkConfiguration {
  version: string;
  otpConfig: {
    length: number;
    ttl: number;
    maxAttempts: number;
  };
  rateLimits: { /* ... */ };
  supportedCountries: string[];
  pricing: { /* ... */ };
  features: {
    georgianLanguage: boolean;
    customBranding: boolean;
    webhooks: boolean;
    idempotency: boolean;
    testMode: boolean;
    longPolling: boolean;
    batchOperations: boolean;
  };
  endpoints: {
    base: string;
    docs: string;
    status: string;
  };
  testMode?: {
    enabled: boolean;
    testPhoneNumbers: string[];
    fixedOtpCode: string;
  };
}
```

**Example:**

```typescript
const config = await client.getConfig();
console.log('Test mode:', config.features.testMode);
console.log('Rate limits:', config.rateLimits);

// Force refresh
const freshConfig = await client.getConfig(true);
```

---

### testConnection()

Test connectivity to the OTP service.

```typescript
async testConnection(): Promise<boolean>
```

**Returns:** `true` if connected, `false` otherwise

**Example:**

```typescript
const connected = await client.testConnection();
if (connected) {
  console.log('✓ Connected to OTP service');
} else {
  console.error('✗ Cannot connect to OTP service');
}
```

---

### isTestMode()

Check if server is in test mode.

```typescript
async isTestMode(): Promise<boolean>
```

**Returns:** `true` if test mode is enabled, `false` otherwise

**Example:**

```typescript
const testMode = await client.isTestMode();
if (testMode) {
  console.log('Use test phone numbers for testing');
}
```

---

## Types

### OtpChannel

```typescript
enum OtpChannel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  VOICE = 'VOICE',
}
```

### ErrorCode

All possible error codes:

```typescript
enum ErrorCode {
  // Authentication & Authorization
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  API_KEY_REVOKED = 'API_KEY_REVOKED',

  // Phone Number
  INVALID_PHONE_NUMBER = 'INVALID_PHONE_NUMBER',
  PHONE_NUMBER_BLOCKED = 'PHONE_NUMBER_BLOCKED',

  // OTP
  OTP_EXPIRED = 'OTP_EXPIRED',
  OTP_MAX_ATTEMPTS = 'OTP_MAX_ATTEMPTS',
  INVALID_OTP_CODE = 'INVALID_OTP_CODE',
  OTP_NOT_FOUND = 'OTP_NOT_FOUND',
  OTP_ALREADY_VERIFIED = 'OTP_ALREADY_VERIFIED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Billing
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',

  // Brand (Georgian SMS)
  NO_BRAND_CONFIGURED = 'NO_BRAND_CONFIGURED',
  BRAND_NOT_AUTHORIZED = 'BRAND_NOT_AUTHORIZED',
  BRAND_PENDING_APPROVAL = 'BRAND_PENDING_APPROVAL',
  BRAND_CREATION_FAILED = 'BRAND_CREATION_FAILED',

  // SMS Provider
  SMS_SEND_FAILED = 'SMS_SEND_FAILED',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Server
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Idempotency
  IDEMPOTENCY_KEY_CONFLICT = 'IDEMPOTENCY_KEY_CONFLICT',
}
```

## Error Classes

All error classes extend `OtpError`:

### OtpError

Base error class with common properties:

```typescript
class OtpError extends Error {
  code: ErrorCode;
  statusCode: number;
  retryable: boolean;
  details?: Record<string, any>;
  requestId?: string;
}
```

### Specific Error Classes

- `AuthenticationError` - Authentication failed
- `ValidationError` - Input validation error
- `RateLimitError` - Rate limit exceeded (retryable)
- `OtpNotFoundError` - OTP request not found
- `OtpExpiredError` - OTP has expired
- `InvalidOtpError` - Invalid OTP code
- `ServiceUnavailableError` - Service unavailable (retryable)
- `InsufficientBalanceError` - Insufficient account balance
- `BrandNotConfiguredError` - Brand not configured (Georgian numbers)
- `BrandPendingApprovalError` - Brand pending approval
- `IdempotencyConflictError` - Idempotency key conflict
- `ApiKeyRevokedError` - API key has been revoked

## Constants

### TEST_PHONE_NUMBERS

```typescript
const TEST_PHONE_NUMBERS = {
  SUCCESS: '+15005550006',
  SMS_FAIL: '+15005550007',
  RATE_LIMIT: '+15005550008',
  INSUFFICIENT_BALANCE: '+15005550009',
  BRAND_NOT_AUTH: '+15005550010',
} as const;
```

### TEST_OTP_CODE

```typescript
const TEST_OTP_CODE = '123456';
```

Fixed OTP code used in test mode.

---

For more details, see:
- [Main README](./README.md)
- [Quick Start Guide](./QUICKSTART.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Examples](./examples/)

