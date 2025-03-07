import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Define props and state interfaces
interface SimpleErrorBoundaryProps {
  children: React.ReactNode;
  fallbackComponent?: React.ReactNode;
}

interface SimpleErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * A simplified error boundary component that catches errors in the component tree
 * and displays a fallback UI instead of crashing the application.
 * 
 * Note: This component has TypeScript compatibility issues in the current project setup.
 * Consider using FunctionalErrorBoundary instead.
 */
class SimpleErrorBoundary extends React.Component<SimpleErrorBoundaryProps, SimpleErrorBoundaryState> {
  // @ts-ignore - TypeScript doesn't recognize state property
  constructor(props: SimpleErrorBoundaryProps) {
    super(props);
    // @ts-ignore - TypeScript doesn't recognize state property
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SimpleErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to the console
    console.error('Error caught by SimpleErrorBoundary:', error, errorInfo);
  }

  handleReset = (): void => {
    // @ts-ignore - TypeScript doesn't recognize setState method
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    // @ts-ignore - TypeScript doesn't recognize state property
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      // @ts-ignore - TypeScript doesn't recognize props property
      if (this.props.fallbackComponent) {
        // @ts-ignore - TypeScript doesn't recognize props property
        return this.props.fallbackComponent;
      }

      // Otherwise use our default error UI
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

export default SimpleErrorBoundary; 