/**
 * React Native OTP Verification Example
 *
 * This example demonstrates a complete OTP verification flow for React Native apps:
 * - Phone number input with validation
 * - OTP code input
 * - Resend functionality with countdown timer
 * - Error handling with user-friendly messages
 * - Loading states
 * - Success/failure feedback
 *
 * Note: This example uses the SDK on a backend API, not directly in the mobile app.
 * The mobile app communicates with your backend which uses the OTP SDK.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

const API_BASE_URL = 'https://your-backend.com/api'; // Your backend API

interface OtpVerificationProps {
  onVerified: (phoneNumber: string) => void;
}

export const OtpVerification: React.FC<OtpVerificationProps> = ({ onVerified }) => {
  const [phoneNumber, setPhoneNumber] = useState('+995');
  const [otpCode, setOtpCode] = useState('');
  const [requestId, setRequestId] = useState('');
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const validatePhoneNumber = (phone: string): boolean => {
    // E.164 format validation
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  };

  const handleSendOtp = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number in E.164 format (e.g., +995555123456)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call your backend API (which uses the OTP SDK)
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        setRequestId(data.data.requestId);
        setStep('verify');
        setResendCountdown(60); // 60 seconds before allowing resend
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length < 4 || otpCode.length > 8) {
      setError('Please enter a valid OTP code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          code: otpCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onVerified(phoneNumber);
      } else {
        setError(data.error || 'Invalid OTP code. Please try again.');
        setOtpCode(''); // Clear the input on error
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId }),
      });

      const data = await response.json();

      if (data.success) {
        setResendCountdown(60);
        setOtpCode('');
        Alert.alert('Success', 'OTP code resent successfully!');
      } else {
        setError(data.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (text: string) => {
    // Keep only digits and '+' symbol
    let formatted = text.replace(/[^\d+]/g, '');
    
    // Ensure it starts with '+'
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted.replace(/\+/g, '');
    }
    
    setPhoneNumber(formatted);
  };

  if (step === 'phone') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Verify Your Phone Number</Text>
          <Text style={styles.subtitle}>
            We'll send you a verification code to confirm your number
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={formatPhoneNumber}
              placeholder="+995555123456"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              autoFocus
              editable={!loading}
            />
            <Text style={styles.hint}>Enter in E.164 format</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Verification Code</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a code to {phoneNumber}
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={[styles.input, styles.otpInput]}
            value={otpCode}
            onChangeText={(text) => setOtpCode(text.replace(/\D/g, ''))}
            placeholder="123456"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            maxLength={8}
            autoFocus
            editable={!loading}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleVerifyOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify Code</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, (loading || resendCountdown > 0) && styles.buttonDisabled]}
          onPress={handleResendOtp}
          disabled={loading || resendCountdown > 0}
        >
          <Text style={styles.secondaryButtonText}>
            {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.textButton}
          onPress={() => {
            setStep('phone');
            setOtpCode('');
            setError('');
          }}
          disabled={loading}
        >
          <Text style={styles.textButtonText}>Change phone number</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 8,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  error: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007aff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#007aff',
    fontSize: 16,
    fontWeight: '600',
  },
  textButton: {
    padding: 12,
    alignItems: 'center',
  },
  textButtonText: {
    color: '#007aff',
    fontSize: 14,
  },
});

// Usage in your app:
// 
// import { OtpVerification } from './components/OtpVerification';
// 
// function App() {
//   return (
//     <OtpVerification
//       onVerified={(phoneNumber) => {
//         console.log('Phone verified:', phoneNumber);
//         // Navigate to dashboard, store auth token, etc.
//       }}
//     />
//   );
// }

