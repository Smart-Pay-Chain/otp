import { HttpClient } from './http-client';
import {
  OtpClientConfig,
  SendOtpOptions,
  SendOtpResponse,
  VerifyOtpOptions,
  VerifyOtpResponse,
  ResendOtpOptions,
  OtpChannel,
  OtpStatus,
  OtpStatusWithCode,
  SdkConfiguration,
} from './types';

/**
 * Main OTP client for interacting with the OTP verification service
 *
 * @example
 * ```typescript
 * const client = new OtpClient({ apiKey: 'your-api-key' });
 *
 * // Send an OTP
 * const result = await client.sendOtp({
 *   phoneNumber: '+995555123456',
 *   channel: OtpChannel.SMS,
 * });
 *
 * // Verify the OTP
 * const verification = await client.verifyOtp({
 *   requestId: result.requestId,
 *   code: '123456',
 * });
 * ```
 */
export class OtpClient {
  private http: HttpClient;
  private serverConfig: SdkConfiguration | null = null;
  private serverConfigFetchedAt: number | null = null;
  private readonly CONFIG_CACHE_TTL = 3600000; // 1 hour in milliseconds

  /**
   * Create a new OTP client
   *
   * @param config - Configuration options
   */
  constructor(config: OtpClientConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    this.http = new HttpClient(config);

    // Auto-fetch configuration if requested
    if (config.autoConfig) {
      this.getConfig().catch((error) => {
        // Silent fail for auto-config, log warning
        console.warn('Failed to auto-fetch SDK configuration:', error.message);
      });
    }
  }

  /**
   * Send an OTP to a phone number
   *
   * @param options - Options for sending the OTP
   * @returns Promise resolving to the OTP request details
   *
   * @example
   * ```typescript
   * const result = await client.sendOtp({
   *   phoneNumber: '+995555123456',
   *   channel: OtpChannel.SMS,
   *   ttl: 300,
   *   length: 6,
   *   metadata: { userId: '12345' }
   * });
   *
   * console.log(result.requestId); // Save this for verification
   * console.log(result.expiresAt);
   * ```
   */
  async sendOtp(options: SendOtpOptions): Promise<SendOtpResponse> {
    this.validatePhoneNumber(options.phoneNumber);

    const body = {
      phoneNumber: options.phoneNumber,
      channel: options.channel || OtpChannel.SMS,
      ttl: options.ttl || 300,
      length: options.length || 6,
      metadata: options.metadata,
    };

    const headers: Record<string, string> = {};
    // Auto-generate idempotency key if not provided
    headers['X-Idempotency-Key'] = options.idempotencyKey || this.generateIdempotencyKey();

    const response = await this.http.post<SendOtpResponse>('/api/v1/otp/send', body, {
      headers,
    });

    // Convert string date to Date object
    return {
      ...response,
      expiresAt: new Date(response.expiresAt),
    };
  }

  /**
   * Verify an OTP code
   *
   * @param options - Options for verifying the OTP
   * @returns Promise resolving to the verification result
   *
   * @example
   * ```typescript
   * const result = await client.verifyOtp({
   *   requestId: 'req_123456',
   *   code: '123456',
   *   ipAddress: '192.168.1.1',
   *   userAgent: 'Mozilla/5.0...'
   * });
   *
   * if (result.success) {
   *   console.log('OTP verified successfully!');
   * }
   * ```
   */
  async verifyOtp(options: VerifyOtpOptions): Promise<VerifyOtpResponse> {
    if (!options.requestId) {
      throw new Error('Request ID is required');
    }

    if (!options.code || options.code.length < 4 || options.code.length > 8) {
      throw new Error('Code must be between 4 and 8 characters');
    }

    const body = {
      requestId: options.requestId,
      code: options.code,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
    };

    return await this.http.post<VerifyOtpResponse>('/api/v1/otp/verify', body);
  }

  /**
   * Resend an OTP (generates a new code for the same phone number)
   *
   * @param options - Options for resending the OTP
   * @returns Promise resolving to the new OTP request details
   *
   * @example
   * ```typescript
   * const result = await client.resendOtp({
   *   requestId: 'req_123456'
   * });
   *
   * console.log('New OTP sent:', result.requestId);
   * ```
   */
  async resendOtp(options: ResendOtpOptions): Promise<SendOtpResponse> {
    if (!options.requestId) {
      throw new Error('Request ID is required');
    }

    // Auto-generate idempotency key for resend operations
    const headers: Record<string, string> = {
      'X-Idempotency-Key': this.generateIdempotencyKey(),
    };

    const response = await this.http.post<SendOtpResponse>(
      `/api/v1/otp/${options.requestId}/resend`,
      undefined,
      { headers }
    );

    // Convert string date to Date object
    return {
      ...response,
      expiresAt: new Date(response.expiresAt),
    };
  }

  /**
   * Get OTP status (authenticated endpoint)
   *
   * @param requestId - The request ID from sendOtp()
   * @returns Promise resolving to the OTP status
   *
   * @example
   * ```typescript
   * const status = await client.getStatus('req_123456');
   * console.log(status.status); // 'PENDING' | 'SENT' | 'VERIFIED' | 'EXPIRED' | 'FAILED'
   * console.log(status.attempts); // Number of verification attempts
   * console.log(status.isExpired); // Whether OTP is expired
   * ```
   */
  async getStatus(requestId: string): Promise<OtpStatus> {
    if (!requestId) {
      throw new Error('Request ID is required');
    }

    const response = await this.http.get<OtpStatus>(`/api/v1/otp/${requestId}`);

    // Convert string dates to Date objects
    return {
      ...response,
      expiresAt: new Date(response.expiresAt),
      verifiedAt: response.verifiedAt ? new Date(response.verifiedAt) : null,
      createdAt: new Date(response.createdAt),
    };
  }

  /**
   * Get OTP status with code (public endpoint for testing/development)
   * 
   * ⚠️ WARNING: This endpoint returns the actual OTP code and should ONLY be used
   * in development/testing environments! Never use in production client code.
   * 
   * This method polls for up to 30 seconds waiting for SMS delivery.
   *
   * @param requestId - The request ID from sendOtp()
   * @returns Promise resolving to the OTP status with code
   *
   * @example
   * ```typescript
   * // For automated testing only!
   * const status = await client.getStatusWithCode('req_123456');
   * console.log(status.otpCode); // The actual OTP code
   * console.log(status.smsProvider); // Which provider was used
   * ```
   */
  async getStatusWithCode(requestId: string): Promise<OtpStatusWithCode> {
    if (!requestId) {
      throw new Error('Request ID is required');
    }

    const response = await this.http.get<OtpStatusWithCode>(
      `/api/v1/otp/${requestId}/status`
    );

    // Convert string dates to Date objects
    return {
      ...response,
      expiresAt: new Date(response.expiresAt),
      verifiedAt: response.verifiedAt ? new Date(response.verifiedAt) : null,
      createdAt: new Date(response.createdAt),
    };
  }

  /**
   * Get SDK configuration from server
   * 
   * Fetches and caches configuration from the server. The configuration includes
   * rate limits, supported features, test mode status, and more. Results are
   * cached for 1 hour.
   *
   * @param forceRefresh - Force refresh the cached configuration
   * @returns Promise resolving to the SDK configuration
   *
   * @example
   * ```typescript
   * const config = await client.getConfig();
   * console.log(config.features.testMode); // Check if test mode is enabled
   * console.log(config.otpConfig.length); // Default OTP length
   * console.log(config.rateLimits); // Rate limit information
   * ```
   */
  async getConfig(forceRefresh = false): Promise<SdkConfiguration> {
    // Return cached config if valid
    if (
      !forceRefresh &&
      this.serverConfig &&
      this.serverConfigFetchedAt &&
      Date.now() - this.serverConfigFetchedAt < this.CONFIG_CACHE_TTL
    ) {
      return this.serverConfig;
    }

    // Fetch new configuration
    const config = await this.http.get<SdkConfiguration>('/api/v1/sdk/config');

    // Cache the configuration
    this.serverConfig = config;
    this.serverConfigFetchedAt = Date.now();

    // Log warning if test mode is enabled
    if (config.features.testMode) {
      console.warn(
        '⚠️  Test mode is enabled on the server. Use test phone numbers for testing:',
        config.testMode?.testPhoneNumbers
      );
    }

    return config;
  }

  /**
   * Test connectivity to the OTP service
   *
   * @returns Promise resolving to true if connection is successful
   *
   * @example
   * ```typescript
   * const isConnected = await client.testConnection();
   * if (isConnected) {
   *   console.log('✓ Connected to OTP service');
   * }
   * ```
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.http.get<{ success: boolean; message: string }>('/api/v1/sdk/test');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if server is in test mode
   * 
   * @returns Promise resolving to true if test mode is enabled
   *
   * @example
   * ```typescript
   * const testMode = await client.isTestMode();
   * if (testMode) {
   *   console.log('Server is in test mode - use test phone numbers');
   * }
   * ```
   */
  async isTestMode(): Promise<boolean> {
    try {
      const config = await this.getConfig();
      return config.features.testMode || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a unique idempotency key
   * 
   * @returns A unique idempotency key in the format `{timestamp}-{random}`
   */
  private generateIdempotencyKey(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${random}`;
  }

  /**
   * Validate phone number format (E.164)
   */
  private validatePhoneNumber(phoneNumber: string): void {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(phoneNumber)) {
      throw new Error(
        'Invalid phone number format. Must be in E.164 format (e.g., +995555123456)'
      );
    }
  }
}

