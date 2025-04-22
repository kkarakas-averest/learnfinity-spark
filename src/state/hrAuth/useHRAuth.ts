import React, { useCallback } from '@/lib/react-helpers';
import { useHRAuthState, useHRAuthDispatch } from '../StateContext';
import { useUI } from '../ui/useUI';
import {
  setLoading,
  setHRAuthSuccess,
  setHRAuthError,
  hrSignOut as signOutAction,
} from './hrAuthActions';
import { HRUser } from '../types';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook for HR authentication
 * Provides methods for HR authentication and access to HR auth state
 */
export function useHRAuth() {
  const state = useHRAuthState();
  const dispatch = useHRAuthDispatch();
  const { toastError, toastSuccess } = useUI();

  /**
   * Login for HR users
   * This uses a simplified in-memory authentication for HR users
   * In a real application, this would call an actual authentication API
   */
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      dispatch(setLoading());
      
      // For security, don't hard-code credentials in production
      // This is a simplified example for demonstration
      const validCredentials = [
        { username: 'hr@example.com', password: 'hrpassword123', role: 'hr' as const },
        { username: 'admin@hr.com', password: 'adminhr456', role: 'hr' as const },
      ];
      
      // Check if credentials match
      const matchedUser = validCredentials.find(
        user => user.username === username && user.password === password
      );
      
      if (!matchedUser) {
        throw new Error('Invalid username or password');
      }
      
      // Create HR user
      const hrUser: HRUser = {
        username: matchedUser.username,
        role: matchedUser.role,
      };
      
      // Authenticate with Supabase to get a valid session
      // This is critical for RLS policies to work properly
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: username,
          password: password
        });
        
        if (authError) {
          console.warn('Supabase authentication failed, but proceeding with in-memory auth:', authError.message);
          // Continue with in-memory authentication even if Supabase auth fails
          // This ensures backwards compatibility
        } else {
          console.log('Supabase authentication successful:', authData.user?.id);
          // We could enhance hrUser with data from authData if needed
        }
      } catch (authError) {
        console.warn('Exception during Supabase authentication:', authError);
        // Continue with in-memory authentication
      }
      
      // In a real application, you might store a token here
      localStorage.setItem('hrUser', JSON.stringify(hrUser));
      
      dispatch(setHRAuthSuccess(hrUser));
      toastSuccess('Login successful', 'Welcome to HR dashboard');
      
      return true;
    } catch (error) {
      console.error('Error logging in:', error);
      dispatch(setHRAuthError(error instanceof Error ? error : new Error('Failed to log in')));
      toastError('Login failed', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }, [dispatch, toastError, toastSuccess]);
  
  /**
   * Logout function for HR users
   */
  const logout = useCallback(() => {
    // Sign out from Supabase first
    supabase.auth.signOut().then(() => {
      console.log('Successfully signed out from Supabase');
    }).catch(error => {
      console.error('Error signing out from Supabase:', error);
    }).finally(() => {
      // Always clean up the local state regardless of Supabase success
      localStorage.removeItem('hrUser');
      dispatch(signOutAction());
      toastSuccess('Logout successful', 'You have been logged out');
    });
  }, [dispatch, toastSuccess]);
  
  /**
   * Initialize HR auth state
   * This is called during app initialization to restore state from localStorage
   */
  const initialize = useCallback(() => {
    const storedHRUser = localStorage.getItem('hrUser');
    
    if (storedHRUser) {
      try {
        const parsedUser = JSON.parse(storedHRUser);
        dispatch(setHRAuthSuccess(parsedUser));
        return true;
      } catch (error) {
        console.error('Failed to parse stored HR user:', error);
        localStorage.removeItem('hrUser');
      }
    }
    
    return false;
  }, [dispatch]);

  // Call initialize on hook mount
  React.useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // State
    hrUser: state.data,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.loading,
    error: state.error,
    
    // Methods
    login,
    logout,
    initialize,
  };
} 