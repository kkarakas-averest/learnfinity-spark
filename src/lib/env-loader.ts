/**
 * Environment Variable Loader
 * 
 * This utility handles loading environment variables at runtime,
 * providing fallbacks and fetching from API if needed.
 */

let runtimeEnvCache: Record<string, any> | null = null;

// Critical API connection fallbacks - ONLY used when environment variables 
// are completely unavailable and API fails
// SECURITY WARNING: This is a temporary emergency solution.
// These should be removed and replaced with proper environment variables ASAP!
const CRITICAL_FALLBACKS = {
  // Supabase connection info
  VITE_SUPABASE_URL: 'https://ujlqzkkkfatehxeqtbdl.supabase.co',
  NEXT_PUBLIC_SUPABASE_URL: 'https://ujlqzkkkfatehxeqtbdl.supabase.co',
  SUPABASE_URL: 'https://ujlqzkkkfatehxeqtbdl.supabase.co',
  
  // Supabase keys
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODA4MzIsImV4cCI6MjA1NjI1NjgzMn0.ed-wciIqkubS4f2T3UNnkgqwzLEdpC-SVZoVsP7-W1E',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODA4MzIsImV4cCI6MjA1NjI1NjgzMn0.ed-wciIqkubS4f2T3UNnkgqwzLEdpC-SVZoVsP7-W1E',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODA4MzIsImV4cCI6MjA1NjI1NjgzMn0.ed-wciIqkubS4f2T3UNnkgqwzLEdpC-SVZoVsP7-W1E',
  VITE_SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA',
  SUPABASE_SERVICE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA',
  
  // Groq API
  VITE_GROQ_API_KEY: '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',
  NEXT_PUBLIC_GROQ_API_KEY: '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',
  GROQ_API_KEY: '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',
  
  // Other settings
  NODE_ENV: 'production'
};

// Function to fetch environment variables from the runtime API
async function fetchRuntimeEnv(): Promise<Record<string, any>> {
  try {
    console.log('[ENV] Fetching runtime environment variables from API');
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('/api/runtime-env', {
      signal: controller.signal,
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`[ENV] Failed to fetch runtime environment: ${response.status}`);
      return {};
    }
    
    const data = await response.json();
    console.log(`[ENV] Successfully fetched environment variables: ${Object.keys(data).join(', ')}`);
    return data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[ENV] Environment fetch timeout');
    } else {
      console.error('[ENV] Error fetching runtime environment:', error);
    }
    return {};
  }
}

// Get environment variables with fallbacks
export async function getRuntimeEnv(): Promise<Record<string, any>> {
  if (runtimeEnvCache) {
    return runtimeEnvCache;
  }

  let envVars: Record<string, any> = {};
  
  // First try window.__ENV__ if it exists (sometimes injected by server)
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    console.log('[ENV] Using window.__ENV__ for environment variables');
    envVars = { ...envVars, ...(window as any).__ENV__ };
  }
  
  // Next.js environment variables are accessible via process.env
  if (typeof process !== 'undefined' && process.env) {
    console.log('[ENV] Adding process.env variables');
    envVars = { ...envVars, ...process.env };
  }
  
  // Then try to fetch from runtime API
  try {
    const apiEnv = await fetchRuntimeEnv();
    envVars = { ...envVars, ...apiEnv };
  } catch (error) {
    console.error('[ENV] Failed to load from API, falling back to defaults:', error);
  }
  
  // If we still don't have critical environment variables, use emergency fallbacks
  const criticalKeys = Object.keys(CRITICAL_FALLBACKS);
  const missingKeys = criticalKeys.filter(key => !envVars[key]);
  
  if (missingKeys.length > 0) {
    console.warn(`[ENV] Missing critical environment variables, using fallbacks: ${missingKeys.join(', ')}`);
    
    // Add fallbacks only for missing keys
    missingKeys.forEach(key => {
      if (CRITICAL_FALLBACKS[key as keyof typeof CRITICAL_FALLBACKS]) {
        envVars[key] = CRITICAL_FALLBACKS[key as keyof typeof CRITICAL_FALLBACKS];
      }
    });
  }
  
  // Cache the combined environment
  runtimeEnvCache = envVars;
  
  return runtimeEnvCache;
}

// Synchronous version for cases when you can't wait for async
export function getEnvSync(): Record<string, any> {
  // Return cached runtime env if available
  if (runtimeEnvCache) {
    return runtimeEnvCache;
  }
  
  // Try window.__ENV__ if available
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    return (window as any).__ENV__;
  }
  
  // Fall back to process.env
  if (typeof process !== 'undefined' && process.env) {
    return process.env;
  }
  
  // Last resort - use emergency fallbacks
  return CRITICAL_FALLBACKS;
}

// Helper to get a specific environment variable
export function getEnvVar(key: string, defaultValue: string = ''): string {
  // Try from runtime cache first
  if (runtimeEnvCache && runtimeEnvCache[key] !== undefined) {
    return runtimeEnvCache[key];
  }
  
  // Then try process.env
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key] as string;
  }
  
  // Try window.__ENV__
  if (typeof window !== 'undefined' && (window as any).__ENV__ && (window as any).__ENV__[key]) {
    return (window as any).__ENV__[key];
  }
  
  // Check emergency fallbacks
  if (key in CRITICAL_FALLBACKS) {
    const fallbackValue = CRITICAL_FALLBACKS[key as keyof typeof CRITICAL_FALLBACKS];
    if (fallbackValue) {
      return fallbackValue;
    }
  }
  
  return defaultValue;
}

// Debug function
export function logAvailableEnv(): void {
  console.log('[ENV LOADER] Available environment variables:');
  
  // Check window.__ENV__
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    console.log('- Window __ENV__ keys:', Object.keys((window as any).__ENV__));
  } else {
    console.log('- Window __ENV__ not available');
  }
  
  // Check runtime cache
  if (runtimeEnvCache) {
    console.log('- Runtime API env keys:', Object.keys(runtimeEnvCache));
  } else {
    console.log('- Runtime API env not loaded yet');
  }
  
  // Check process.env
  if (typeof process !== 'undefined' && process.env) {
    console.log('- Process env keys:', Object.keys(process.env));
  } else {
    console.log('- Process env not available');
  }
  
  // Check fallbacks
  console.log('- Emergency fallback keys:', Object.keys(CRITICAL_FALLBACKS));
}

// Log environment status on load
logAvailableEnv(); 