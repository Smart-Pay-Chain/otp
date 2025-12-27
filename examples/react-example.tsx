/**
 * React Integration Example
 *
 * This example demonstrates how to use the OTP SDK in a React application
 * for phone number verification.
 *
 * Note: In production, the SDK should be used on the backend.
 * This example shows frontend integration for demo purposes.
 */

import React, { useState } from 'react';

interface OtpVerificationProps {
  apiKey: string;
  onVerified: (phoneNumber: string) => void;
}

export const OtpVerification: React.FC<OtpVerificationProps> = ({ apiKey, onVerified }) => {
  const [phoneNumber, setPhoneNumber] = useState('+995');
  const [otpCode, setOtpCode] = useState('');
  const [requestId, setRequestId] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // In production, make API call to your backend
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setRequestId(data.data.requestId);
        setExpiresAt(new Date(data.data.expiresAt));
        setStep('verify');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // In production, make API call to your backend
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber,
          code: otpCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onVerified(phoneNumber);
      } else {
        setError(data.error || 'Invalid OTP code');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setExpiresAt(new Date(data.data.expiresAt));
        setOtpCode('');
        alert('OTP resent successfully!');
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="otp-verification">
      {step === 'phone' ? (
        <form onSubmit={handleSendOtp}>
          <h2>Verify Your Phone Number</h2>
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+995555123456"
              required
              disabled={loading}
            />
            <small>Enter phone number in E.164 format</small>
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp}>
          <h2>Enter Verification Code</h2>
          <p>We sent a code to {phoneNumber}</p>
          <div className="form-group">
            <label htmlFor="otpCode">Verification Code</label>
            <input
              id="otpCode"
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              maxLength={8}
              required
              disabled={loading}
              autoFocus
            />
          </div>
          {expiresAt && (
            <div className="expiry">
              Expires at: {expiresAt.toLocaleTimeString()}
            </div>
          )}
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={loading}
            className="secondary"
          >
            Resend OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('phone');
              setOtpCode('');
              setError('');
            }}
            disabled={loading}
            className="text"
          >
            Change phone number
          </button>
        </form>
      )}
    </div>
  );
};

// Usage example:
// <OtpVerification
//   apiKey="your-api-key"
//   onVerified={(phoneNumber) => {
//     console.log('Phone verified:', phoneNumber);
//     // Redirect to dashboard, etc.
//   }}
// />

