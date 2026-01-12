/**
 * Phone Authentication Example
 *
 * This example shows how to implement passwordless phone authentication
 * using the OTP service backend. This demonstrates the complete flow from
 * OTP sending to JWT token generation.
 *
 * Backend Required: Yes (sms-service backend must be running)
 * Use Case: User registration and login via phone number
 *
 * Installation:
 * npm install express axios
 * npm install --save-dev @types/express
 */

import express, { Request, Response, NextFunction } from 'express';
import axios from 'axios';

const app = express();
app.use(express.json());

// Your backend API URL (sms-service)
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3000/api/v1';

/**
 * Response types from the backend
 */
interface PhoneRegisterResponse {
  success: boolean;
  data: {
    verificationId: string;
    phoneNumber: string;
    message: string;
    expiresIn: number;
  };
}

interface PhoneVerifyResponse {
  success: boolean;
  data: {
    account: {
      id: string;
      phoneNumber: string;
      company: string | null;
      status: string;
      role?: 'USER' | 'ADMIN';
    };
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
    apiKeys: Array<{
      id: string;
      name: string;
      key?: string; // Only present for NEW accounts
      rateLimit: number;
      status: string;
      createdAt: string;
    }>;
    isNewAccount: boolean;
  };
  message: string;
}

/**
 * POST /api/auth/register-phone
 * Step 1: Send OTP to phone number for registration
 */
app.post('/api/auth/register-phone', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumber, company } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    // Call backend to send OTP
    const response = await axios.post<PhoneRegisterResponse>(
      `${BACKEND_API_URL}/auth/phone/register`,
      { phoneNumber, company }
    );

    // Store verificationId in session/client for the next step
    res.status(200).json({
      success: true,
      data: {
        verificationId: response.data.data.verificationId,
        message: response.data.data.message,
        expiresIn: response.data.data.expiresIn,
      },
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data.error || 'Failed to send OTP',
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/login-phone
 * Step 1: Send OTP to phone number for login
 */
app.post('/api/auth/login-phone', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    // Call backend to send OTP
    const response = await axios.post<PhoneRegisterResponse>(
      `${BACKEND_API_URL}/auth/phone/login`,
      { phoneNumber }
    );

    res.status(200).json({
      success: true,
      data: {
        verificationId: response.data.data.verificationId,
        message: response.data.data.message,
        expiresIn: response.data.data.expiresIn,
      },
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data.error || 'Failed to send OTP',
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/verify-phone
 * Step 2: Verify OTP and get JWT tokens
 */
app.post('/api/auth/verify-phone', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { verificationId, otpCode } = req.body;

    if (!verificationId || !otpCode) {
      return res.status(400).json({
        success: false,
        error: 'Verification ID and OTP code are required',
      });
    }

    // Call backend to verify OTP
    const response = await axios.post<PhoneVerifyResponse>(`${BACKEND_API_URL}/auth/phone/verify`, {
      verificationId,
      otpCode,
    });

    const { account, tokens, apiKeys, isNewAccount } = response.data.data;

    // ⚠️ IMPORTANT: Save the API key secret for NEW accounts
    // This is the ONLY time you'll see the key value!
    if (isNewAccount && apiKeys.length > 0 && apiKeys[0].key) {
      console.log('🔑 NEW USER - Save this API key:', apiKeys[0].key);
      console.log('⚠️ This is the only time you will see this key!');

      // In production: Store in secure user settings, show in UI once
      // Example: Store in user's profile or send via secure channel
    }

    // Store JWT tokens securely (httpOnly cookies recommended)
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokens.expiresIn * 1000,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user data (without sensitive tokens in body)
    res.status(isNewAccount ? 201 : 200).json({
      success: true,
      data: {
        account: {
          id: account.id,
          phoneNumber: account.phoneNumber,
          company: account.company,
          status: account.status,
          role: account.role,
        },
        apiKeys: apiKeys.map((key) => ({
          id: key.id,
          name: key.name,
          key: key.key, // Only present for new accounts
          rateLimit: key.rateLimit,
          createdAt: key.createdAt,
        })),
        isNewAccount,
      },
      message: isNewAccount ? 'Account created successfully' : 'Login successful',
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data.error || 'Failed to verify OTP',
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
app.post('/api/auth/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token is required',
      });
    }

    // Call backend to refresh token
    const response = await axios.post(`${BACKEND_API_URL}/auth/refresh`, { refreshToken });

    const { accessToken, expiresIn } = response.data.data;

    // Update access token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data.error || 'Failed to refresh token',
      });
    }
    next(error);
  }
});

/**
 * Middleware to verify JWT token
 */
const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // Verify token with backend (optional, or verify locally with JWT_SECRET)
    // For this example, we'll just pass it through
    (req as { token?: string }).token = token;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

/**
 * Protected route example
 */
app.get('/api/user/profile', authenticateJWT, async (req: Request, res: Response) => {
  const token = (req as { token?: string }).token;

  try {
    // Call backend to get user profile
    const response = await axios.get(`${BACKEND_API_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    res.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data.error || 'Failed to fetch profile',
      });
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Error handling middleware
 */
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', error);

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`🚀 Phone Auth Server running on port ${PORT}`);
  console.log('\n📱 Available endpoints:');
  console.log('POST /api/auth/register-phone - Send OTP for registration');
  console.log('POST /api/auth/login-phone - Send OTP for login');
  console.log('POST /api/auth/verify-phone - Verify OTP and get tokens');
  console.log('POST /api/auth/refresh - Refresh access token');
  console.log('GET  /api/user/profile - Get user profile (protected)');
  console.log('\n⚙️  Backend API:', BACKEND_API_URL);
});

export default app;

/**
 * USAGE EXAMPLE:
 *
 * 1. Registration Flow:
 *    POST /api/auth/register-phone
 *    Body: { "phoneNumber": "+995568000865", "company": "My Company" }
 *
 *    Response: { "verificationId": "...", "message": "OTP sent..." }
 *
 *    POST /api/auth/verify-phone
 *    Body: { "verificationId": "...", "otpCode": "123456" }
 *
 *    Response: { "account": {...}, "apiKeys": [{ "key": "..." }], "isNewAccount": true }
 *    ⚠️ Save the API key - you won't see it again!
 *
 * 2. Login Flow:
 *    POST /api/auth/login-phone
 *    Body: { "phoneNumber": "+995568000865" }
 *
 *    Response: { "verificationId": "...", "message": "OTP sent..." }
 *
 *    POST /api/auth/verify-phone
 *    Body: { "verificationId": "...", "otpCode": "123456" }
 *
 *    Response: { "account": {...}, "apiKeys": [], "isNewAccount": false }
 *    (No API key returned for existing users)
 *
 * 3. Using Protected Routes:
 *    GET /api/user/profile
 *    Cookie: accessToken=... (or Header: Authorization: Bearer ...)
 */
