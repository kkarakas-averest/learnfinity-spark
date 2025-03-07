/**
 * Centralized error handling utilities for the application
 */

// Common error types
export interface AppError extends Error {
  code?: string;
  status?: number;
  context?: Record<string, unknown>;
}

export enum ErrorCode {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = 'auth/invalid-credentials',
  AUTH_USER_NOT_FOUND = 'auth/user-not-found',
  AUTH_WRONG_PASSWORD = 'auth/wrong-password',
  AUTH_EMAIL_ALREADY_IN_USE = 'auth/email-already-in-use',
  AUTH_WEAK_PASSWORD = 'auth/weak-password',
  AUTH_EXPIRED_SESSION = 'auth/expired-session',
  
  // Database errors
  DB_CONNECTION_ERROR = 'db/connection-error',
  DB_QUERY_ERROR = 'db/query-error',
  DB_RECORD_NOT_FOUND = 'db/record-not-found',
  DB_DUPLICATE_ENTRY = 'db/duplicate-entry',
  
  // Network errors
  NETWORK_OFFLINE = 'network/offline',
  NETWORK_REQUEST_FAILED = 'network/request-failed',
  NETWORK_TIMEOUT = 'network/timeout',
  
  // Validation errors
  VALIDATION_ERROR = 'validation/error',
  INVALID_INPUT = 'validation/invalid-input',
  
  // Unknown error
  UNKNOWN_ERROR = 'unknown/error'
}

/**
 * Create an error with additional metadata
 */
export function createError(
  message: string,
  code: string = ErrorCode.UNKNOWN_ERROR,
  status: number = 500,
  context?: Record<string, unknown>
): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.status = status;
  error.context = context;
  return error;
}

/**
 * Handle an error by logging it and returning a normalized AppError
 */
export function handleError(error: unknown, defaultMessage: string = 'An unexpected error occurred'): AppError {
  // Log the error
  console.error('Error caught by error handler:', error);
  
  // If it's already an AppError, return it
  if (error instanceof Error && 'code' in error) {
    return error as AppError;
  }
  
  // If it's a regular Error, convert it to an AppError
  if (error instanceof Error) {
    return createError(error.message || defaultMessage);
  }
  
  // For everything else, create a generic error
  return createError(
    typeof error === 'string' ? error : defaultMessage,
    ErrorCode.UNKNOWN_ERROR,
    500,
    { originalError: error }
  );
}

/**
 * Get a user-friendly error message based on the error
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (!error) {
    return 'An unexpected error occurred';
  }
  
  const appError = error instanceof Error && 'code' in error 
    ? error as AppError 
    : handleError(error);
  
  // Return custom messages based on error code
  switch (appError.code) {
    // Auth errors
    case ErrorCode.AUTH_INVALID_CREDENTIALS:
    case ErrorCode.AUTH_WRONG_PASSWORD:
      return 'Invalid email or password. Please try again.';
    
    case ErrorCode.AUTH_USER_NOT_FOUND:
      return 'No account found with this email address.';
    
    case ErrorCode.AUTH_EMAIL_ALREADY_IN_USE:
      return 'An account with this email already exists.';
    
    case ErrorCode.AUTH_WEAK_PASSWORD:
      return 'Password is too weak. Please use a stronger password.';
    
    case ErrorCode.AUTH_EXPIRED_SESSION:
      return 'Your session has expired. Please log in again.';
    
    // Database errors
    case ErrorCode.DB_CONNECTION_ERROR:
      return 'Unable to connect to the database. Please try again later.';
    
    case ErrorCode.DB_RECORD_NOT_FOUND:
      return 'The requested information could not be found.';
    
    case ErrorCode.DB_DUPLICATE_ENTRY:
      return 'This information already exists in our system.';
    
    // Network errors
    case ErrorCode.NETWORK_OFFLINE:
      return 'You appear to be offline. Please check your internet connection.';
    
    case ErrorCode.NETWORK_REQUEST_FAILED:
    case ErrorCode.NETWORK_TIMEOUT:
      return 'Network request failed. Please check your connection and try again.';
    
    // Validation errors
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_INPUT:
      return appError.message || 'Please check your input and try again.';
    
    // Default case
    default:
      return appError.message || 'An unexpected error occurred. Please try again later.';
  }
}

/**
 * Check if an error is of a specific type
 */
export function isErrorOfType(error: unknown, code: ErrorCode): boolean {
  if (error instanceof Error && 'code' in error) {
    return (error as AppError).code === code;
  }
  return false;
}

/**
 * Parse Supabase errors into AppErrors
 */
export function parseSupabaseError(error: any): AppError {
  if (!error) {
    return createError('Unknown Supabase error');
  }
  
  // Default values
  let message = error.message || 'Database operation failed';
  let code = ErrorCode.DB_QUERY_ERROR;
  let status = error.status || 500;
  
  // Handle authentication errors
  if (error.code === 'auth/invalid-email' || error.code === 'auth/wrong-password') {
    code = ErrorCode.AUTH_INVALID_CREDENTIALS;
    message = 'Invalid email or password';
    status = 401;
  } else if (error.code === 'auth/user-not-found') {
    code = ErrorCode.AUTH_USER_NOT_FOUND;
    message = 'User not found';
    status = 404;
  } else if (error.code === 'auth/email-already-in-use') {
    code = ErrorCode.AUTH_EMAIL_ALREADY_IN_USE;
    message = 'Email already in use';
    status = 409;
  }
  
  // Handle database errors
  if (error.code === '23505') {
    code = ErrorCode.DB_DUPLICATE_ENTRY;
    message = 'Duplicate entry found';
    status = 409;
  } else if (error.code === '42P01') {
    message = 'Database table not found';
    status = 500;
  }
  
  return createError(message, code, status, { originalError: error });
}

/**
 * Catch async errors in a standardized way
 * 
 * Usage example:
 * const fetchData = catchAsync(async () => {
 *   // async code that might throw
 *   return data;
 * });
 */
export function catchAsync<T>(fn: () => Promise<T>): Promise<T> {
  return fn().catch(error => {
    throw handleError(error);
  });
}

/**
 * Create a try-catch wrapper for async functions
 * 
 * Usage example:
 * const { data, error } = await tryCatch(fetchData);
 */
export async function tryCatch<T>(promise: Promise<T>): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (err) {
    const error = handleError(err);
    return { data: null, error };
  }
} 