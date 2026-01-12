import { OtpClient } from '../src/otp-client';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SDK Configuration', () => {
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

  const mockConfigResponse = {
    data: {
      success: true,
      data: {
        version: '1.0.0',
        otpConfig: {
          length: 6,
          ttl: 300,
          maxAttempts: 3,
        },
        rateLimits: {
          perPhone: { limit: 5, window: '1h' },
          perAccount: { limit: 100, window: '1m' },
          perIP: { limit: 100, window: '1m' },
        },
        supportedCountries: ['GE', 'US', 'GB'],
        pricing: {
          currency: 'USD',
          regions: {},
          defaultPrice: 0.05,
        },
        features: {
          georgianLanguage: true,
          customBranding: true,
          webhooks: true,
          idempotency: true,
          testMode: false,
          longPolling: false,
          batchOperations: false,
        },
        endpoints: {
          base: 'https://otp-service-production-ge.up.railway.app',
          docs: 'https://docs.smartpaychain.com',
          status: 'https://status.smartpaychain.com',
        },
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    mockAxiosInstance.get.mockResolvedValue(mockConfigResponse);
  });

  describe('getConfig', () => {
    it('should fetch SDK configuration successfully', async () => {
      client = new OtpClient({ apiKey: mockApiKey });
      const config = await client.getConfig();

      expect(config).toEqual(mockConfigResponse.data.data);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/sdk/config', undefined);
    });

    it('should cache configuration for 1 hour', async () => {
      client = new OtpClient({ apiKey: mockApiKey });

      // First call
      await client.getConfig();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await client.getConfig();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });

    it('should force refresh when requested', async () => {
      client = new OtpClient({ apiKey: mockApiKey });

      // First call
      await client.getConfig();
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);

      // Force refresh
      await client.getConfig(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(2);
    });

    it('should log warning when test mode is enabled', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: {
            ...mockConfigResponse.data.data,
            features: {
              ...mockConfigResponse.data.data.features,
              testMode: true,
            },
            testMode: {
              enabled: true,
              testPhoneNumbers: ['+15005550006'],
              fixedOtpCode: '123456',
            },
          },
        },
      });

      client = new OtpClient({ apiKey: mockApiKey });
      await client.getConfig();

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('Test mode is enabled');

      consoleWarnSpy.mockRestore();
    });
  });

  describe('testConnection', () => {
    it('should return true when connection is successful', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: {
            success: true,
            message: 'SDK connection successful',
          },
        },
      });

      client = new OtpClient({ apiKey: mockApiKey });
      const result = await client.testConnection();

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/sdk/test', undefined);
    });

    it('should return false when connection fails', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      client = new OtpClient({ apiKey: mockApiKey });
      const result = await client.testConnection();

      expect(result).toBe(false);
    });
  });

  describe('isTestMode', () => {
    it('should return true when test mode is enabled', async () => {
      mockAxiosInstance.get.mockResolvedValue({
        data: {
          success: true,
          data: {
            ...mockConfigResponse.data.data,
            features: {
              ...mockConfigResponse.data.data.features,
              testMode: true,
            },
          },
        },
      });

      client = new OtpClient({ apiKey: mockApiKey });
      const result = await client.isTestMode();

      expect(result).toBe(true);
    });

    it('should return false when test mode is disabled', async () => {
      client = new OtpClient({ apiKey: mockApiKey });
      const result = await client.isTestMode();

      expect(result).toBe(false);
    });

    it('should return false when config fetch fails', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      client = new OtpClient({ apiKey: mockApiKey });
      const result = await client.isTestMode();

      expect(result).toBe(false);
    });
  });

  describe('autoConfig', () => {
    it('should auto-fetch config when autoConfig is true', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      client = new OtpClient({ apiKey: mockApiKey, autoConfig: true });

      // Wait for async config fetch
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Config should have been fetched
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/sdk/config', undefined);

      consoleWarnSpy.mockRestore();
    });

    it('should not auto-fetch config when autoConfig is false', async () => {
      client = new OtpClient({ apiKey: mockApiKey, autoConfig: false });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Config should not have been fetched
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });
  });
});
