import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import {
  OtpClientConfig,
  ApiErrorResponse,
  ApiSuccessResponse,
  SdkPlatform,
  SdkLanguage,
} from './types';
import { OtpError } from './errors';

// SDK version - update this with each release
const SDK_VERSION = '2.1.5';

/**
 * Detect the current platform
 */
function detectPlatform(): SdkPlatform {
  try {
    // Check for React Native
    // @ts-ignore - navigator may not exist in Node.js
    if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
      return 'react-native';
    }
  } catch {
    // navigator not available
  }

  try {
    // Check for Node.js
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      return 'node';
    }
  } catch {
    // process not available
  }

  try {
    // Check for browser
    // @ts-ignore - window/document may not exist in Node.js
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      return 'browser';
    }
  } catch {
    // window/document not available
  }

  return 'unknown';
}

/**
 * Detect the current language
 */
function detectLanguage(): SdkLanguage {
  // TypeScript files will have TS in the stack trace in dev mode
  // In production, both are JavaScript
  return 'typescript'; // Default to TypeScript since SDK is TS-first
}

/**
 * HTTP client for making requests to the OTP API
 */
export class HttpClient {
  private client: AxiosInstance;
  private maxRetries: number;
  private platform: SdkPlatform;
  private language: SdkLanguage;

  constructor(config: OtpClientConfig) {
    this.maxRetries = config.maxRetries || 3;
    this.platform = config.platform || detectPlatform();
    this.language = config.language || detectLanguage();

    this.client = axios.create({
      baseURL: config.baseUrl || 'https://otp-service-production-ge.up.railway.app',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
        'X-OTP-SDK-Version': SDK_VERSION,
        'X-OTP-SDK-Platform': this.platform,
        'X-OTP-SDK-Language': this.language,
        ...config.headers,
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.data) {
          const apiError = error.response.data as ApiErrorResponse;
          throw OtpError.fromApiError(apiError);
        }
        throw error;
      }
    );
  }

  /**
   * Make a GET request
   */
  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiSuccessResponse<T>>(path, config);
    return response.data.data;
  }

  /**
   * Make a POST request with retry logic
   */
  async post<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.post<ApiSuccessResponse<T>>(path, data, config);
        return response.data.data;
      } catch (error) {
        lastError = error;

        // Only retry if the error is retryable and we have attempts left
        if (error instanceof OtpError && error.retryable && attempt < this.maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delayMs = Math.pow(2, attempt - 1) * 1000;
          await this.delay(delayMs);
          continue;
        }

        // Non-retryable error or max retries reached
        throw error;
      }
    }

    throw lastError;
  }

  /**
   * Make a PUT request
   */
  async put<T>(path: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiSuccessResponse<T>>(path, data, config);
    return response.data.data;
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<ApiSuccessResponse<T>>(path, config);
    return response.data.data;
  }

  /**
   * Helper method to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
