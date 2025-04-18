'use client';

import React from 'react';
import { getRuntimeEnv, logAvailableEnv } from '@/lib/env-loader';

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

  React.useEffect(() => {
    async function loadEnvironment() {
      try {
        await getRuntimeEnv();
        logAvailableEnv();
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load runtime environment:', err);
        setError(err instanceof Error ? err : new Error('Unknown error loading environment'));
        // Continue anyway after error
        setIsLoading(false);
      }
    }

    loadEnvironment();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full" />
          <div className="text-lg">Loading environment configuration...</div>
        </div>
      </div>
    );
  }

  if (error) {
    console.warn('Environment loading error, but continuing anyway:', error);
    // We'll continue rendering the app even with an error
  }

  return <>{children}</>;
} 