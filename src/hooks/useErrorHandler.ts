import React from 'react';
import { 
  AppError, 
  handleError, 
  getUserFriendlyErrorMessage, 
  tryCatch 
} from '@/lib/error';
import { useToast } from '@/hooks/use-toast';

interface ErrorHandlerOptions {
  showToast?: boolean;
  defaultMessage?: string;
  toastTitle?: string;
}

/**
 * Custom hook for handling errors in components
 * 
 * @param options Configuration options for error handling
 * @returns Error handling utilities
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const { toast } = useToast();
  const [error, setError] = React.useState<AppError | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const {
    showToast = true,
    defaultMessage = 'An unexpected error occurred. Please try again.',
    toastTitle = 'Error'
  } = options;
  
  /**
   * Handle an error and optionally show a toast notification
   */
  const handleAppError = React.useCallback((err: unknown, customMessage?: string) => {
    const appError = handleError(err, customMessage || defaultMessage);
    setError(appError);
    
    if (showToast) {
      toast({
        title: toastTitle,
        description: getUserFriendlyErrorMessage(appError),
        variant: 'destructive',
      });
    }
    
    return appError;
  }, [toast, showToast, toastTitle, defaultMessage]);
  
  /**
   * Clear the current error
   */
  const clearError = React.useCallback(() => {
    setError(null);
  }, []);
  
  /**
   * Execute a function with error handling and loading state
   */
  const executeWithErrorHandling = React.useCallback(async <T>(
    fn: () => Promise<T>,
    customOptions?: {
      loadingState?: boolean;
      errorMessage?: string;
      onSuccess?: (data: T) => void;
    }
  ): Promise<T | null> => {
    const { loadingState = true, errorMessage, onSuccess } = customOptions || {};
    
    try {
      if (loadingState) {
        setIsLoading(true);
      }
      
      // Clear previous errors
      clearError();
      
      const result = await fn();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      handleAppError(err, errorMessage);
      return null;
    } finally {
      if (loadingState) {
        setIsLoading(false);
      }
    }
  }, [handleAppError, clearError]);
  
  /**
   * Execute a function and return data and error
   */
  const executeAndGetResult = React.useCallback(async <T>(
    fn: () => Promise<T>,
    customOptions?: {
      loadingState?: boolean;
      errorMessage?: string;
    }
  ): Promise<{ data: T | null; error: AppError | null }> => {
    const { loadingState = true, errorMessage } = customOptions || {};
    
    try {
      if (loadingState) {
        setIsLoading(true);
      }
      
      // Clear previous errors
      clearError();
      
      const result = await fn();
      return { data: result, error: null };
    } catch (err) {
      const appError = handleAppError(err, errorMessage);
      return { data: null, error: appError };
    } finally {
      if (loadingState) {
        setIsLoading(false);
      }
    }
  }, [handleAppError, clearError]);
  
  /**
   * Wrap an async function in try-catch with loading state
   */
  const wrapAsync = React.useCallback(<T>(
    fn: (...args: any[]) => Promise<T>, 
    customOptions?: {
      loadingState?: boolean;
      errorMessage?: string;
      onSuccess?: (data: T) => void;
    }
  ) => {
    return async (...args: any[]): Promise<T | null> => {
      return executeWithErrorHandling(() => fn(...args), customOptions);
    };
  }, [executeWithErrorHandling]);
  
  return {
    error,
    isLoading,
    setError,
    clearError,
    handleError: handleAppError,
    executeWithErrorHandling,
    executeAndGetResult,
    wrapAsync,
    errorMessage: error ? getUserFriendlyErrorMessage(error) : null,
    tryCatch
  };
} 