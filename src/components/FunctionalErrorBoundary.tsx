import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

/**
 * A functional implementation of an error boundary
 * This uses a combination of useState and componentDidCatch to provide error boundary functionality
 */
const FunctionalErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  fallback,
  onError,
  onReset
}) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  // Use effect to set up the error handler
  React.useEffect(() => {
    // Create an error event handler
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      setHasError(true);
      setError(event.error || new Error(event.message));
      if (onError) {
        onError(event.error, { componentStack: event.filename + ':' + event.lineno });
      }
    };

    // Add error event listener
    window.addEventListener('error', handleError);

    // Clean up
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [onError]);

  // Handle resetting the error state
  const handleReset = () => {
    setHasError(false);
    setError(null);
    if (onReset) {
      onReset();
    }
  };

  // Render error UI if there's an error
  if (hasError) {
    // If custom fallback is provided, use it
    if (fallback) {
      return <>{fallback}</>;
    }

    // Otherwise, use our default error UI
    return (
      <Alert variant="destructive" className="m-4 shadow-md">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="text-lg font-semibold mb-2">
          Something went wrong
        </AlertTitle>
        <AlertDescription className="mt-2">
          <div className="text-sm opacity-90 mb-4">
            {error?.message || 'An unexpected error occurred.'}
          </div>
          <Button 
            onClick={handleReset}
            variant="outline"
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // If no error, render children
  return <>{children}</>;
};

/**
 * Higher-order component that wraps a component with a FunctionalErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<ErrorBoundaryProps, 'children'> = {}
): React.FC<P> {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const ComponentWithErrorBoundary: React.FC<P> = (props) => {
    return (
      <FunctionalErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </FunctionalErrorBoundary>
    );
  };

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  
  return ComponentWithErrorBoundary;
}

export default FunctionalErrorBoundary; 