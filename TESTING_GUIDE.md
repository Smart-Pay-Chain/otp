# Testing Guide

Complete guide for testing applications that use the @smartpaychain/otp-sdk.

## Table of Contents

- [Test Mode](#test-mode)
- [Test Phone Numbers](#test-phone-numbers)
- [Fixed OTP Codes](#fixed-otp-codes)
- [Getting OTP Codes for Testing](#getting-otp-codes-for-testing)
- [Automated Testing](#automated-testing)
- [Mocking in Unit Tests](#mocking-in-unit-tests)
- [Integration Testing](#integration-testing)
- [Testing Strategies](#testing-strategies)

## Test Mode

The OTP service supports a test mode that allows you to test OTP flows without sending real SMS messages.

### Enabling Test Mode

Test mode is enabled on the server side:

```bash
# Server .env file
TEST_MODE=true
```

### Checking Test Mode Status

```typescript
import { OtpClient } from '@smartpaychain/otp-sdk';

const client = new OtpClient({
  apiKey: process.env.OTP_API_KEY,
  autoConfig: true,
});

// Check if server is in test mode
const testMode = await client.isTestMode();
console.log('Test mode:', testMode);

// Or check from config
const config = await client.getConfig();
console.log('Test mode:', config.features.testMode);
```

## Test Phone Numbers

When test mode is enabled, use these special phone numbers:

```typescript
import { TEST_PHONE_NUMBERS } from '@smartpaychain/otp-sdk';

// Always succeeds
TEST_PHONE_NUMBERS.SUCCESS           // '+15005550006'

// Always fails with specific errors
TEST_PHONE_NUMBERS.SMS_FAIL          // '+15005550007' - SMS send error
TEST_PHONE_NUMBERS.RATE_LIMIT        // '+15005550008' - Rate limit exceeded
TEST_PHONE_NUMBERS.INSUFFICIENT_BALANCE // '+15005550009' - Insufficient balance
TEST_PHONE_NUMBERS.BRAND_NOT_AUTH    // '+15005550010' - Brand not authorized
```

### Usage Example

```typescript
// Test successful flow
const result = await client.sendOtp({
  phoneNumber: TEST_PHONE_NUMBERS.SUCCESS,
});
console.log('Success:', result.requestId);

// Test error handling
try {
  await client.sendOtp({
    phoneNumber: TEST_PHONE_NUMBERS.RATE_LIMIT,
  });
} catch (error) {
  console.log('Expected error:', error.code); // 'RATE_LIMIT_EXCEEDED'
}
```

## Fixed OTP Codes

In test mode, all OTPs use a fixed code:

```typescript
import { TEST_OTP_CODE } from '@smartpaychain/otp-sdk';

const result = await client.sendOtp({
  phoneNumber: TEST_PHONE_NUMBERS.SUCCESS,
});

// Verify with fixed code
const verification = await client.verifyOtp({
  requestId: result.requestId,
  code: TEST_OTP_CODE, // Always '123456' in test mode
});

console.log('Verified:', verification.success);
```

## Getting OTP Codes for Testing

For automated testing, you can retrieve the actual OTP code:

```typescript
// ⚠️ WARNING: Only use in test/development environments!
const result = await client.sendOtp({
  phoneNumber: '+995555123456',
});

// Get status with actual OTP code
const status = await client.getStatusWithCode(result.requestId);
console.log('OTP Code:', status.otpCode);
console.log('SMS Provider:', status.smsProvider);
console.log('Status:', status.status);

// Use in automated test
await client.verifyOtp({
  requestId: result.requestId,
  code: status.otpCode,
});
```

**Important**: `getStatusWithCode()` is a public endpoint that returns the actual OTP code. Never use this in production code!

## Automated Testing

### Example Test Suite

```typescript
import { OtpClient, TEST_PHONE_NUMBERS, TEST_OTP_CODE } from '@smartpaychain/otp-sdk';

describe('OTP Flow', () => {
  let client: OtpClient;

  beforeAll(() => {
    client = new OtpClient({
      apiKey: process.env.TEST_API_KEY,
    });
  });

  it('should send and verify OTP in test mode', async () => {
    // Send OTP
    const sendResult = await client.sendOtp({
      phoneNumber: TEST_PHONE_NUMBERS.SUCCESS,
    });

    expect(sendResult.requestId).toBeDefined();

    // Verify OTP with fixed test code
    const verifyResult = await client.verifyOtp({
      requestId: sendResult.requestId,
      code: TEST_OTP_CODE,
    });

    expect(verifyResult.success).toBe(true);
  });

  it('should handle rate limit error', async () => {
    await expect(
      client.sendOtp({
        phoneNumber: TEST_PHONE_NUMBERS.RATE_LIMIT,
      })
    ).rejects.toMatchObject({
      code: 'RATE_LIMIT_EXCEEDED',
      retryable: true,
    });
  });

  it('should get OTP code for automated verification', async () => {
    const sendResult = await client.sendOtp({
      phoneNumber: TEST_PHONE_NUMBERS.SUCCESS,
    });

    // Get actual code
    const status = await client.getStatusWithCode(sendResult.requestId);
    expect(status.otpCode).toBe(TEST_OTP_CODE);

    // Verify automatically
    const verifyResult = await client.verifyOtp({
      requestId: sendResult.requestId,
      code: status.otpCode,
    });

    expect(verifyResult.success).toBe(true);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## Mocking in Unit Tests

### Mocking the SDK

```typescript
import { OtpClient } from '@smartpaychain/otp-sdk';

jest.mock('@smartpaychain/otp-sdk');

const mockClient = {
  sendOtp: jest.fn().mockResolvedValue({
    requestId: 'mock-id',
    expiresAt: new Date(),
    status: 'PENDING',
  }),
  verifyOtp: jest.fn().mockResolvedValue({
    success: true,
    message: 'Verified',
  }),
};

(OtpClient as jest.Mock).mockImplementation(() => mockClient);
```

### Mocking Backend API Calls

```typescript
// For mobile apps testing the backend API
global.fetch = jest.fn((url: string) => {
  if (url.includes('/send-otp')) {
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        data: { requestId: 'req_123' },
      }),
    });
  }
  
  if (url.includes('/verify-otp')) {
    return Promise.resolve({
      json: () => Promise.resolve({
        success: true,
        data: { verified: true },
      }),
    });
  }
}) as jest.Mock;
```

## Integration Testing

### Testing Against Real Backend (in Test Mode)

```typescript
import { OtpClient, TEST_PHONE_NUMBERS, TEST_OTP_CODE } from '@smartpaychain/otp-sdk';

describe('OTP Integration Tests', () => {
  let client: OtpClient;

  beforeAll(async () => {
    client = new OtpClient({
      apiKey: process.env.TEST_API_KEY,
      baseUrl: process.env.TEST_API_URL || 'http://localhost:3000',
    });

    // Ensure test mode is enabled
    const testMode = await client.isTestMode();
    if (!testMode) {
      throw new Error('Backend must be in test mode for integration tests');
    }
  });

  it('should complete full OTP flow', async () => {
    // Send
    const sendResult = await client.sendOtp({
      phoneNumber: TEST_PHONE_NUMBERS.SUCCESS,
    });

    // Check status
    const status = await client.getStatus(sendResult.requestId);
    expect(status.status).toMatch(/PENDING|SENT/);

    // Verify
    const verifyResult = await client.verifyOtp({
      requestId: sendResult.requestId,
      code: TEST_OTP_CODE,
    });

    expect(verifyResult.success).toBe(true);

    // Check status again
    const finalStatus = await client.getStatus(sendResult.requestId);
    expect(finalStatus.status).toBe('VERIFIED');
  });

  it('should handle resend flow', async () => {
    const sendResult = await client.sendOtp({
      phoneNumber: TEST_PHONE_NUMBERS.SUCCESS,
    });

    const resendResult = await client.resendOtp({
      requestId: sendResult.requestId,
    });

    expect(resendResult.requestId).toBeDefined();
    expect(resendResult.expiresAt).toBeInstanceOf(Date);
  });
});
```

## Testing Strategies

### 1. Unit Testing (Mocked SDK)

**When**: Testing your business logic  
**How**: Mock the OTP SDK completely

```typescript
// Your service
class UserService {
  constructor(private otpClient: OtpClient) {}
  
  async registerUser(phoneNumber: string) {
    const result = await this.otpClient.sendOtp({ phoneNumber });
    return result.requestId;
  }
}

// Test
const mockOtpClient = {
  sendOtp: jest.fn().mockResolvedValue({ requestId: 'mock-id' }),
};

const service = new UserService(mockOtpClient as any);
const requestId = await service.registerUser('+995555123456');
expect(requestId).toBe('mock-id');
```

### 2. Integration Testing (Real SDK + Test Mode)

**When**: Testing end-to-end flows  
**How**: Use real SDK with test mode enabled on server

```typescript
// Use real SDK with test mode
const client = new OtpClient({
  apiKey: process.env.TEST_API_KEY,
  baseUrl: 'http://localhost:3000',
});

const result = await client.sendOtp({
  phoneNumber: TEST_PHONE_NUMBERS.SUCCESS,
});

const verification = await client.verifyOtp({
  requestId: result.requestId,
  code: TEST_OTP_CODE,
});
```

### 3. E2E Testing (Real Phone Numbers - Staging Only)

**When**: Final pre-production validation  
**How**: Use real phone numbers in staging environment

```typescript
// Staging environment with real SMS
const client = new OtpClient({
  apiKey: process.env.STAGING_API_KEY,
  baseUrl: 'https://staging.otp.smartpaychain.com',
});

// Use real phone number
const result = await client.sendOtp({
  phoneNumber: '+995555123456', // Your test phone
});

// Get code via getStatusWithCode() or manually
const status = await client.getStatusWithCode(result.requestId);
console.log('Check your phone for code:', status.otpCode);
```

## Best Practices

1. **Use Test Mode for Development**
   - Enable test mode on development servers
   - Use test phone numbers
   - Use fixed OTP code (123456)

2. **Never Use Test Phone Numbers in Production**
   - Validate that phone numbers aren't test numbers in production
   - Disable test mode in production

3. **Mock in Unit Tests**
   - Mock the SDK for fast unit tests
   - Test your business logic in isolation

4. **Integration Tests with Test Mode**
   - Use real SDK with test mode for integration tests
   - Test all error scenarios

5. **Careful with getStatusWithCode()**
   - Only use in test/development environments
   - Never expose this endpoint to end users
   - Add environment checks

6. **Test Error Scenarios**
   - Test all error codes
   - Verify error handling logic
   - Test retry logic

## Environment Variables

```bash
# Testing .env
TEST_API_KEY=your-test-api-key
TEST_API_URL=http://localhost:3000
NODE_ENV=test

# CI/CD .env
OTP_API_KEY=your-ci-api-key
OTP_API_URL=https://test.otp.smartpaychain.com
```

## CI/CD Testing

### GitHub Actions Example

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm test
        env:
          OTP_API_KEY: ${{ secrets.TEST_API_KEY }}
          OTP_API_URL: https://test.otp.smartpaychain.com
```

## Common Testing Patterns

### Pattern 1: Test All Error Scenarios

```typescript
const errorTests = [
  { phone: TEST_PHONE_NUMBERS.SMS_FAIL, expectedError: 'SMS_SEND_FAILED' },
  { phone: TEST_PHONE_NUMBERS.RATE_LIMIT, expectedError: 'RATE_LIMIT_EXCEEDED' },
  { phone: TEST_PHONE_NUMBERS.INSUFFICIENT_BALANCE, expectedError: 'INSUFFICIENT_BALANCE' },
];

for (const test of errorTests) {
  await expect(
    client.sendOtp({ phoneNumber: test.phone })
  ).rejects.toMatchObject({
    code: test.expectedError,
  });
}
```

### Pattern 2: Test Retry Logic

```typescript
let attempts = 0;
const mockSend = jest.fn().mockImplementation(() => {
  attempts++;
  if (attempts < 3) {
    throw new RateLimitError('Rate limit exceeded');
  }
  return { requestId: 'success' };
});

// Should retry twice and succeed on third attempt
const result = await mockSend();
expect(attempts).toBe(3);
```

### Pattern 3: Test Idempotency

```typescript
const idempotencyKey = 'unique-key-123';

const result1 = await client.sendOtp({
  phoneNumber: '+995555123456',
  idempotencyKey,
});

// Same idempotency key should return cached result
const result2 = await client.sendOtp({
  phoneNumber: '+995555123456',
  idempotencyKey,
});

expect(result1.requestId).toBe(result2.requestId);
```

## Troubleshooting

### Tests Failing with "Test mode not enabled"

**Solution**: Ensure server has `TEST_MODE=true` in environment variables.

### Can't Get OTP Code

**Solution**: Use `getStatusWithCode()` which waits up to 30 seconds for SMS delivery:

```typescript
const status = await client.getStatusWithCode(requestId);
console.log('OTP Code:', status.otpCode);
```

### Test Phone Numbers Not Working

**Solution**: Test phone numbers only work when server is in test mode. Check:

```typescript
const testMode = await client.isTestMode();
if (!testMode) {
  console.error('Server is not in test mode!');
}
```

### Rate Limiting in Tests

**Solution**: Use unique idempotency keys or different phone numbers for each test:

```typescript
const result = await client.sendOtp({
  phoneNumber: `+99555512345${Math.floor(Math.random() * 10)}`,
  idempotencyKey: `test-${Date.now()}`,
});
```

## Example: Complete Test Suite

See [examples/test-mode-example.ts](./examples/test-mode-example.ts) for a complete testing example with:
- Automated test patterns
- Error scenario testing
- Integration test examples
- Best practices

## Resources

- [Test Mode Example](./examples/test-mode-example.ts) - Complete test mode usage
- [Mobile Apps Guide](./examples/MOBILE_APPS.md) - Mobile testing strategies
- [API Reference](./API_REFERENCE.md) - All endpoints and types
- [Contributing Guide](./CONTRIBUTING.md) - Development testing

## Support

For testing issues:
- Check if test mode is enabled on server
- Verify API key is correct
- Review server logs for errors
- Open an issue on GitHub

