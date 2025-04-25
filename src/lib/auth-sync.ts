import { supabase } from './supabase';

/**
 * This helper synchronizes our custom HR auth system with Supabase
 * to ensure RLS policies work correctly.
 */
export const syncHRAuthWithSupabase = async (email: string, password: string) => {
  try {
    console.log('Syncing HR auth with Supabase for:', email);
    
    // Check if already authenticated with Supabase
    const { data: sessionData } = await supabase.auth.getSession();
    
    // If already authenticated with this email, we're done
    if (sessionData.session?.user?.email === email) {
      console.log('Already authenticated with Supabase as:', email);
      return { success: true, message: 'Already authenticated' };
    }
    
    // If authenticated as a different user, sign out first
    if (sessionData.session) {
      console.log('Signing out current Supabase session...');
      await supabase.auth.signOut();
    }
    
    // Sign in to Supabase with the provided credentials
    console.log('Signing in to Supabase as:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Supabase authentication failed:', error.message);
      return { success: false, error: error.message };
    }
    
    console.log('Successfully authenticated with Supabase as:', email);
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Unexpected error in auth sync:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error in auth sync'
    };
  }
};

/**
 * Checks the current authentication state and logs diagnostic information
 */
export const checkAuthStatus = async () => {
  try {
    // Check Supabase session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    const authStatus = {
      hasSupabaseSession: !!session,
      supabaseUser: session ? {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      } : null,
      sessionError: sessionError ? sessionError.message : null
    };
    
    console.log('Auth status check:', authStatus);
    return authStatus;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return {
      hasSupabaseSession: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}; 