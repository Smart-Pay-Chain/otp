import { OtpClient } from '../src/otp-client';
import { OtpChannel } from '../src/types';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('OtpClient', () => {
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

  describe('constructor', () => {
    it('should create client with valid config', () => {
      expect(client).toBeInstanceOf(OtpClient);
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://otp-service-production-ge.up.railway.app',
          timeout: 30000,
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
          }),
        })
      );
    });

    it('should throw error if API key is missing', () => {
      expect(() => new OtpClient({ apiKey: '' })).toThrow('API key is required');
    });

    it('should use custom baseUrl if provided', () => {
      const customUrl = 'https://custom.api.com';
      new OtpClient({ apiKey: mockApiKey, baseUrl: customUrl });
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: customUrl,
        })
      );
    });
  });

  describe('sendOtp', () => {
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

    it('should send OTP successfully', async () => {
      const result = await client.sendOtp({
        phoneNumber: '+995555123456',
      });

      expect(result).toEqual({
        requestId: 'req_123',
        expiresAt: new Date('2024-12-25T12:00:00Z'),
        status: 'PENDING',
      });

      const callArgs = mockAxiosInstance.post.mock.calls[0];
      expect(callArgs[0]).toBe('/api/v1/otp/send');
      expect(callArgs[1]).toEqual({
        phoneNumber: '+995555123456',
        channel: OtpChannel.SMS,
        ttl: 300,
        length: 6,
        metadata: undefined,
      });
      expect(callArgs[2]?.headers?.['X-Idempotency-Key']).toBeDefined();
    });

    it('should send OTP with custom options', async () => {
      const metadata = { userId: '12345' };
      await client.sendOtp({
        phoneNumber: '+995555123456',
        channel: OtpChannel.WHATSAPP,
        ttl: 600,
        length: 8,
        metadata,
      });

      const callArgs = mockAxiosInstance.post.mock.calls[0];
      expect(callArgs[0]).toBe('/api/v1/otp/send');
      expect(callArgs[1]).toEqual({
        phoneNumber: '+995555123456',
        channel: OtpChannel.WHATSAPP,
        ttl: 600,
        length: 8,
        metadata,
      });
      expect(callArgs[2]?.headers?.['X-Idempotency-Key']).toBeDefined();
    });

    it('should include idempotency key in headers', async () => {
      const idempotencyKey = 'unique-key-123';
      await client.sendOtp({
        phoneNumber: '+995555123456',
        idempotencyKey,
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v1/otp/send', expect.any(Object), {
        headers: { 'X-Idempotency-Key': idempotencyKey },
      });
    });

    it('should validate phone number format', async () => {
      await expect(client.sendOtp({ phoneNumber: '1234567890' })).rejects.toThrow(
        'Invalid phone number format'
      );

      await expect(client.sendOtp({ phoneNumber: '+' })).rejects.toThrow(
        'Invalid phone number format'
      );

      await expect(client.sendOtp({ phoneNumber: '+0555123456' })).rejects.toThrow(
        'Invalid phone number format'
      );
    });

    it('should accept valid E.164 phone numbers', async () => {
      const validNumbers = ['+1234567890', '+995555123456', '+12025551234', '+442071234567'];

      for (const phoneNumber of validNumbers) {
        await client.sendOtp({ phoneNumber });
        expect(mockAxiosInstance.post).toHaveBeenCalled();
      }
    });
  });

  describe('verifyOtp', () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          success: true,
          message: 'OTP verified successfully',
        },
      },
    };

    beforeEach(() => {
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
    });

    it('should verify OTP successfully', async () => {
      const result = await client.verifyOtp({
        requestId: 'req_123',
        code: '123456',
      });

      expect(result).toEqual({
        success: true,
        message: 'OTP verified successfully',
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/otp/verify',
        {
          requestId: 'req_123',
          code: '123456',
          ipAddress: undefined,
          userAgent: undefined,
        },
        undefined
      );
    });

    it('should include optional fields when provided', async () => {
      await client.verifyOtp({
        requestId: 'req_123',
        code: '123456',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/api/v1/otp/verify',
        {
          requestId: 'req_123',
          code: '123456',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        },
        undefined
      );
    });

    it('should validate request ID', async () => {
      await expect(client.verifyOtp({ requestId: '', code: '123456' })).rejects.toThrow(
        'Request ID is required'
      );
    });

    it('should validate code length', async () => {
      await expect(client.verifyOtp({ requestId: 'req_123', code: '123' })).rejects.toThrow(
        'Code must be between 4 and 8 characters'
      );

      await expect(client.verifyOtp({ requestId: 'req_123', code: '123456789' })).rejects.toThrow(
        'Code must be between 4 and 8 characters'
      );
    });
  });

  describe('resendOtp', () => {
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

    it('should resend OTP successfully', async () => {
      const result = await client.resendOtp({
        requestId: 'req_123',
      });

      expect(result).toEqual({
        requestId: 'req_456',
        expiresAt: new Date('2024-12-25T12:05:00Z'),
        status: 'PENDING',
      });

      const callArgs = mockAxiosInstance.post.mock.calls[0];
      expect(callArgs[0]).toBe('/api/v1/otp/req_123/resend');
      expect(callArgs[2]?.headers?.['X-Idempotency-Key']).toBeDefined();
    });

    it('should validate request ID', async () => {
      await expect(client.resendOtp({ requestId: '' })).rejects.toThrow('Request ID is required');
    });
  });
});
