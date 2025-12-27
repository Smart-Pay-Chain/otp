# Mobile Integration Guide

Complete guide for integrating OTP verification in mobile applications.

## Overview

This guide shows how to implement passwordless phone authentication in mobile apps using OTPs, including:
- Phone number verification
- JWT access and refresh tokens
- Token refresh patterns
- Security best practices

## Architecture

```
Mobile App → Your Backend API → OTP SDK → OTP Service
     ↓              ↓
  JWT Tokens   Token Refresh
```

**Key Principle**: The OTP SDK runs on your backend, not in the mobile app. This keeps API keys secure.

## Complete Passwordless Auth Flow

### Step 1: Send OTP (Backend)

```typescript
// backend/routes/auth.ts
import { OtpClient } from '@smart-pay-chain/otp';

const otpClient = new OtpClient({
  apiKey: process.env.OTP_API_KEY,
});

router.post('/auth/phone/send-otp', async (req, res) => {
  const { phoneNumber } = req.body;
  
  const result = await otpClient.sendOtp({
    phoneNumber,
    metadata: {
      platform: req.headers['x-app-platform'], // 'ios' | 'android'
      appVersion: req.headers['x-app-version'],
    },
  });

  res.json({
    success: true,
    data: {
      requestId: result.requestId,
      expiresAt: result.expiresAt,
    },
  });
});
```

### Step 2: Verify OTP and Issue Tokens (Backend)

```typescript
router.post('/auth/phone/verify-otp', async (req, res) => {
  const { requestId, code, phoneNumber } = req.body;
  
  // Verify OTP
  const verification = await otpClient.verifyOtp({
    requestId,
    code,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  if (!verification.success) {
    return res.status(400).json({
      success: false,
      error: verification.message,
    });
  }

  // Find or create user
  let user = await db.users.findOne({ phoneNumber });
  if (!user) {
    user = await db.users.create({
      phoneNumber,
      verifiedAt: new Date(),
    });
  }

  // Generate JWT tokens
  const accessToken = jwt.sign(
    {
      userId: user.id,
      phoneNumber: user.phoneNumber,
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Short-lived access token
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      type: 'refresh',
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // Long-lived refresh token
  );

  // Store refresh token in database
  await db.refreshTokens.create({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    deviceInfo: {
      platform: req.headers['x-app-platform'],
      version: req.headers['x-app-version'],
    },
  });

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes
      },
    },
  });
});
```

### Step 3: Refresh Token Endpoint (Backend)

```typescript
router.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET) as any;

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Check if token exists and is valid
    const stored = await db.refreshTokens.findOne({
      userId: decoded.userId,
      token: refreshToken,
    });

    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Get user
    const user = await db.users.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        phoneNumber: user.phoneNumber,
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Optionally rotate refresh token
    const newRefreshToken = jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Update refresh token in database
    await db.refreshTokens.updateOne(
      { _id: stored._id },
      {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastUsed: new Date(),
      }
    );

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
      },
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

## Mobile App Implementation

### React Native

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  private API_URL = 'https://your-backend.com/api';

  async sendOtp(phoneNumber: string) {
    const response = await fetch(`${this.API_URL}/auth/phone/send-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Platform': Platform.OS,
        'X-App-Version': '1.0.0',
      },
      body: JSON.stringify({ phoneNumber }),
    });

    return response.json();
  }

  async verifyOtp(requestId: string, code: string, phoneNumber: string) {
    const response = await fetch(`${this.API_URL}/auth/phone/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requestId, code, phoneNumber }),
    });

    const data = await response.json();

    if (data.success) {
      // Store tokens
      await AsyncStorage.setItem('accessToken', data.data.tokens.accessToken);
      await AsyncStorage.setItem('refreshToken', data.data.tokens.refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
    }

    return data;
  }

  async refreshAccessToken() {
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const response = await fetch(`${this.API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    if (data.success) {
      // Update tokens
      await AsyncStorage.setItem('accessToken', data.data.accessToken);
      await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
      return data.data.accessToken;
    }

    throw new Error('Failed to refresh token');
  }

  async getAccessToken() {
    let accessToken = await AsyncStorage.getItem('accessToken');

    // Check if token is expired (decode JWT)
    if (accessToken && this.isTokenExpired(accessToken)) {
      // Refresh token
      accessToken = await this.refreshAccessToken();
    }

    return accessToken;
  }

  async makeAuthenticatedRequest(url: string, options: RequestInit = {}) {
    const accessToken = await this.getAccessToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // If 401, try refreshing token once
    if (response.status === 401) {
      const newToken = await this.refreshAccessToken();

      // Retry with new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${newToken}`,
        },
      });
    }

    return response;
  }

  async logout() {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}

export const authService = new AuthService();
```

### Using in React Native Components

```typescript
import { authService } from './services/auth';

function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('+995');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [requestId, setRequestId] = useState('');

  const handleSendOtp = async () => {
    const result = await authService.sendOtp(phoneNumber);
    if (result.success) {
      setRequestId(result.data.requestId);
      setStep('otp');
    }
  };

  const handleVerifyOtp = async (code: string) => {
    const result = await authService.verifyOtp(requestId, code, phoneNumber);
    if (result.success) {
      // Navigate to main app
      navigation.replace('Dashboard');
    }
  };

  // See examples/react-native-example.tsx for complete UI
}
```

## Security Best Practices

1. **Never Store API Keys in Mobile Apps**
   - Use backend API as proxy
   - API keys only on backend servers

2. **Secure Token Storage**
   - Use `@react-native-async-storage/async-storage` (not SecureStore for refresh tokens)
   - Consider `react-native-keychain` for sensitive data on device

3. **Token Expiration**
   - Access tokens: 15 minutes (short-lived)
   - Refresh tokens: 7 days (long-lived)
   - Implement automatic token refresh

4. **HTTPS Only**
   - All API calls over HTTPS
   - Certificate pinning for extra security

5. **Validate on Backend**
   - Never trust client-side validation alone
   - Validate phone numbers on backend

6. **Rate Limiting**
   - Implement on backend
   - Prevent abuse of OTP endpoints

## App Lifecycle Handling

Handle OTP flows when app goes to background:

```typescript
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active' && step === 'otp') {
      // App came to foreground
      // Check if OTP was verified elsewhere
      checkOtpStatus();
    }
  });

  return () => subscription.remove();
}, [step]);

const checkOtpStatus = async () => {
  const response = await fetch(`${API_URL}/otp/status/${requestId}`);
  const data = await response.json();
  
  if (data.status === 'VERIFIED') {
    // Auto-login
    onVerified();
  }
};
```

## Testing on Mobile

### Development Mode

```typescript
// Use test mode for development
const client = new OtpClient({
  apiKey: process.env.DEV_API_KEY,
  autoConfig: true, // Detects test mode
});

// Check test mode
const testMode = await client.isTestMode();
if (testMode) {
  // Show test mode indicator in dev builds
  console.log('🧪 Test Mode Active');
}
```

### Testing Strategy

1. **Unit Tests**: Mock the backend API
2. **Integration Tests**: Use test mode with fixed OTP codes
3. **E2E Tests**: Use real phone numbers in staging
4. **Manual Testing**: Use test phone numbers during development

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing strategies.

## Complete Examples

- [React Native Example](./examples/react-native-example.tsx) - Full UI component
- [Mobile Apps Guide](./examples/MOBILE_APPS.md) - Platform-specific examples
- [Test Mode Example](./examples/test-mode-example.ts) - Testing patterns

## Common Patterns

### Pattern 1: Login with Phone

1. User enters phone number
2. Send OTP
3. User enters OTP code
4. Verify OTP
5. Issue JWT tokens
6. Store tokens in AsyncStorage
7. Navigate to main app

### Pattern 2: Two-Factor Authentication

1. User logs in with email/password
2. Send OTP to registered phone
3. User enters OTP code
4. Verify OTP
5. Complete authentication

### Pattern 3: Phone Number Change

1. User initiates phone change
2. Send OTP to new phone
3. Verify OTP
4. Update phone number
5. Re-issue tokens

## Troubleshooting

### Tokens Not Persisting

**Solution**: Ensure AsyncStorage is properly configured:

```bash
npm install @react-native-async-storage/async-storage
cd ios && pod install
```

### 401 Errors After Token Refresh

**Solution**: Ensure you're using the new tokens after refresh:

```typescript
// Update stored token immediately after refresh
await AsyncStorage.setItem('accessToken', newAccessToken);
```

### OTP Not Received

**Solution**: Add retry logic and check status:

```typescript
// Check delivery status
const status = await fetch(`${API_URL}/otp/status/${requestId}`);
const data = await status.json();

if (data.status === 'FAILED') {
  // Offer to resend
  showResendButton();
}
```

## Resources

- [React Native Example](./examples/react-native-example.tsx)
- [Mobile Apps Guide](./examples/MOBILE_APPS.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [API Reference](./API_REFERENCE.md)

## Support

For mobile integration help:
- GitHub Issues: https://github.com/Smart-Pay-Chain/otp/issues
- Email: support@smartpaychain.com

