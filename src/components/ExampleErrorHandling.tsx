import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { createError, ErrorCode } from '@/lib/error';
import { withErrorBoundary } from '@/components/ErrorBoundary';

/**
 * Example component that demonstrates the use of error handling utilities.
 * This component shows various ways to handle errors in a React application.
 */
const ExampleErrorHandling: React.FC = () => {
  const {
    error,
    isLoading,
    errorMessage,
    handleError,
    clearError,
    executeWithErrorHandling,
    wrapAsync
  } = useErrorHandler({
    defaultMessage: 'Something went wrong in the example component',
    toastTitle: 'Example Error'
  });

  // Function that will throw an error
  const triggerError = () => {
    throw createError(
      'This is a test error',
      ErrorCode.VALIDATION_ERROR,
      400,
      { additionalInfo: 'Some context about the error' }
    );
  };

  // Async function that will throw an error
  const triggerAsyncError = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    throw createError('Async operation failed', ErrorCode.NETWORK_REQUEST_FAILED);
  };

  // Function that handles the error using our utility
  const handleErrorClick = () => {
    try {
      triggerError();
    } catch (err) {
      handleError(err, 'Custom error message when handling manually');
    }
  };

  // Function that uses executeWithErrorHandling
  const handleAsyncErrorClick = () => {
    executeWithErrorHandling(triggerAsyncError);
  };

  // Create a wrapped version of the async function
  const wrappedAsyncFunction = wrapAsync(triggerAsyncError, {
    errorMessage: 'Error in wrapped async function'
  });

  // Function that will throw an error that crashes the component
  const throwUnhandledError = () => {
    // This will be caught by the ErrorBoundary
    throw new Error('This error will crash the component');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Error Handling Examples</CardTitle>
        <CardDescription>
          This component demonstrates different ways to handle errors
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-4">
            <h3 className="text-red-800 font-medium mb-2">Current Error:</h3>
            <p className="text-red-600">{errorMessage}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearError}
              className="mt-2"
            >
              Clear Error
            </Button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={handleErrorClick}
            className="w-full"
          >
            Trigger Try/Catch Error
          </Button>
          
          <Button
            variant="outline"
            onClick={handleAsyncErrorClick}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Loading...' : 'Trigger Async Error'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => wrappedAsyncFunction()}
            disabled={isLoading}
            className="w-full"
          >
            Use Wrapped Async Function
          </Button>
          
          <Button
            variant="destructive"
            onClick={throwUnhandledError}
            className="w-full"
          >
            Crash Component (ErrorBoundary Test)
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="text-sm text-muted-foreground">
        Check the console and toast notifications for error details
      </CardFooter>
    </Card>
  );
};

// Wrap the component with an error boundary
export default withErrorBoundary(ExampleErrorHandling); 