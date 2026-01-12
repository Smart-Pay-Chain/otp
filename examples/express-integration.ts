/**
 * Express.js Integration Example
 *
 * This example shows how to integrate the OTP SDK into an Express.js application
 * for user authentication workflows.
 *
 * Use Case: You have your own API key and want to add OTP verification to your app
 *
 * For backend integration with sms-service (phone auth + JWT tokens),
 * see: phone-authentication.ts
 */

import express, { Request, Response, NextFunction } from 'express';
import {
  OtpClient,
  OtpChannel,
  OtpError,
  InvalidOtpError,
  OtpExpiredError,
  RateLimitError,
} from '@smart-pay-chain/otp';

const app = express();
app.use(express.json());

// Initialize OTP client with auto-configuration (v2.0+)
const otpClient = new OtpClient({
  apiKey: process.env.OTP_API_KEY || 'your-api-key-here',
  autoConfig: true, // Auto-fetch server configuration
  // baseUrl: 'https://otp-service-production-ge.up.railway.app', // Optional: defaults to Railway production
});

// In-memory store for demo purposes (use Redis in production)
const otpSessions = new Map<
  string,
  {
    requestId: string;
    phoneNumber: string;
    expiresAt: Date;
    attempts: number;
  }
>();

/**
 * POST /api/auth/send-otp
 * Send OTP to user's phone number
 */
app.post('/api/auth/send-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    // Send OTP
    const result = await otpClient.sendOtp({
      phoneNumber,
      channel: OtpChannel.SMS,
      ttl: 300, // 5 minutes
      length: 6,
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      },
      idempotencyKey: `${phoneNumber}-${Date.now()}`,
    });

    // Store session
    otpSessions.set(phoneNumber, {
      requestId: result.requestId,
      phoneNumber,
      expiresAt: result.expiresAt,
      attempts: 0,
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'OTP sent successfully',
        expiresAt: result.expiresAt,
        // Don't send requestId to client for security
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/verify-otp
 * Verify OTP code
 */
app.post('/api/auth/verify-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and code are required',
      });
    }

    // Get session
    const session = otpSessions.get(phoneNumber);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'No OTP request found for this phone number',
      });
    }

    // Check max attempts
    if (session.attempts >= 3) {
      otpSessions.delete(phoneNumber);
      return res.status(429).json({
        success: false,
        error: 'Maximum verification attempts exceeded',
      });
    }

    // Increment attempts
    session.attempts++;

    // Verify OTP
    const result = await otpClient.verifyOtp({
      requestId: session.requestId,
      code,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    if (result.success) {
      // Clear session after successful verification
      otpSessions.delete(phoneNumber);

      // In production: Generate JWT token, create session, etc.
      res.status(200).json({
        success: true,
        data: {
          message: 'Phone number verified successfully',
          token: 'jwt-token-here', // Generate actual token
        },
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    // Handle specific OTP errors (v2.0+)
    if (error instanceof InvalidOtpError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP code. Please try again.',
      });
    }
    if (error instanceof OtpExpiredError) {
      otpSessions.delete(phoneNumber);
      return res.status(400).json({
        success: false,
        error: 'OTP has expired. Please request a new one.',
      });
    }
    if (error instanceof RateLimitError) {
      return res.status(429).json({
        success: false,
        error: 'Too many attempts. Please try again later.',
      });
    }
    next(error);
  }
});

/**
 * POST /api/auth/resend-otp
 * Resend OTP to user
 */
app.post('/api/auth/resend-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
      });
    }

    // Get session
    const session = otpSessions.get(phoneNumber);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'No OTP request found for this phone number',
      });
    }

    // Resend OTP
    const result = await otpClient.resendOtp({
      requestId: session.requestId,
    });

    // Update session
    otpSessions.set(phoneNumber, {
      requestId: result.requestId,
      phoneNumber,
      expiresAt: result.expiresAt,
      attempts: 0, // Reset attempts
    });

    res.status(200).json({
      success: true,
      data: {
        message: 'OTP resent successfully',
        expiresAt: result.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Error handling middleware
 */
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', error);

  if (error instanceof OtpError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        retryable: error.retryable,
      },
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log('POST /api/auth/send-otp');
  console.log('POST /api/auth/verify-otp');
  console.log('POST /api/auth/resend-otp');
});

export default app;
