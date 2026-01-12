/**
 * OTP Channel types
 */
export enum OtpChannel {
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  VOICE = 'VOICE',
}

/**
 * Error codes returned by the API
 */
export enum ErrorCode {
  // Authentication & Authorization
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  API_KEY_REVOKED = 'API_KEY_REVOKED',

  // Phone Number
  INVALID_PHONE_NUMBER = 'INVALID_PHONE_NUMBER',
  PHONE_NUMBER_BLOCKED = 'PHONE_NUMBER_BLOCKED',

  // OTP
  OTP_EXPIRED = 'OTP_EXPIRED',
  OTP_MAX_ATTEMPTS = 'OTP_MAX_ATTEMPTS',
  INVALID_OTP_CODE = 'INVALID_OTP_CODE',
  OTP_NOT_FOUND = 'OTP_NOT_FOUND',
  OTP_ALREADY_VERIFIED = 'OTP_ALREADY_VERIFIED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Billing
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',

  // Brand
  NO_BRAND_CONFIGURED = 'NO_BRAND_CONFIGURED',
  BRAND_NOT_AUTHORIZED = 'BRAND_NOT_AUTHORIZED',
  BRAND_PENDING_APPROVAL = 'BRAND_PENDING_APPROVAL',
  BRAND_CREATION_FAILED = 'BRAND_CREATION_FAILED',

  // SMS Provider
  SMS_SEND_FAILED = 'SMS_SEND_FAILED',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',

  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Server
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Idempotency
  IDEMPOTENCY_KEY_CONFLICT = 'IDEMPOTENCY_KEY_CONFLICT',
}

/**
 * SDK Platform types
 */
export type SdkPlatform = 'node' | 'browser' | 'react-native' | 'unknown';

/**
 * SDK Language types
 */
export type SdkLanguage = 'typescript' | 'javascript';

/**
 * Configuration options for the OTP client
 */
export interface OtpClientConfig {
  /** Your API key for authentication */
  apiKey: string;

  /** Base URL of the OTP service (default: https://otp-service-production-ge.up.railway.app:3000) */
  baseUrl?: string;

  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;

  /** Maximum number of retry attempts for failed requests (default: 3) */
  maxRetries?: number;

  /** Custom headers to include in all requests */
  headers?: Record<string, string>;

  /** SDK platform (auto-detected if not provided) */
  platform?: SdkPlatform;

  /** SDK language (auto-detected if not provided) */
  language?: SdkLanguage;

  /** Auto-fetch configuration from server on initialization (default: false) */
  autoConfig?: boolean;
}

/**
 * Options for sending an OTP
 */
export interface SendOtpOptions {
  /** Phone number in E.164 format (e.g., +995555123456) */
  phoneNumber: string;

  /** Delivery channel (default: SMS) */
  channel?: OtpChannel;

  /** Time-to-live in seconds (60-600, default: 300) */
  ttl?: number;

  /** OTP code length (4-8 digits, default: 6) */
  length?: number;

  /** Custom metadata to attach to the OTP request */
  metadata?: Record<string, any>;

  /** Idempotency key to prevent duplicate requests */
  idempotencyKey?: string;
}

/**
 * Response from sending an OTP
 */
export interface SendOtpResponse {
  /** Unique request ID for this OTP */
  requestId: string;

  /** When the OTP will expire */
  expiresAt: Date;

  /** Current status of the OTP request */
  status: string;
}

/**
 * Options for verifying an OTP
 */
export interface VerifyOtpOptions {
  /** The request ID from sendOtp() */
  requestId: string;

  /** The OTP code to verify */
  code: string;

  /** IP address of the user verifying (optional but recommended) */
  ipAddress?: string;

  /** User agent of the user verifying (optional) */
  userAgent?: string;
}

/**
 * Response from verifying an OTP
 */
export interface VerifyOtpResponse {
  /** Whether verification was successful */
  success: boolean;

  /** Message describing the result */
  message: string;
}

/**
 * Options for resending an OTP
 */
export interface ResendOtpOptions {
  /** The request ID from the original sendOtp() call */
  requestId: string;
}

/**
 * Error response from the API
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    statusCode: number;
    retryable: boolean;
    details?: Record<string, any>;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

/**
 * Success response wrapper
 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
    rateLimit?: {
      limit: number;
      remaining: number;
      reset: number;
    };
  };
}

/**
 * OTP Status response (authenticated endpoint)
 */
export interface OtpStatus {
  /** Request ID */
  id: string;

  /** Phone number (masked) */
  phoneNumber: string;

  /** Delivery channel */
  channel: OtpChannel;

  /** Current status */
  status: 'PENDING' | 'SENT' | 'VERIFIED' | 'EXPIRED' | 'FAILED';

  /** Number of verification attempts */
  attempts: number;

  /** Maximum allowed attempts */
  maxAttempts: number;

  /** When the OTP expires */
  expiresAt: Date;

  /** When the OTP was verified (if verified) */
  verifiedAt: Date | null;

  /** When the OTP was created */
  createdAt: Date;

  /** Whether the OTP is expired */
  isExpired: boolean;
}

/**
 * OTP Status with code response (public endpoint for testing/development)
 * WARNING: Only use this endpoint in development/testing!
 */
export interface OtpStatusWithCode extends OtpStatus {
  /** The actual OTP code (for testing only!) */
  otpCode: string;

  /** SMS provider used */
  smsProvider: string | null;

  /** SMS message ID from provider */
  smsMessageId: string | null;
}

/**
 * SDK Configuration from server
 */
export interface SdkConfiguration {
  /** API version */
  version: string;

  /** OTP configuration */
  otpConfig: {
    /** Default OTP length */
    length: number;
    /** Default TTL in seconds */
    ttl: number;
    /** Maximum verification attempts */
    maxAttempts: number;
  };

  /** Rate limits */
  rateLimits: {
    perPhone: {
      limit: number;
      window: string;
    };
    perAccount: {
      limit: number;
      window: string;
    };
    perIP: {
      limit: number;
      window: string;
    };
  };

  /** Supported countries */
  supportedCountries: string[];

  /** Pricing information */
  pricing: {
    currency: string;
    regions: Record<string, any>;
    defaultPrice: number;
  };

  /** Supported features */
  features: {
    georgianLanguage: boolean;
    customBranding: boolean;
    webhooks: boolean;
    idempotency: boolean;
    testMode: boolean;
    longPolling: boolean;
    batchOperations: boolean;
  };

  /** API endpoints */
  endpoints: {
    base: string;
    docs: string;
    status: string;
  };

  /** Test mode information (if enabled) */
  testMode?: {
    enabled: boolean;
    testPhoneNumbers: string[];
    fixedOtpCode: string;
  };
}

/**
 * Test phone numbers for testing/development
 * Only work when server is in test mode
 */
export const TEST_PHONE_NUMBERS = Object.freeze({
  /** Always succeeds */
  SUCCESS: '+15005550006',
  /** Always fails with SMS send error */
  SMS_FAIL: '+15005550007',
  /** Always fails with rate limit exceeded */
  RATE_LIMIT: '+15005550008',
  /** Always fails with insufficient balance */
  INSUFFICIENT_BALANCE: '+15005550009',
  /** Always fails with brand not authorized */
  BRAND_NOT_AUTH: '+15005550010',
});

/**
 * Fixed OTP code for test mode
 */
export const TEST_OTP_CODE = '123456';
