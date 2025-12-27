# 📖 START HERE - OTP SDK v2.0

Welcome to @smart-pay-chain/otp v2.0! This file will help you get oriented.

## 🎯 What is This Package?

A production-ready npm package for sending and verifying OTPs (one-time passwords) via SMS, WhatsApp, and Voice. Perfect for mobile apps requiring phone authentication.

**Key Use Cases:**
- 📱 Mobile app phone verification
- 🔐 Passwordless authentication
- ✅ Two-factor authentication (2FA)
- 🔑 Account recovery

## 🚀 Quick Start (30 seconds)

```bash
# Install
npm install @smart-pay-chain/otp

# Use
import { OtpClient } from '@smart-pay-chain/otp';

const client = new OtpClient({ apiKey: 'your-key' });

// Send OTP
const result = await client.sendOtp({ phoneNumber: '+995555123456' });

// Verify OTP
const verified = await client.verifyOtp({ 
  requestId: result.requestId, 
  code: '123456' 
});
```

## 📚 Where to Go Next

### For Different Use Cases:

1. **Just Want to Get Started?**
   → Read [QUICKSTART.md](./QUICKSTART.md) (5 minutes)

2. **Building a Mobile App?**
   → Read [MOBILE_INTEGRATION.md](./MOBILE_INTEGRATION.md)
   → Check [examples/react-native-example.tsx](./examples/react-native-example.tsx)

3. **Need Complete API Docs?**
   → Read [API_REFERENCE.md](./API_REFERENCE.md)

4. **Want to Test Without Real SMS?**
   → Read [TESTING_GUIDE.md](./TESTING_GUIDE.md)
   → Check [examples/test-mode-example.ts](./examples/test-mode-example.ts)

5. **Looking for Code Examples?**
   → Browse [examples/](./examples/) directory (7 examples)

6. **Want All Features?**
   → Read [README.md](./README.md) (complete documentation)

### For Contributors:

- **Contributing**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Publishing**: [PUBLISHING.md](./PUBLISHING.md)

## 🎯 Common Scenarios

### Mobile App Authentication
```
examples/react-native-example.tsx  ← Complete React Native UI
MOBILE_INTEGRATION.md              ← Refresh token pattern
examples/MOBILE_APPS.md            ← All platforms (Flutter, iOS, Android)
```

### Backend Integration
```
examples/express-integration.ts    ← Express.js example
examples/basic-usage.ts            ← Simple Node.js usage
```

### Testing & Development
```
TESTING_GUIDE.md                   ← Test strategies
examples/test-mode-example.ts      ← Test mode usage
```

## 🆕 What's New in v2.0?

- ✅ Test mode with fixed OTP codes
- ✅ Status checking methods
- ✅ Auto-configuration from server
- ✅ Automatic idempotency
- ✅ React Native examples
- ✅ Enhanced error handling
- ✅ Mobile integration guide

**Backward Compatible**: All v1.0 code still works!

## 📦 Package Contents

```
otp/
├── src/                    # 5 TypeScript files
├── tests/                  # 7 test suites (67 tests)
├── examples/               # 8 examples
├── dist/                   # Compiled output
├── README.md               # Main documentation
├── QUICKSTART.md           # 5-minute start
├── API_REFERENCE.md        # Complete API docs
├── MOBILE_INTEGRATION.md   # Mobile guide
├── TESTING_GUIDE.md        # Testing guide
└── ... 8 more docs
```

## ✨ Highlighted Features

1. **Test Mode** - Test without real SMS (`TEST_PHONE_NUMBERS`)
2. **Mobile Ready** - React Native, Flutter, iOS, Android examples
3. **Auto-Idempotency** - Network retry safety built-in
4. **Type Safe** - Full TypeScript support
5. **Well Tested** - 67 tests, 90.71% coverage

## 🎓 Learning Path

**Beginner** (0-15 min):
1. Install package
2. Read QUICKSTART.md
3. Try examples/basic-usage.ts

**Intermediate** (15-30 min):
1. Read README.md
2. Try examples/advanced-usage.ts
3. Set up test mode

**Advanced** (30-60 min):
1. Read MOBILE_INTEGRATION.md
2. Try examples/react-native-example.tsx
3. Read API_REFERENCE.md

## 🆘 Need Help?

- **Quick Questions**: Check [QUICKSTART.md](./QUICKSTART.md)
- **API Details**: Check [API_REFERENCE.md](./API_REFERENCE.md)
- **Mobile Help**: Check [MOBILE_INTEGRATION.md](./MOBILE_INTEGRATION.md)
- **Testing Help**: Check [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Issues**: https://github.com/Smart-Pay-Chain/otp/issues
- **Email**: support@smartpaychain.com

## ⚡ TL;DR

```typescript
// Install
npm install @smart-pay-chain/otp

// Use
import { OtpClient } from '@smart-pay-chain/otp';
const client = new OtpClient({ apiKey: 'your-key' });
await client.sendOtp({ phoneNumber: '+995...' });
await client.verifyOtp({ requestId, code });

// Test Mode
import { TEST_PHONE_NUMBERS, TEST_OTP_CODE } from '@smart-pay-chain/otp';
await client.sendOtp({ phoneNumber: TEST_PHONE_NUMBERS.SUCCESS });
await client.verifyOtp({ requestId, code: TEST_OTP_CODE });
```

---

**Ready to Start?** → Go to [QUICKSTART.md](./QUICKSTART.md)

**Building Mobile App?** → Go to [MOBILE_INTEGRATION.md](./MOBILE_INTEGRATION.md)

**Need Full Docs?** → Go to [README.md](./README.md)
