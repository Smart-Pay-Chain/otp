# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.2] - 2026-01-13

### Fixed
- Improved test mode console warning to handle undefined test phone numbers gracefully
- No longer displays "undefined" when test phone numbers are not available
- **Fixed default baseURL to remove incorrect `:3000` port** (Railway doesn't use explicit ports)

### Changed
- Updated all examples to use actual test phone number `+995568000865`
- Enhanced HTTP client test coverage from 64% to 86%
- **Default backend URL**: `https://otp-service-production-ge.up.railway.app`
- **Phone authentication example** now defaults to Railway production
- Updated all documentation and tests to use correct Railway URL

### Added
- **New example**: `test-railway-backend.ts` - Automated Railway backend testing script
- Better documentation of production vs local URLs in integration guide

---

## [2.1.1] - 2026-01-13

### Added
- Enhanced HTTP client tests for retry logic and error handling
- Tests for retryable vs non-retryable errors
- Tests for response interceptor functionality

### Improved
- HTTP client test coverage: 64.44% → 86.66%
- Better error handling test scenarios

---

## [2.1.0] - 2026-01-13

### Added
- **Phone Authentication Integration**: Complete example for passwordless authentication with JWT tokens
- **Backend Integration Guide**: Comprehensive guide for integrating with sms-service backend
  - Phone registration and login flows
  - JWT token management (access + refresh tokens)
  - API key handling and security
  - Admin role documentation
  - Brand management workflow
  - Response structure documentation
- **New Example**: `phone-authentication.ts` - Complete Express.js backend with:
  - Registration endpoint with OTP
  - Login endpoint with OTP
  - OTP verification with JWT generation
  - Token refresh endpoint
  - Protected route example
  - API key secret handling for new accounts
- **Documentation Updates**:
  - Updated `examples/README.md` with phone authentication example
  - Added `BACKEND_INTEGRATION_GUIDE.md` with complete backend integration
  - Updated main `README.md` with new features and examples

### Changed
- Updated README to reflect new v2.1 features
- Enhanced examples documentation with phone authentication section

### Security
- **API Key Handling**: Documented one-time secret reveal for new accounts
- **Token Security**: Best practices for JWT token storage (httpOnly cookies)
- **Admin RBAC**: Role-based access control documentation

### Documentation
- Complete backend API endpoint reference
- Response structure types and examples
- Security best practices for production
- Admin role capabilities and configuration
- Brand approval workflow documentation
- Cypress test mode configuration

---

## [2.0.0] - 2025-12-28

### Added
- **Test Mode Support**: Auto-detection of server test mode with fixed OTP codes
- **New Methods**:
  - `getStatus(requestId)` - Get OTP status (authenticated)
  - `getStatusWithCode(requestId)` - Get OTP status with code for testing
  - `getConfig(forceRefresh)` - Get SDK configuration from server
  - `testConnection()` - Test connectivity to OTP service
  - `isTestMode()` - Check if server is in test mode
- **Test Phone Numbers**: Constants for testing different error scenarios
  - `TEST_PHONE_NUMBERS.SUCCESS` - Always succeeds
  - `TEST_PHONE_NUMBERS.SMS_FAIL` - SMS send error
  - `TEST_PHONE_NUMBERS.RATE_LIMIT` - Rate limit error
  - `TEST_PHONE_NUMBERS.INSUFFICIENT_BALANCE` - Balance error
  - `TEST_PHONE_NUMBERS.BRAND_NOT_AUTH` - Brand authorization error
- **Fixed Test OTP**: `TEST_OTP_CODE` constant ('123456')
- **Auto-Configuration**: Optional `autoConfig` setting to fetch server configuration on init
- **Enhanced SDK Tracking**: Automatic version, platform, and language headers
- **Automatic Idempotency**: Auto-generated idempotency keys for all send/resend operations
- **New Error Classes**:
  - `BrandNotConfiguredError` - Brand not configured (Georgian numbers)
  - `BrandPendingApprovalError` - Brand pending approval
  - `IdempotencyConflictError` - Idempotency key conflict
  - `ApiKeyRevokedError` - API key has been revoked
- **Enhanced Error Code**: Added `BRAND_CREATION_FAILED` to ErrorCode enum
- **Mobile Examples**:
  - React Native complete example with UI component
  - Flutter/Dart integration example
  - iOS native (Swift) example
  - Android native (Kotlin) example
- **New Documentation**:
  - `MOBILE_INTEGRATION.md` - Complete mobile integration guide
  - `TESTING_GUIDE.md` - Comprehensive testing guide
  - `API_REFERENCE.md` - Complete API reference
  - Updated `MOBILE_APPS.md` in examples with all platforms
- **Response Metadata**: Support for rate limit info in responses
- **Platform Detection**: Auto-detect Node.js, browser, or React Native
- **SDK Configuration Caching**: 1-hour cache for server configuration

### Changed
- **Idempotency Keys**: Now auto-generated by default (can still be manually provided)
- **HTTP Headers**: Automatically include SDK version, platform, and language
- **Configuration**: Extended `OtpClientConfig` with new optional fields
- **Examples**: Updated all examples to showcase v2.0 features

### Improved
- **Error Handling**: More specific error classes for better error handling
- **Documentation**: Comprehensive guides for mobile integration and testing
- **Type Safety**: Enhanced TypeScript types for all new features
- **Developer Experience**: Better logging and warnings in development

### Fixed
- None (backward compatible release)

### Breaking Changes
- **None** - All v1.0 code continues to work without modification

### Migration from v1.0
No breaking changes! All v1.0 code works in v2.0. New features are opt-in:

```typescript
// v1.0 code (still works)
const client = new OtpClient({ apiKey: 'key' });
await client.sendOtp({ phoneNumber: '+995...' });
await client.verifyOtp({ requestId, code });

// v2.0 additions (optional)
const status = await client.getStatus(requestId);
const testMode = await client.isTestMode();
```

---

## [1.0.0] - 2025-12-25

### Added
- Initial release of @smart-pay-chain/otp
- Support for sending OTPs via SMS, WhatsApp, and Voice channels
- OTP verification with timing-safe comparison
- OTP resending functionality
- Comprehensive error handling with specific error classes:
  - `OtpError` - Base error class
  - `AuthenticationError` - Authentication failures
  - `ValidationError` - Input validation errors
  - `RateLimitError` - Rate limit exceeded
  - `OtpNotFoundError` - OTP request not found
  - `OtpExpiredError` - OTP has expired
  - `InvalidOtpError` - Invalid OTP code
  - `ServiceUnavailableError` - Service unavailable
  - `InsufficientBalanceError` - Insufficient account balance
- Automatic retry logic for transient failures
- Full TypeScript support with comprehensive type definitions
- Idempotency key support to prevent duplicate requests
- Custom metadata support for OTP requests
- Configurable request timeout and max retries
- E.164 phone number validation
- Comprehensive test suite with >80% coverage
- Detailed documentation and API reference
- Multiple usage examples:
  - Basic usage example
  - Advanced usage with error handling
  - Express.js backend integration
  - React frontend integration
- Contributing guidelines
- Publishing guide for maintainers

### Security
- Built-in encryption support
- Timing-safe OTP comparison
- Rate limiting integration
- HTTPS-only communication
- Secure API key authentication

### Documentation
- Comprehensive README with quick start guide
- API reference documentation
- Code examples for common use cases
- Best practices guide
- TypeScript type definitions
- JSDoc comments for all public APIs

## [Unreleased]

### Planned
- Webhook signature verification helpers
- Billing and balance checking methods
- Usage statistics methods
- Batch OTP operations
- Custom SMS templates

---

## Version History

- **2.0.0** - Major update with test mode, mobile examples, new methods (2025-12-28)
- **1.0.0** - Initial release (2025-12-25)

