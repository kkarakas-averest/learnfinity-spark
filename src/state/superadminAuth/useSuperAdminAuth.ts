import { useState, useEffect, useCallback } from '@/lib/react-helpers';
import { supabase } from '@/lib/supabase';
import { useSupabase } from '@/components/providers/supabase-provider';
import { 
  initialSuperAdminAuthState, 
  SuperAdminAuthState, 
  SuperAdminUser 
} from './superAdminAuthReducer';
import { useSuperAdminAuthState, useSuperAdminAuthDispatch } from '../StateContext';
import { useUI } from '../ui/useUI';

export const useSuperAdminAuth = () => {
  const state = useSuperAdminAuthState();
  const dispatch = useSuperAdminAuthDispatch();
  const { toastSuccess, toastError } = useUI();
  const [initialized, setInitialized] = useState(false);
  const { supabase } = useSupabase();

  // Initial authentication check on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Check if the user is a super_admin by querying the user_profiles table
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Error fetching super admin profile:', profileError);
            dispatch({ type: 'LOGIN_FAILURE', payload: 'Failed to verify role' });
            return;
          }

          if (profile?.role === 'super_admin') {
            // User is a super admin, get their full profile
            const superAdminUser: SuperAdminUser = {
              id: session.user.id,
              email: session.user.email || '',
              username: session.user.user_metadata.username || session.user.email?.split('@')[0] || 'Admin',
              role: 'super_admin',
              avatar_url: session.user.user_metadata.avatar_url,
            };
            
            dispatch({ type: 'LOGIN_SUCCESS', payload: superAdminUser });
          } else {
            // User is not a super admin
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        console.error('Error checking super admin auth status:', error);
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Authentication check failed' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
        setInitialized(true);
      }
    };
    
    checkAuthStatus();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Check if the user is a super_admin
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching super admin profile:', profileError);
          dispatch({ type: 'LOGIN_FAILURE', payload: 'Failed to verify role' });
          return;
        }

        if (profile?.role === 'super_admin') {
          const superAdminUser: SuperAdminUser = {
            id: session.user.id,
            email: session.user.email || '',
            username: session.user.user_metadata.username || session.user.email?.split('@')[0] || 'Admin',
            role: 'super_admin',
            avatar_url: session.user.user_metadata.avatar_url,
          };
          
          dispatch({ type: 'LOGIN_SUCCESS', payload: superAdminUser });
        } else {
          // User is not a super admin
          dispatch({ type: 'LOGOUT' });
          toastError('Access Denied', 'Only Super Admins can access this area.');
        }
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch, toastError]);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
        toastError('Login Failed', error.message);
        return false;
      }
      
      // Check if the user is a super_admin
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching super admin profile:', profileError);
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Failed to verify role' });
        toastError('Login Failed', 'Failed to verify administrator role');
        return false;
      }

      if (profile?.role !== 'super_admin') {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Access denied: Not a super administrator' });
        toastError('Access Denied', 'Only Super Admins can access this area.');
        await supabase.auth.signOut();
        return false;
      }
      
      const superAdminUser: SuperAdminUser = {
        id: data.user.id,
        email: data.user.email || '',
        username: data.user.user_metadata.username || data.user.email?.split('@')[0] || 'Admin',
        role: 'super_admin',
        avatar_url: data.user.user_metadata.avatar_url,
      };
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: superAdminUser });
      toastSuccess('Login Successful', 'Welcome back, Super Admin!');
      return true;
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch({ type: 'LOGIN_FAILURE', payload: errorMessage });
      toastError('Login Error', errorMessage);
      return false;
    }
  }, [dispatch, toastSuccess, toastError]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      dispatch({ type: 'LOGOUT' });
      toastSuccess('Logged Out', 'You have been successfully logged out');
    } catch (error) {
      let errorMessage = 'An unexpected error occurred during logout';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toastError('Logout Error', errorMessage);
      console.error('Logout error:', error);
    }
  }, [dispatch, toastSuccess, toastError]);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, [dispatch]);

  return {
    ...state,
    initialized,
    login,
    logout,
    clearError,
  };
};
