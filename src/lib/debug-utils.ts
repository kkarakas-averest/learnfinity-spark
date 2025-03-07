/**
 * Debug utilities for developers
 * 
 * These utilities are meant to help diagnose issues during development.
 * They are no-ops in production builds.
 */

const isDevEnvironment = () => {
  return import.meta.env.DEV === true;
};

export const debugLog = (tag: string, ...args: any[]) => {
  if (isDevEnvironment()) {
    console.log(`[${tag}]`, ...args);
  }
};

export const debugError = (tag: string, ...args: any[]) => {
  if (isDevEnvironment()) {
    console.error(`[${tag}]`, ...args);
  }
};

export const debugWarn = (tag: string, ...args: any[]) => {
  if (isDevEnvironment()) {
    console.warn(`[${tag}]`, ...args);
  }
};

// Add to window for console debugging
if (isDevEnvironment()) {
  (window as any).testSupabaseLogin = async (email: string, password: string) => {
    const { supabase } = await import('./supabase');
    
    console.log(`Testing login with ${email}...`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Login test FAILED:', error);
        return { success: false, error };
      }
      
      console.log('Login test SUCCESS!', data);
      return { success: true, data };
    } catch (err) {
      console.error('Login test ERROR:', err);
      return { success: false, error: err };
    }
  };
  
  console.log('Debug functions added to window:');
  console.log('- window.testSupabaseLogin(email, password)');
} 