import {
  OtpError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  OtpNotFoundError,
  OtpExpiredError,
  InvalidOtpError,
  ServiceUnavailableError,
  InsufficientBalanceError,
} from '../src/errors';
import { ErrorCode, ApiErrorResponse } from '../src/types';

describe('Error Classes', () => {
  describe('OtpError', () => {
    it('should create error with all properties', () => {
      const error = new OtpError(
        'Test error',
        ErrorCode.VALIDATION_ERROR,
        400,
        false,
        { field: 'phoneNumber' },
        'req_123'
      );

      expect(error.message).toBe('Test error');
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
      expect(error.details).toEqual({ field: 'phoneNumber' });
      expect(error.requestId).toBe('req_123');
      expect(error.name).toBe('OtpError');
    });

    it('should create error from API response', () => {
      const apiError: ApiErrorResponse = {
        success: false,
        error: {
          code: ErrorCode.OTP_EXPIRED,
          message: 'OTP has expired',
          statusCode: 400,
          retryable: false,
        },
        meta: {
          requestId: 'req_456',
          timestamp: '2024-12-25T12:00:00Z',
        },
      };

      const error = OtpError.fromApiError(apiError);

      expect(error.message).toBe('OTP has expired');
      expect(error.code).toBe(ErrorCode.OTP_EXPIRED);
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
      expect(error.requestId).toBe('req_456');
    });

    it('should convert to JSON', () => {
      const error = new OtpError(
        'Test error',
        ErrorCode.VALIDATION_ERROR,
        400,
        false,
        { field: 'phoneNumber' },
        'req_123'
      );

      const json = error.toJSON();

      expect(json).toEqual({
        name: 'OtpError',
        message: 'Test error',
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400,
        retryable: false,
        details: { field: 'phoneNumber' },
        requestId: 'req_123',
      });
    });
  });

  describe('AuthenticationError', () => {
    it('should create with correct properties', () => {
      const error = new AuthenticationError('Invalid API key', 'req_123');

      expect(error.message).toBe('Invalid API key');
      expect(error.code).toBe(ErrorCode.AUTHENTICATION_FAILED);
      expect(error.statusCode).toBe(401);
      expect(error.retryable).toBe(false);
      expect(error.requestId).toBe('req_123');
      expect(error.name).toBe('AuthenticationError');
    });
  });

  describe('ValidationError', () => {
    it('should create with correct properties', () => {
      const details = { field: 'phoneNumber', reason: 'Invalid format' };
      const error = new ValidationError('Validation failed', details, 'req_123');

      expect(error.message).toBe('Validation failed');
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
      expect(error.details).toEqual(details);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('RateLimitError', () => {
    it('should create with correct properties', () => {
      const error = new RateLimitError('Rate limit exceeded', 'req_123');

      expect(error.message).toBe('Rate limit exceeded');
      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.statusCode).toBe(429);
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('RateLimitError');
    });
  });

  describe('OtpNotFoundError', () => {
    it('should create with correct properties', () => {
      const error = new OtpNotFoundError('OTP not found', 'req_123');

      expect(error.message).toBe('OTP not found');
      expect(error.code).toBe(ErrorCode.OTP_NOT_FOUND);
      expect(error.statusCode).toBe(404);
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('OtpNotFoundError');
    });
  });

  describe('OtpExpiredError', () => {
    it('should create with correct properties', () => {
      const error = new OtpExpiredError('OTP has expired', 'req_123');

      expect(error.message).toBe('OTP has expired');
      expect(error.code).toBe(ErrorCode.OTP_EXPIRED);
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('OtpExpiredError');
    });
  });

  describe('InvalidOtpError', () => {
    it('should create with correct properties', () => {
      const error = new InvalidOtpError('Invalid OTP code', 'req_123');

      expect(error.message).toBe('Invalid OTP code');
      expect(error.code).toBe(ErrorCode.INVALID_OTP_CODE);
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('InvalidOtpError');
    });
  });

  describe('ServiceUnavailableError', () => {
    it('should create with correct properties', () => {
      const error = new ServiceUnavailableError('Service unavailable', 'req_123');

      expect(error.message).toBe('Service unavailable');
      expect(error.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
      expect(error.statusCode).toBe(503);
      expect(error.retryable).toBe(true);
      expect(error.name).toBe('ServiceUnavailableError');
    });
  });

  describe('InsufficientBalanceError', () => {
    it('should create with correct properties', () => {
      const error = new InsufficientBalanceError('Insufficient balance', 'req_123');

      expect(error.message).toBe('Insufficient balance');
      expect(error.code).toBe(ErrorCode.INSUFFICIENT_BALANCE);
      expect(error.statusCode).toBe(402);
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('InsufficientBalanceError');
    });
  });

  describe('BrandNotConfiguredError', () => {
    it('should create with correct properties', () => {
      const { BrandNotConfiguredError } = require('../src/errors');
      const error = new BrandNotConfiguredError('Brand not configured', 'req_123');

      expect(error.message).toBe('Brand not configured');
      expect(error.code).toBe(ErrorCode.NO_BRAND_CONFIGURED);
      expect(error.statusCode).toBe(400);
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('BrandNotConfiguredError');
    });
  });

  describe('BrandPendingApprovalError', () => {
    it('should create with correct properties', () => {
      const { BrandPendingApprovalError } = require('../src/errors');
      const error = new BrandPendingApprovalError('Brand pending approval', 'req_123');

      expect(error.message).toBe('Brand pending approval');
      expect(error.code).toBe(ErrorCode.BRAND_PENDING_APPROVAL);
      expect(error.statusCode).toBe(403);
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('BrandPendingApprovalError');
    });
  });

  describe('IdempotencyConflictError', () => {
    it('should create with correct properties', () => {
      const { IdempotencyConflictError } = require('../src/errors');
      const error = new IdempotencyConflictError('Idempotency conflict', 'req_123');

      expect(error.message).toBe('Idempotency conflict');
      expect(error.code).toBe(ErrorCode.IDEMPOTENCY_KEY_CONFLICT);
      expect(error.statusCode).toBe(409);
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('IdempotencyConflictError');
    });
  });

  describe('ApiKeyRevokedError', () => {
    it('should create with correct properties', () => {
      const { ApiKeyRevokedError } = require('../src/errors');
      const error = new ApiKeyRevokedError('API key revoked', 'req_123');

      expect(error.message).toBe('API key revoked');
      expect(error.code).toBe(ErrorCode.API_KEY_REVOKED);
      expect(error.statusCode).toBe(401);
      expect(error.retryable).toBe(false);
      expect(error.name).toBe('ApiKeyRevokedError');
    });
  });
});
