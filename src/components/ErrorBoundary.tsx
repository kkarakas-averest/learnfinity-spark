import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import FunctionalErrorBoundary from './FunctionalErrorBoundary';

// Define props and state interfaces
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * ErrorBoundary component that catches JavaScript errors anywhere in its
 * child component tree and displays a fallback UI instead of crashing.
 * 
 * Note: This component has TypeScript compatibility issues in the current project setup.
 * Consider using FunctionalErrorBoundary instead.
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // @ts-ignore - TypeScript doesn't recognize state property
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // @ts-ignore - TypeScript doesn't recognize state property
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // You can also log the error to an error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    // @ts-ignore - TypeScript doesn't recognize setState method
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    // @ts-ignore - TypeScript doesn't recognize setState method
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    
    // Call the onReset prop if provided
    // @ts-ignore - TypeScript doesn't recognize props property
    if (this.props.onReset) {
      // @ts-ignore - TypeScript doesn't recognize props property
      this.props.onReset();
    }
  }

  render(): React.ReactNode {
    // @ts-ignore - TypeScript doesn't recognize state property
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      // @ts-ignore - TypeScript doesn't recognize props property
      if (this.props.fallback) {
        // @ts-ignore - TypeScript doesn't recognize props property
        return this.props.fallback;
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
              {/* @ts-ignore - TypeScript doesn't recognize state property */}
              {this.state.error?.message || 'An unexpected error occurred.'}
            </div>
            {/* @ts-ignore - TypeScript doesn't recognize state property */}
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-2 text-xs opacity-70 mb-4">
                <summary>Error Details (Developers Only)</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {/* @ts-ignore - TypeScript doesn't recognize state property */}
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
            <Button 
              onClick={this.handleReset}
              variant="outline"
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Try Again
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    // @ts-ignore - TypeScript doesn't recognize props property
    return this.props.children;
  }
}

/**
 * Higher-order component that wraps a component with an ErrorBoundary.
 * 
 * Note: This uses FunctionalErrorBoundary to avoid TypeScript issues.
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

export default ErrorBoundary; 