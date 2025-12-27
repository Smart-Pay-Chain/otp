import { OtpClient } from '../src/otp-client';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Status Endpoints', () => {
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

  describe('getStatus', () => {
    const mockStatusResponse = {
      data: {
        success: true,
        data: {
          id: 'req_123',
          phoneNumber: '+9955***56',
          channel: 'SMS',
          status: 'SENT',
          attempts: 0,
          maxAttempts: 3,
          expiresAt: '2024-12-25T12:00:00Z',
          verifiedAt: null,
          createdAt: '2024-12-25T11:55:00Z',
          isExpired: false,
        },
      },
    };

    beforeEach(() => {
      mockAxiosInstance.get.mockResolvedValue(mockStatusResponse);
    });

    it('should get OTP status successfully', async () => {
      const result = await client.getStatus('req_123');

      expect(result).toEqual({
        id: 'req_123',
        phoneNumber: '+9955***56',
        channel: 'SMS',
        status: 'SENT',
        attempts: 0,
        maxAttempts: 3,
        expiresAt: new Date('2024-12-25T12:00:00Z'),
        verifiedAt: null,
        createdAt: new Date('2024-12-25T11:55:00Z'),
        isExpired: false,
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/otp/req_123', undefined);
    });

    it('should convert date strings to Date objects', async () => {
      const result = await client.getStatus('req_123');

      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.verifiedAt).toBeNull();
    });

    it('should handle verified status with verifiedAt date', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: {
            ...mockStatusResponse.data.data,
            status: 'VERIFIED',
            verifiedAt: '2024-12-25T12:01:00Z',
          },
        },
      });

      const result = await client.getStatus('req_123');

      expect(result.status).toBe('VERIFIED');
      expect(result.verifiedAt).toBeInstanceOf(Date);
      expect(result.verifiedAt).toEqual(new Date('2024-12-25T12:01:00Z'));
    });

    it('should throw error if requestId is empty', async () => {
      await expect(client.getStatus('')).rejects.toThrow('Request ID is required');
    });
  });

  describe('getStatusWithCode', () => {
    const mockStatusWithCodeResponse = {
      data: {
        success: true,
        data: {
          id: 'req_123',
          phoneNumber: '+9955***56',
          channel: 'SMS',
          status: 'SENT',
          attempts: 0,
          maxAttempts: 3,
          expiresAt: '2024-12-25T12:00:00Z',
          verifiedAt: null,
          createdAt: '2024-12-25T11:55:00Z',
          isExpired: false,
          otpCode: '123456',
          smsProvider: 'Ubill',
          smsMessageId: 'msg_789',
        },
      },
    };

    beforeEach(() => {
      mockAxiosInstance.get.mockResolvedValue(mockStatusWithCodeResponse);
    });

    it('should get OTP status with code successfully', async () => {
      const result = await client.getStatusWithCode('req_123');

      expect(result).toMatchObject({
        id: 'req_123',
        otpCode: '123456',
        smsProvider: 'Ubill',
        smsMessageId: 'msg_789',
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/otp/req_123/status', undefined);
    });

    it('should include all status fields plus additional fields', async () => {
      const result = await client.getStatusWithCode('req_123');

      // Standard status fields
      expect(result.id).toBeDefined();
      expect(result.phoneNumber).toBeDefined();
      expect(result.status).toBeDefined();

      // Additional fields
      expect(result.otpCode).toBe('123456');
      expect(result.smsProvider).toBe('Ubill');
      expect(result.smsMessageId).toBe('msg_789');
    });

    it('should throw error if requestId is empty', async () => {
      await expect(client.getStatusWithCode('')).rejects.toThrow('Request ID is required');
    });
  });
});

