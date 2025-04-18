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

  // First check if import.meta.env is available (Vite environment)
  const viteEnv = typeof import.meta !== 'undefined' ? import.meta.env : {};
  
  // Then try to fetch from runtime API
  const apiEnv = await fetchRuntimeEnv();
  
  // Combine environments with priority: runtime API > Vite env
  runtimeEnvCache = {
    ...viteEnv,
    ...apiEnv
  };
  
  return runtimeEnvCache;
}

// Synchronous version for cases when you can't wait for async
export function getEnvSync(): Record<string, any> {
  // Return Vite env or cached runtime env if available
  if (typeof import.meta !== 'undefined') {
    return import.meta.env;
  }
  
  return runtimeEnvCache || {};
}

// Helper to get a specific environment variable
export function getEnvVar(key: string, defaultValue: string = ''): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env[key] !== undefined) {
      return import.meta.env[key];
    }
  }
  
  if (runtimeEnvCache && runtimeEnvCache[key] !== undefined) {
    return runtimeEnvCache[key];
  }
  
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key];
  }
  
  return defaultValue;
}

// Debug function
export function logAvailableEnv(): void {
  console.log('[ENV LOADER] Available environment variables:');
  
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    console.log('- Vite env keys:', Object.keys(import.meta.env));
  } else {
    console.log('- Vite env not available');
  }
  
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