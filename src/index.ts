/**
 * @smartpaychain/otp-sdk
 *
 * Official TypeScript SDK for Smart Pay Chain OTP Verification Service
 *
 * @packageDocumentation
 */

export { OtpClient } from './otp-client';
export { HttpClient } from './http-client';

export {
  OtpError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  OtpNotFoundError,
  OtpExpiredError,
  InvalidOtpError,
  ServiceUnavailableError,
  InsufficientBalanceError,
  BrandNotConfiguredError,
  BrandPendingApprovalError,
  IdempotencyConflictError,
  ApiKeyRevokedError,
} from './errors';

export {
  OtpChannel,
  ErrorCode,
  OtpClientConfig,
  SendOtpOptions,
  SendOtpResponse,
  VerifyOtpOptions,
  VerifyOtpResponse,
  ResendOtpOptions,
  ApiErrorResponse,
  ApiSuccessResponse,
  OtpStatus,
  OtpStatusWithCode,
  SdkConfiguration,
  SdkPlatform,
  SdkLanguage,
  TEST_PHONE_NUMBERS,
  TEST_OTP_CODE,
} from './types';

// Default export
export { OtpClient as default } from './otp-client';

