'use client';

import React from 'react';
import { getRuntimeEnv, logAvailableEnv } from '@/lib/env-loader';

// Define the fallback error UI component
const ErrorFallback = ({ error, resetApp }: { error: Error; resetApp: () => void }) => (
  <div className="flex min-h-screen bg-red-50 p-4 flex-col items-center justify-center text-center">
    <div className="max-w-md p-6 bg-white rounded-lg shadow-lg border border-red-200">
      <h1 className="text-xl font-bold text-red-600 mb-4">Application Error</h1>
      <p className="mb-4 text-gray-700">
        The application encountered an error during initialization. This might be due to missing 
        environment configuration.
      </p>
      <div className="mb-4 p-3 bg-gray-100 rounded text-sm text-left overflow-auto max-h-40">
        <code className="text-red-500 whitespace-pre-wrap">{error.message || 'Unknown error'}</code>
      </div>
      <button
        onClick={resetApp}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
);

/**
 * This component ensures that runtime environment variables are loaded
 * before the application is rendered. It will show a loading state
 * while fetching environment variables from the server.
 */
export function RuntimeEnvironmentProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [fetchAttempt, setFetchAttempt] = React.useState(0);
  const [envLoadSuccess, setEnvLoadSuccess] = React.useState(false);

  React.useEffect(() => {
    async function loadEnvironment() {
      try {
        console.log(`[RuntimeEnv] Attempt ${fetchAttempt + 1} to load environment variables`);
        
        // Add timeout to prevent infinite hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Environment fetch timeout after 5s')), 5000);
        });
        
        // Race the actual fetch against the timeout
        const runtimeEnv = await Promise.race([
          getRuntimeEnv(),
          timeoutPromise
        ]);
        
        // Log the available keys without exposing values
        console.log(`[RuntimeEnv] Successfully loaded environment keys: ${Object.keys(runtimeEnv).join(', ')}`);
        
        // Check for critical environment variables
        const requiredKeys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
        const missingKeys = requiredKeys.filter(key => !runtimeEnv[key]);
        
        if (missingKeys.length > 0) {
          throw new Error(`Critical environment variables missing: ${missingKeys.join(', ')}`);
        }
        
        logAvailableEnv();
        setEnvLoadSuccess(true);
        setIsLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error loading environment';
        console.error(`[RuntimeEnv] Failed to load environment: ${errorMessage}`, err);
        
        // Capture the error but continue if we're in production
        setError(err instanceof Error ? err : new Error(errorMessage));
        
        // In production, try to continue anyway after the error
        if (process.env.NODE_ENV === 'production') {
          console.warn('[RuntimeEnv] Continuing despite environment error in production');
          setIsLoading(false);
        } else {
          // In development, show the error UI
          setIsLoading(false);
        }
      }
    }

    loadEnvironment();
  }, [fetchAttempt]);

  // Function to retry loading the environment
  const retryLoading = () => {
    setIsLoading(true);
    setError(null);
    setFetchAttempt((prev: number) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full" />
          <div className="text-lg">Loading environment configuration...</div>
          <div className="text-sm text-gray-500">Attempt {fetchAttempt + 1}</div>
        </div>
      </div>
    );
  }

  if (error && !envLoadSuccess) {
    // Show error UI in development, continue in production
    if (process.env.NODE_ENV !== 'production') {
      return <ErrorFallback error={error} resetApp={retryLoading} />;
    }
    
    // Log warning but continue in production
    console.warn('[RuntimeEnv] Environment loading error, but continuing anyway:', error);
  }

  return <>{children}</>;
} 