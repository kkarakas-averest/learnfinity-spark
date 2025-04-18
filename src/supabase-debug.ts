// Supabase debug script
console.log('[SUPABASE DEBUG] Starting debugging info');

// Check if import.meta.env is defined and has properties
console.log('[SUPABASE DEBUG] import.meta.env exists:', typeof import.meta !== 'undefined' && import.meta.env !== undefined);

// Check specific Supabase environment variables
if (typeof import.meta !== 'undefined' && import.meta.env !== undefined) {
  console.log('[SUPABASE DEBUG] Environment variables:');
  console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Exists (not showing for security)' : 'Not defined');
  
  // Log all available environment variables (keys only)
  console.log('[SUPABASE DEBUG] All available environment variables:');
  console.log(Object.keys(import.meta.env).join(', '));
}

// Export a dummy function so this can be imported somewhere
export function debugSupabase() {
  console.log('[SUPABASE DEBUG] Debug function called');
  return { url: import.meta.env.VITE_SUPABASE_URL, hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY };
} 