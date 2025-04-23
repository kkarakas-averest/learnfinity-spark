
import { useCallback, useState } from '@/lib/react-helpers';
import { useHRAuthState, useHRAuthDispatch } from '../StateContext';
import { useUI } from '../ui/useUI';
import {
  setLoading,
  setHRAuthSuccess,
  setHRAuthError,
  hrSignOut,
} from './hrAuthActions';
import { HRUser } from '../types';
import { supabase } from '@/lib/supabase';

export function useHRAuth() {
  const state = useHRAuthState();
  const dispatch = useHRAuthDispatch();
  const { toastError, toastSuccess } = useUI();

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      dispatch(setLoading());
      
      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) throw new Error(authError.message);
      
      if (!authData.user) throw new Error('No user data returned');
      
      // Fetch user profile to verify role
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, company_id')
        .eq('id', authData.user.id)
        .single();
      
      if (profileError) throw new Error('Failed to fetch user profile');
      
      if (profile.role !== 'hr') {
        await supabase.auth.signOut();
        throw new Error('Unauthorized: User is not an HR member');
      }
      
      const hrUser: HRUser = {
        username: authData.user.email || '',
        role: 'hr',
        companyId: profile.company_id
      };
      
      dispatch(setHRAuthSuccess(hrUser));
      toastSuccess('Login successful', 'Welcome to HR dashboard');
      return true;
      
    } catch (error) {
      console.error('HR Login error:', error);
      const message = error instanceof Error ? error.message : 'Failed to log in';
      dispatch(setHRAuthError(new Error(message)));
      toastError('Login failed', message);
      return false;
    }
  }, [dispatch, toastError, toastSuccess]);
  
  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      dispatch(hrSignOut());
      toastSuccess('Logout successful', 'You have been logged out');
    } catch (error) {
      console.error('Logout error:', error);
      toastError('Logout failed', 'An error occurred during logout');
    }
  }, [dispatch, toastSuccess, toastError]);

  return {
    hrUser: state.data,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.loading,
    error: state.error,
    login,
    logout,
  };
}
