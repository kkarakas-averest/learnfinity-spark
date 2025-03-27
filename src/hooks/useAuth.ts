import React from 'react';
import { supabase } from '@/lib/supabase';

interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: Error | null;
}

export function useAuth() {
  const [authState, setAuthState] = React.useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });

  React.useEffect(() => {
    // Get initial session
    const fetchSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (data?.session?.user) {
          setAuthState({
            user: {
              id: data.session.user.id,
              email: data.session.user.email || '',
              role: data.session.user.user_metadata?.role,
            },
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error fetching auth session:', error);
        setAuthState({
          user: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown authentication error'),
        });
      }
    };

    fetchSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setAuthState({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              role: session.user.user_metadata?.role,
            },
            isLoading: false,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            isLoading: false,
            error: null,
          });
        }
      }
    );

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user: authState.user,
    isLoading: authState.isLoading,
    error: authState.error,
    isAuthenticated: !!authState.user,
    
    // Helper methods
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        return { success: false, error };
      }
      return { success: true };
    }
  };
} 