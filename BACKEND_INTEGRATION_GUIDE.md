# Backend Integration Guide

## Overview

This guide covers integrating your application with the Smart Pay Chain OTP backend (`sms-service`), which provides phone-based authentication with JWT tokens and API key management.

**Backend URLs:**
- Production: `https://otp-service-production-ge.up.railway.app`
- Local Development: `http://localhost:3000`

## Table of Contents

- [Phone Authentication Flow](#phone-authentication-flow)
- [Backend API Endpoints](#backend-api-endpoints)
- [Response Structures](#response-structures)
- [Admin Role Support](#admin-role-support)
- [Brand Management](#brand-management)
- [API Key Handling](#api-key-handling)
- [Security Best Practices](#security-best-practices)

## Phone Authentication Flow

### Registration Flow

```
User → Frontend → Backend API → sms-service → Ubill SMS → User
         ↓                           ↓
    Verify OTP ← ← ← ← ← ← ← ← JWT Tokens + API Keys
```

**Steps:**

1. **Send OTP for Registration**
   ```typescript
   POST /api/v1/auth/phone/register
   Body: { "phoneNumber": "+995568000865", "company": "My Company" }
   
   Response:
   {
     "success": true,
     "data": {
       "verificationId": "clx...",
       "phoneNumber": "+995568000865",
       "message": "OTP sent to your phone number",
       "expiresIn": 300
     }
   }
   ```

2. **Verify OTP**
   ```typescript
   POST /api/v1/auth/phone/verify
   Body: { "verificationId": "clx...", "otpCode": "123456" }
   
   Response (NEW ACCOUNT):
   {
     "success": true,
     "data": {
       "account": {
         "id": "clx...",
         "phoneNumber": "+995568000865",
         "company": "My Company",
         "status": "ACTIVE",
         "role": "USER"  // or "ADMIN" if admin phone
       },
       "tokens": {
         "accessToken": "eyJhbGc...",
         "refreshToken": "eyJhbGc...",
         "expiresIn": 900  // 15 minutes
       },
       "apiKeys": [
         {
           "id": "clx...",
           "name": "Default Key",
           "key": "sk_live_xxxxxxxxxxxxx",  // ⚠️ ONLY visible once!
           "rateLimit": 100,
           "status": "ACTIVE",
           "createdAt": "2026-01-13T..."
         }
       ],
       "isNewAccount": true
     },
     "message": "Account created successfully"
   }
   ```

3. **Important: Save API Key**
   ```typescript
   // ⚠️ The API key secret is only returned ONCE at account creation
   // You MUST save it for the user immediately
   
   if (response.data.isNewAccount && response.data.apiKeys[0].key) {
     // Store in database, show in UI, send via email, etc.
     saveApiKeySecurely(response.data.apiKeys[0].key);
   }
   ```

### Login Flow

```typescript
// 1. Send OTP for existing user
POST /api/v1/auth/phone/login
Body: { "phoneNumber": "+995568000865" }

Response:
{
  "success": true,
  "data": {
    "verificationId": "clx...",
    "phoneNumber": "+995568000865",
    "message": "OTP sent to your phone number",
    "expiresIn": 300
  }
}

// 2. Verify OTP
POST /api/v1/auth/phone/verify
Body: { "verificationId": "clx...", "otpCode": "123456" }

Response (EXISTING ACCOUNT):
{
  "success": true,
  "data": {
    "account": {
      "id": "clx...",
      "phoneNumber": "+995568000865",
      "company": "My Company",
      "status": "ACTIVE",
      "role": "USER"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc...",
      "expiresIn": 900
    },
    "apiKeys": [
      {
        "id": "clx...",
        "name": "Default Key",
        // ⚠️ No "key" field for existing accounts
        "rateLimit": 100,
        "lastUsed": "2026-01-13T...",
        "createdAt": "2026-01-10T...",
        "status": "ACTIVE"
      }
    ],
    "isNewAccount": false
  },
  "message": "Login successful"
}
```

## Backend API Endpoints

### Authentication Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/auth/phone/register` | POST | Send OTP for registration | No |
| `/api/v1/auth/phone/login` | POST | Send OTP for login | No |
| `/api/v1/auth/phone/verify` | POST | Verify OTP and get tokens | No |
| `/api/v1/auth/refresh` | POST | Refresh access token | Yes (refresh token) |

### User Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/keys` | GET | List API keys | Yes (JWT) |
| `/api/v1/keys` | POST | Create API key | Yes (JWT) |
| `/api/v1/keys/:id` | DELETE | Delete API key | Yes (JWT) |
| `/api/v1/brands` | GET | Get brand status | Yes (JWT) |
| `/api/v1/brands` | POST | Request brand | Yes (JWT) |
| `/api/v1/billing/balance` | GET | Get balance | Yes (JWT) |
| `/api/v1/billing/transactions` | GET | Get transactions | Yes (JWT) |

### Admin Endpoints

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/v1/admin/brands` | GET | List brand requests | Yes (Admin JWT) |
| `/api/v1/admin/brands/:id/approve` | POST | Approve brand | Yes (Admin JWT) |
| `/api/v1/admin/brands/:id/reject` | POST | Reject brand | Yes (Admin JWT) |
| `/api/v1/admin/accounts` | GET | List all accounts | Yes (Admin JWT) |

## Response Structures

### Account Object

```typescript
interface Account {
  id: string;
  phoneNumber: string;
  company: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  role?: 'USER' | 'ADMIN';
  tier?: 'FREE' | 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  balance?: number;
  currency?: string;
}
```

### Tokens Object

```typescript
interface Tokens {
  accessToken: string;   // JWT, expires in 15 minutes
  refreshToken: string;  // JWT, expires in 7 days
  expiresIn: number;     // Access token lifetime in seconds (900)
}
```

### API Key Object

```typescript
interface ApiKey {
  id: string;
  name: string;
  key?: string;          // ⚠️ Only present for NEW accounts
  rateLimit: number;
  status: 'ACTIVE' | 'REVOKED';
  lastUsed?: string;     // ISO timestamp
  createdAt: string;     // ISO timestamp
}
```

### Brand Request Object

```typescript
interface BrandRequest {
  id: string;
  brandName: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  ubillBrandId?: number;
  createdAt: string;
  updatedAt: string;
}
```

## Admin Role Support

### Admin Phone Numbers

Admins are configured via the `ADMIN_PHONE_NUMBERS` environment variable:

```env
ADMIN_PHONE_NUMBERS=+995568000865,+995555111222
```

When an admin phone number registers, they automatically get `role: "ADMIN"`.

### Admin Capabilities

Admins can:
- ✅ View all user accounts
- ✅ Approve/reject brand requests
- ✅ Access admin-only endpoints
- ✅ View all activity logs

### Checking Admin Role

```typescript
// In your frontend
if (account.role === 'ADMIN') {
  // Show admin UI
  showAdminPanel();
}

// In your backend
app.get('/admin/dashboard', authenticateJWT, requireAdmin, (req, res) => {
  // Only admins can access this
});
```

## Brand Management

### Two-Stage Brand Approval

1. **User Requests Brand**
   ```typescript
   POST /api/v1/brands
   Body: { "brandName": "MyBrand" }
   
   Response:
   {
     "success": true,
     "data": {
       "requestId": "clx...",
       "brandName": "MyBrand",
       "status": "pending_approval",
       "message": "Brand request submitted. Waiting for admin approval."
     }
   }
   ```

2. **Admin Approves Brand**
   ```typescript
   POST /api/v1/admin/brands/{requestId}/approve
   
   Response:
   {
     "success": true,
     "data": {
       "brandName": "MyBrand",
       "status": "approved",
       "ubillBrandId": 123,
       "message": "Brand approved and registered with SMS provider"
     }
   }
   ```

3. **User Can Now Send SMS**
   ```typescript
   // After approval, SMS requests will use the approved brand
   POST /api/v1/otp/send
   Body: { "phoneNumber": "+995568000865" }
   
   // SMS sent with "MyBrand" as sender
   ```

### Brand Name Requirements

- Length: 3-11 characters
- Characters: Letters, numbers, dots, hyphens, spaces
- Examples: `MyCompany`, `Company.Ge`, `Test-App`

## API Key Handling

### Why API Keys Matter

API keys are used to:
- Authenticate requests to the OTP service
- Track usage and billing
- Apply rate limits
- Associate OTP requests with accounts

### Creating Additional Keys

```typescript
POST /api/v1/keys
Headers: { "Authorization": "Bearer {accessToken}" }
Body: { "name": "Production Key", "rateLimit": 1000 }

Response:
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "Production Key",
    "key": "sk_live_xxxxxxxxxxxxx",  // ⚠️ Save this!
    "rateLimit": 1000,
    "createdAt": "2026-01-13T..."
  }
}
```

### Deleting Keys

```typescript
DELETE /api/v1/keys/{keyId}
Headers: { "Authorization": "Bearer {accessToken}" }

// ⚠️ Cannot delete the last active key
// Must have at least one active key
```

### Using API Keys

```typescript
import { OtpClient } from '@smart-pay-chain/otp';

const client = new OtpClient({
  apiKey: 'sk_live_xxxxxxxxxxxxx',  // From registration
});

await client.sendOtp({
  phoneNumber: '+995568000865',
});
```

## Security Best Practices

### 1. Token Management

```typescript
// ✅ DO: Store tokens in httpOnly cookies
res.cookie('accessToken', tokens.accessToken, {
  httpOnly: true,
  secure: true,  // HTTPS only
  sameSite: 'strict',
  maxAge: 900000  // 15 minutes
});

// ❌ DON'T: Store tokens in localStorage
localStorage.setItem('accessToken', tokens.accessToken); // Vulnerable to XSS
```

### 2. API Key Storage

```typescript
// ✅ DO: Save API keys immediately at registration
if (isNewAccount && apiKeys[0].key) {
  await db.saveUserApiKey(userId, apiKeys[0].key);
  showUserTheKey(apiKeys[0].key);
}

// ❌ DON'T: Assume you can fetch the key later
// The key is only returned ONCE
```

### 3. Environment Variables

```env
# ✅ DO: Use environment variables
BACKEND_API_URL=https://api.yourapp.com
JWT_SECRET=your-very-long-and-secure-secret

# ❌ DON'T: Hardcode URLs or secrets
```

### 4. Error Handling

```typescript
// ✅ DO: Handle specific errors
try {
  await verifyOtp(verificationId, code);
} catch (error) {
  if (error.code === 'OTP_EXPIRED') {
    return 'OTP expired. Request a new one.';
  }
  if (error.code === 'INVALID_OTP_CODE') {
    return 'Invalid code. Try again.';
  }
  return 'An error occurred. Please try again.';
}

// ❌ DON'T: Show raw error messages to users
```

### 5. Rate Limiting

```typescript
// ✅ DO: Implement rate limiting on your endpoints
import rateLimit from 'express-rate-limit';

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many OTP requests. Please try again later.'
});

app.post('/api/auth/send-otp', otpLimiter, sendOtpHandler);
```

## Complete Example

See [`examples/phone-authentication.ts`](./examples/phone-authentication.ts) for a complete, production-ready implementation with:

- ✅ Registration and login flows
- ✅ JWT token management
- ✅ API key handling
- ✅ Secure cookie handling
- ✅ Error handling
- ✅ Protected routes
- ✅ Token refresh

## Testing

### Cypress Test Mode

The backend supports a test phone number for automated testing:

```env
ENABLE_TEST_PHONE=true
TEST_PHONE_NUMBER=+995000000000
TEST_OTP_CODE=123456
```

```typescript
// In tests
await sendOtp({ phoneNumber: '+995000000000' });
await verifyOtp(verificationId, '123456');  // Always succeeds
```

### Test Configuration Endpoint

```typescript
GET /api/v1/test/config

Response:
{
  "success": true,
  "data": {
    "environment": "development",
    "testPhoneEnabled": true,
    "testPhoneNumber": "+995000000000",
    "testOtpCode": "123456"
  }
}
```

## Support

- 📚 **API Docs**: https://docs.smartpaychain.com
- 🐛 **Issues**: https://github.com/Smart-Pay-Chain/otp/issues
- 📧 **Email**: support@smartpaychain.com

---

**Last Updated**: January 2026  
**Backend Version**: v1.0.0+  
**SDK Version**: v2.0.5+
