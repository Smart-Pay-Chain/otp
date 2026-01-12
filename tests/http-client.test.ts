import axios from 'axios';
import { HttpClient } from '../src/http-client';
import { OtpError } from '../src/errors';
import { ErrorCode, ApiErrorResponse } from '../src/types';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HttpClient', () => {
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
  });

  describe('constructor', () => {
    it('should create axios instance with default config', () => {
      new HttpClient({ apiKey: 'test-key' });

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://otp-service-production-ge.up.railway.app',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-key',
          'X-OTP-SDK-Version': '2.1.6',
          'X-OTP-SDK-Platform': 'node',
          'X-OTP-SDK-Language': 'typescript',
        },
      });
    });

    it('should create axios instance with custom config', () => {
      new HttpClient({
        apiKey: 'test-key',
        baseUrl: 'https://custom.com',
        timeout: 60000,
        maxRetries: 5,
        headers: { 'X-Custom': 'value' },
      });

      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://custom.com',
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-key',
          'X-OTP-SDK-Version': '2.1.6',
          'X-OTP-SDK-Platform': 'node',
          'X-OTP-SDK-Language': 'typescript',
          'X-Custom': 'value',
        },
      });
    });
  });

  describe('get', () => {
    it('should make GET request and return data', async () => {
      const mockResponse = {
        data: { success: true, data: { id: '123' } },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const client = new HttpClient({ apiKey: 'test-key' });
      const result = await client.get('/test');

      expect(result).toEqual({ id: '123' });
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
    });
  });

  describe('post', () => {
    it('should make POST request and return data', async () => {
      const mockResponse = {
        data: { success: true, data: { id: '123' } },
      };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const client = new HttpClient({ apiKey: 'test-key' });
      const result = await client.post('/test', { name: 'test' });

      expect(result).toEqual({ id: '123' });
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', { name: 'test' }, undefined);
    });

    it('should throw OtpError on API error', async () => {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          statusCode: 400,
          retryable: false,
        },
        meta: {
          requestId: 'req_123',
          timestamp: '2024-12-25T12:00:00Z',
        },
      };

      const otpError = OtpError.fromApiError(errorResponse);
      const client = new HttpClient({ apiKey: 'test-key', maxRetries: 3 });

      mockAxiosInstance.post.mockRejectedValue(otpError);

      await expect(client.post('/test', {})).rejects.toThrow(OtpError);
      await expect(client.post('/test', {})).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400,
        retryable: false,
      });
    });

    it('should retry on retryable errors', async () => {
      const retryableError = new OtpError(
        'Service unavailable',
        ErrorCode.SERVICE_UNAVAILABLE,
        503,
        true
      );

      const client = new HttpClient({ apiKey: 'test-key', maxRetries: 3 });

      // Fail twice, then succeed
      mockAxiosInstance.post
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce({
          data: { success: true, data: { id: '123' } },
        });

      const result = await client.post('/test', {});

      expect(result).toEqual({ id: '123' });
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const nonRetryableError = new OtpError(
        'Validation failed',
        ErrorCode.VALIDATION_ERROR,
        400,
        false
      );

      const client = new HttpClient({ apiKey: 'test-key', maxRetries: 3 });

      mockAxiosInstance.post.mockRejectedValue(nonRetryableError);

      await expect(client.post('/test', {})).rejects.toThrow(OtpError);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1); // No retries
    });

    it('should throw after max retries', async () => {
      const retryableError = new OtpError(
        'Service unavailable',
        ErrorCode.SERVICE_UNAVAILABLE,
        503,
        true
      );

      const client = new HttpClient({ apiKey: 'test-key', maxRetries: 2 });

      mockAxiosInstance.post.mockRejectedValue(retryableError);

      await expect(client.post('/test', {})).rejects.toThrow(OtpError);
      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2); // Max retries
    });
  });

  describe('put', () => {
    it('should make PUT request and return data', async () => {
      const mockResponse = {
        data: { success: true, data: { id: '123' } },
      };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const client = new HttpClient({ apiKey: 'test-key' });
      const result = await client.put('/test', { name: 'test' });

      expect(result).toEqual({ id: '123' });
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test', { name: 'test' }, undefined);
    });
  });

  describe('delete', () => {
    it('should make DELETE request and return data', async () => {
      const mockResponse = {
        data: { success: true, data: { id: '123' } },
      };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const client = new HttpClient({ apiKey: 'test-key' });
      const result = await client.delete('/test');

      expect(result).toEqual({ id: '123' });
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test', undefined);
    });
  });

  describe('response interceptor', () => {
    it('should transform API errors to OtpError', () => {
      new HttpClient({ apiKey: 'test-key' });

      // Get the response interceptor error handler
      const responseInterceptor = mockAxiosInstance.interceptors.response.use;
      expect(responseInterceptor).toHaveBeenCalled();

      const [successHandler, errorHandler] = responseInterceptor.mock.calls[0];

      // Test success handler - should pass through
      const mockResponse = { data: 'test' };
      expect(successHandler(mockResponse)).toBe(mockResponse);

      // Test error handler - should transform to OtpError
      const apiError: ApiErrorResponse = {
        success: false,
        error: {
          code: ErrorCode.OTP_EXPIRED,
          message: 'OTP expired',
          statusCode: 400,
          retryable: false,
        },
        meta: {
          requestId: 'req_123',
          timestamp: '2024-12-25T12:00:00Z',
        },
      };

      const axiosError = {
        response: { data: apiError },
        isAxiosError: true,
      };

      expect(() => errorHandler(axiosError)).toThrow(OtpError);
    });

    it('should re-throw non-API errors', () => {
      new HttpClient({ apiKey: 'test-key' });

      const responseInterceptor = mockAxiosInstance.interceptors.response.use;
      const [, errorHandler] = responseInterceptor.mock.calls[0];

      const networkError = new Error('Network error');

      expect(() => errorHandler(networkError)).toThrow('Network error');
    });
  });
});
