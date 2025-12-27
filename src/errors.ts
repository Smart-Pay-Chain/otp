import { ErrorCode, ApiErrorResponse } from './types';

/**
 * Base error class for all OTP SDK errors
 */
export class OtpError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly retryable: boolean;
  public readonly details?: Record<string, any>;
  public readonly requestId?: string;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    retryable: boolean,
    details?: Record<string, any>,
    requestId?: string
  ) {
    super(message);
    this.name = 'OtpError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.details = details;
    this.requestId = requestId;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create an OtpError from an API error response
   */
  static fromApiError(response: ApiErrorResponse): OtpError {
    return new OtpError(
      response.error.message,
      response.error.code,
      response.error.statusCode,
      response.error.retryable,
      response.error.details,
      response.meta.requestId
    );
  }

  /**
   * Convert error to a plain object
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      retryable: this.retryable,
      details: this.details,
      requestId: this.requestId,
    };
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends OtpError {
  constructor(message: string, requestId?: string) {
    super(message, ErrorCode.AUTHENTICATION_FAILED, 401, false, undefined, requestId);
    this.name = 'AuthenticationError';
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends OtpError {
  constructor(message: string, details?: Record<string, any>, requestId?: string) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, false, details, requestId);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when rate limit is exceeded
 */
export class RateLimitError extends OtpError {
  constructor(message: string, requestId?: string) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, true, undefined, requestId);
    this.name = 'RateLimitError';
  }
}

/**
 * Error thrown when OTP is not found
 */
export class OtpNotFoundError extends OtpError {
  constructor(message: string, requestId?: string) {
    super(message, ErrorCode.OTP_NOT_FOUND, 404, false, undefined, requestId);
    this.name = 'OtpNotFoundError';
  }
}

/**
 * Error thrown when OTP has expired
 */
export class OtpExpiredError extends OtpError {
  constructor(message: string, requestId?: string) {
    super(message, ErrorCode.OTP_EXPIRED, 400, false, undefined, requestId);
    this.name = 'OtpExpiredError';
  }
}

/**
 * Error thrown when OTP code is invalid
 */
export class InvalidOtpError extends OtpError {
  constructor(message: string, requestId?: string) {
    super(message, ErrorCode.INVALID_OTP_CODE, 400, false, undefined, requestId);
    this.name = 'InvalidOtpError';
  }
}

/**
 * Error thrown when service is unavailable
 */
export class ServiceUnavailableError extends OtpError {
  constructor(message: string, requestId?: string) {
    super(message, ErrorCode.SERVICE_UNAVAILABLE, 503, true, undefined, requestId);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Error thrown when account has insufficient balance
 */
export class InsufficientBalanceError extends OtpError {
  constructor(message: string, requestId?: string) {
    super(message, ErrorCode.INSUFFICIENT_BALANCE, 402, false, undefined, requestId);
    this.name = 'InsufficientBalanceError';
  }
}

/**
 * Error thrown when brand is not configured (Georgian numbers)
 */
export class BrandNotConfiguredError extends OtpError {
  constructor(message: string, requestId?: string) {
    super(message, ErrorCode.NO_BRAND_CONFIGURED, 400, false, undefined, requestId);
    this.name = 'BrandNotConfiguredError';
  }
}

/**
 * Error thrown when brand is pending approval (Georgian numbers)
 */
export class BrandPendingApprovalError extends OtpError {
  constructor(message: string, requestId?: string) {
    super(message, ErrorCode.BRAND_PENDING_APPROVAL, 403, false, undefined, requestId);
    this.name = 'BrandPendingApprovalError';
  }
}

/**
 * Error thrown when idempotency key conflict occurs
 */
export class IdempotencyConflictError extends OtpError {
  constructor(message: string, requestId?: string) {
    super(message, ErrorCode.IDEMPOTENCY_KEY_CONFLICT, 409, false, undefined, requestId);
    this.name = 'IdempotencyConflictError';
  }
}

/**
 * Error thrown when API key has been revoked
 */
export class ApiKeyRevokedError extends OtpError {
  constructor(message: string, requestId?: string) {
    super(message, ErrorCode.API_KEY_REVOKED, 401, false, undefined, requestId);
    this.name = 'ApiKeyRevokedError';
  }
}

