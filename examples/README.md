# OTP SDK Examples

This directory contains various examples demonstrating how to use the @smart-pay-chain/otp in different scenarios.

## Examples

### 1. Basic Usage (`basic-usage.ts`)
The simplest way to send and verify an OTP.

```bash
ts-node examples/basic-usage.ts
```

**What it demonstrates:**
- Initializing the OTP client
- Sending an OTP
- Verifying an OTP code

### 2. Advanced Usage (`advanced-usage.ts`)
Advanced features and error handling.

```bash
ts-node examples/advanced-usage.ts
```

**What it demonstrates:**
- Custom configuration options
- Metadata and idempotency keys
- Resending OTPs
- Multiple delivery channels (WhatsApp, Voice)
- Comprehensive error handling
- Retry logic

### 3. Test Mode (`test-mode-example.ts`) 🆕
Using test mode for development and automated testing.

```bash
ts-node examples/test-mode-example.ts
```

**What it demonstrates:**
- Auto-detecting test mode
- Using test phone numbers
- Fixed OTP codes for testing
- Testing error scenarios
- Automated testing patterns
- Integration test examples

### 4. Express.js Integration (`express-integration.ts`)
Complete backend integration with Express.js.

```bash
npm install express @types/express
ts-node examples/express-integration.ts
```

**What it demonstrates:**
- RESTful API endpoints for OTP
- Session management
- Error handling middleware
- Rate limiting
- Production-ready patterns

### 5. React Integration (`react-example.tsx`)
Frontend integration example with React.

**What it demonstrates:**
- User interface for OTP verification
- Multi-step form flow
- Error display and handling
- Resend functionality
- Best practices for frontend integration

### 6. React Native Integration (`react-native-example.tsx`) 🆕
Complete mobile app OTP verification component.

**What it demonstrates:**
- Phone number input with validation
- OTP code input
- Resend with countdown timer
- Error handling for mobile
- Loading states
- Mobile-specific UX patterns

### 7. Phone Authentication (`phone-authentication.ts`) 🆕
Complete passwordless authentication flow with JWT tokens.

```bash
npm install axios
ts-node examples/phone-authentication.ts
```

**What it demonstrates:**
- Phone number registration with OTP
- Phone login with OTP
- JWT token management (access + refresh)
- API key handling for new users
- Protected route authentication
- Token refresh flow
- Secure cookie handling

### 8. Mobile Apps Guide (`MOBILE_APPS.md`) 🆕
Comprehensive guide for mobile app integration.

**What it covers:**
- React Native integration
- Flutter/Dart integration
- iOS native (Swift)
- Android native (Kotlin)
- Passwordless authentication with refresh tokens
- App backgrounding/foregrounding
- Security best practices
- UX recommendations

## Running the Examples

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Set your API key:
```bash
export OTP_API_KEY="your-api-key-here"
```

### Running TypeScript Examples

```bash
# Install ts-node if you haven't
npm install -g ts-node

# Run any example
ts-node examples/basic-usage.ts
ts-node examples/advanced-usage.ts
ts-node examples/express-integration.ts
```

## Environment Variables

All examples use the following environment variables:

- `OTP_API_KEY`: Your Smart Pay Chain OTP API key (required)
- `PORT`: Port for Express server (default: 3000)

## Best Practices Demonstrated

1. **Security**
   - Never expose API keys in frontend code
   - Use backend API routes to proxy OTP requests
   - Implement rate limiting
   - Use idempotency keys

2. **Error Handling**
   - Handle specific error types
   - Provide user-friendly error messages
   - Implement retry logic for transient errors

3. **User Experience**
   - Show clear feedback to users
   - Implement resend functionality
   - Display OTP expiration time
   - Limit verification attempts

4. **Production Readiness**
   - Use environment variables for configuration
   - Implement proper session management
   - Add request timeout handling
   - Use TypeScript for type safety

## Notes

- Use `+995568000865` for testing (configured test phone number)
- The Express example uses in-memory storage for demo purposes. Use Redis in production.
- The React example assumes you have backend endpoints set up.
- All examples include proper TypeScript types for better developer experience.

## Need Help?

- Check the main [README](../README.md) for SDK documentation
- Review the [API documentation](https://docs.smartpaychain.com)
- Open an issue on GitHub

