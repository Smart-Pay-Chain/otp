# Installation and Usage Instructions

## For Package Users

### Installation

```bash
npm install @smartpaychain/otp-sdk
# or
yarn add @smartpaychain/otp-sdk
```

### Quick Start

```typescript
import { OtpClient } from '@smartpaychain/otp-sdk';

const client = new OtpClient({
  apiKey: process.env.OTP_API_KEY,
  autoConfig: true,
});

// Send OTP
const result = await client.sendOtp({
  phoneNumber: '+995555123456',
});

// Verify OTP
const verification = await client.verifyOtp({
  requestId: result.requestId,
  code: '123456',
});
```

See [QUICKSTART.md](./QUICKSTART.md) for detailed getting started guide.

## For Package Developers

### Setup

```bash
# Clone repository
git clone https://github.com/Smart-Pay-Chain/otp.git
cd otp

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

### Development

```bash
# Watch mode for tests
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

### Publishing (Maintainers Only)

```bash
# 1. Update version in package.json
# 2. Update CHANGELOG.md
# 3. Run tests
npm test

# 4. Build
npm run build

# 5. Login to npm
npm login

# 6. Publish
npm publish --access public

# 7. Create git tag
git tag v2.0.0
git push origin v2.0.0
```

See [PUBLISHING.md](./PUBLISHING.md) for detailed publishing guide.

## Documentation

- **[README.md](./README.md)** - Main documentation
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete API reference
- **[MOBILE_INTEGRATION.md](./MOBILE_INTEGRATION.md)** - Mobile app guide
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing strategies
- **[examples/](./examples/)** - Code examples

## Support

- **GitHub**: https://github.com/Smart-Pay-Chain/otp/issues
- **Email**: support@smartpaychain.com
- **Documentation**: See README.md

