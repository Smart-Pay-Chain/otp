import { OtpClient } from '../src/otp-client';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Idempotency', () => {
  let client: OtpClient;
  const mockApiKey = 'test-api-key';
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    client = new OtpClient({ apiKey: mockApiKey });
  });

  describe('sendOtp idempotency', () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          requestId: 'req_123',
          expiresAt: '2024-12-25T12:00:00Z',
          status: 'PENDING',
        },
      },
    };

    beforeEach(() => {
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
    });

    it('should auto-generate idempotency key when not provided', async () => {
      await client.sendOtp({
        phoneNumber: '+995555123456',
      });

      const callArgs = mockAxiosInstance.post.mock.calls[0];
      const headers = callArgs[2]?.headers;

      expect(headers).toBeDefined();
      expect(headers?.['X-Idempotency-Key']).toBeDefined();
      expect(typeof headers?.['X-Idempotency-Key']).toBe('string');
    });

    it('should use provided idempotency key', async () => {
      const customKey = 'custom-idempotency-key-123';

      await client.sendOtp({
        phoneNumber: '+995555123456',
        idempotencyKey: customKey,
      });

      const callArgs = mockAxiosInstance.post.mock.calls[0];
      const headers = callArgs[2]?.headers;

      expect(headers?.['X-Idempotency-Key']).toBe(customKey);
    });

    it('should generate unique idempotency keys for different requests', async () => {
      await client.sendOtp({ phoneNumber: '+995555123456' });
      const firstCall = mockAxiosInstance.post.mock.calls[0];
      const firstKey = firstCall[2]?.headers?.['X-Idempotency-Key'];

      // Small delay to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 10));

      await client.sendOtp({ phoneNumber: '+995555123456' });
      const secondCall = mockAxiosInstance.post.mock.calls[1];
      const secondKey = secondCall[2]?.headers?.['X-Idempotency-Key'];

      expect(firstKey).toBeDefined();
      expect(secondKey).toBeDefined();
      expect(firstKey).not.toBe(secondKey);
    });

    it('should generate idempotency key with correct format', async () => {
      await client.sendOtp({ phoneNumber: '+995555123456' });

      const callArgs = mockAxiosInstance.post.mock.calls[0];
      const key = callArgs[2]?.headers?.['X-Idempotency-Key'];

      // Format should be {timestamp}-{random}
      expect(key).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('resendOtp idempotency', () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          requestId: 'req_456',
          expiresAt: '2024-12-25T12:05:00Z',
          status: 'PENDING',
        },
      },
    };

    beforeEach(() => {
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
    });

    it('should auto-generate idempotency key for resend', async () => {
      await client.resendOtp({ requestId: 'req_123' });

      const callArgs = mockAxiosInstance.post.mock.calls[0];
      const headers = callArgs[2]?.headers;

      expect(headers).toBeDefined();
      expect(headers?.['X-Idempotency-Key']).toBeDefined();
      expect(typeof headers?.['X-Idempotency-Key']).toBe('string');
    });

    it('should generate unique keys for multiple resends', async () => {
      await client.resendOtp({ requestId: 'req_123' });
      const firstKey = mockAxiosInstance.post.mock.calls[0][2]?.headers?.['X-Idempotency-Key'];

      await new Promise((resolve) => setTimeout(resolve, 10));

      await client.resendOtp({ requestId: 'req_123' });
      const secondKey = mockAxiosInstance.post.mock.calls[1][2]?.headers?.['X-Idempotency-Key'];

      expect(firstKey).not.toBe(secondKey);
    });
  });

  describe('idempotency conflict handling', () => {
    it('should handle idempotency conflict error', async () => {
      const { OtpError } = require('../src/errors');
      const { ErrorCode } = require('../src/types');

      const otpError = new OtpError(
        'Idempotency key conflict',
        ErrorCode.IDEMPOTENCY_KEY_CONFLICT,
        409,
        false,
        undefined,
        'req_123'
      );

      mockAxiosInstance.post.mockRejectedValue(otpError);

      await expect(
        client.sendOtp({
          phoneNumber: '+995555123456',
          idempotencyKey: 'duplicate-key',
        })
      ).rejects.toMatchObject({
        code: 'IDEMPOTENCY_KEY_CONFLICT',
        statusCode: 409,
        retryable: false,
      });
    });
  });
});

