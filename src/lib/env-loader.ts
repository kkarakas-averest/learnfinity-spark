/**
 * Environment Variable Loader
 * 
 * This utility handles loading environment variables at runtime,
 * providing fallbacks and fetching from API if needed.
 */

let runtimeEnvCache: Record<string, any> | null = null;

// Function to fetch environment variables from the runtime API
async function fetchRuntimeEnv(): Promise<Record<string, any>> {
  try {
    const response = await fetch('/api/runtime-env');
    if (!response.ok) {
      console.error('Failed to fetch runtime environment:', response.status);
      return {};
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching runtime environment:', error);
    return {};
  }
}

// Get environment variables with fallbacks
export async function getRuntimeEnv(): Promise<Record<string, any>> {
  if (runtimeEnvCache) {
    return runtimeEnvCache;
  }

  // Next.js environment variables are accessible via process.env
  const nextEnv = typeof process !== 'undefined' && process.env ? process.env : {};
  
  // Then try to fetch from runtime API
  const apiEnv = await fetchRuntimeEnv();
  
  // Combine environments with priority: runtime API > Next.js env
  runtimeEnvCache = {
    ...nextEnv,
    ...apiEnv
  };
  
  return runtimeEnvCache;
}

// Synchronous version for cases when you can't wait for async
export function getEnvSync(): Record<string, any> {
  // Return process env or cached runtime env if available
  if (typeof process !== 'undefined' && process.env) {
    return process.env;
  }
  
  return runtimeEnvCache || {};
}

// Helper to get a specific environment variable
export function getEnvVar(key: string, defaultValue: string = ''): string {
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key] as string;
  }
  
  if (runtimeEnvCache && runtimeEnvCache[key] !== undefined) {
    return runtimeEnvCache[key];
  }
  
  return defaultValue;
}

// Debug function
export function logAvailableEnv(): void {
  console.log('[ENV LOADER] Available environment variables:');
  
  if (runtimeEnvCache) {
    console.log('- Runtime API env keys:', Object.keys(runtimeEnvCache));
  } else {
    console.log('- Runtime API env not loaded yet');
  }
  
  if (typeof process !== 'undefined' && process.env) {
    console.log('- Process env keys:', Object.keys(process.env));
  } else {
    console.log('- Process env not available');
  }
}

// Log environment status on load
logAvailableEnv(); 