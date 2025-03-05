/**
 * Common type definitions for service responses to replace the use of 'any'
 */

// Basic Supabase response structure
export interface SupabaseResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

// Error structure from Supabase
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
  status?: number;
}

/**
 * Common retry operation return type
 * Used for operations that may need to be retried multiple times
 * @template T The type of data returned on success
 */
export interface RetryOperationResult<T> {
  /** Whether the operation was successful */
  success: boolean;
  /** The data returned from a successful operation */
  data?: T;
  /** The error returned from a failed operation */
  error?: SupabaseError | Error;
}

// Pagination response from services
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// HTTP status with reason
export interface HttpStatus {
  status: number;
  statusText: string;
}

// Type guard to check if an object is a SupabaseError
export function isSupabaseError(error: any): error is SupabaseError {
  return error && typeof error === 'object' && 'message' in error && 
    (error.code !== undefined || error.status !== undefined);
}

// Specific domain types can be expanded below 