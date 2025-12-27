import { OtpClient } from '../src/otp-client';
import { TEST_PHONE_NUMBERS, TEST_OTP_CODE } from '../src/types';

describe('Test Mode', () => {
  describe('TEST_PHONE_NUMBERS', () => {
    it('should export test phone numbers', () => {
      expect(TEST_PHONE_NUMBERS.SUCCESS).toBe('+15005550006');
      expect(TEST_PHONE_NUMBERS.SMS_FAIL).toBe('+15005550007');
      expect(TEST_PHONE_NUMBERS.RATE_LIMIT).toBe('+15005550008');
      expect(TEST_PHONE_NUMBERS.INSUFFICIENT_BALANCE).toBe('+15005550009');
      expect(TEST_PHONE_NUMBERS.BRAND_NOT_AUTH).toBe('+15005550010');
    });

    it('should be frozen constants', () => {
      // Test that constants object is frozen
      expect(Object.isFrozen(TEST_PHONE_NUMBERS)).toBe(true);
    });
  });

  describe('TEST_OTP_CODE', () => {
    it('should export fixed test OTP code', () => {
      expect(TEST_OTP_CODE).toBe('123456');
    });

    it('should be a 6-digit string', () => {
      expect(TEST_OTP_CODE).toMatch(/^\d{6}$/);
    });
  });

  describe('Test mode detection', () => {
    it('should have isTestMode method', () => {
      const client = new OtpClient({ apiKey: 'test-key' });
      expect(typeof client.isTestMode).toBe('function');
    });

    it('should have getStatusWithCode method for test mode', () => {
      const client = new OtpClient({ apiKey: 'test-key' });
      expect(typeof client.getStatusWithCode).toBe('function');
    });
  });
});

