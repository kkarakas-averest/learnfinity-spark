import React, { useCallback, useEffect } from '@/lib/react-helpers';
import { useAuthState, useAuthDispatch } from '../StateContext';
import { supabase } from '@/lib/supabase';
import { 
  setLoading,
  setAuthSuccess,
  setAuthError,
  setSession,
  setUser,
  setUserDetails,
  signOut as signOutAction,
} from './authActions';
import { UserDetails } from '../types';

/**
 * Custom hook for authentication
 * Provides methods for authentication and access to auth state
 */
export function useAuth() {
  const state = useAuthState();
  const dispatch = useAuthDispatch();
  
  // Initialize auth state
  const initialize = useCallback(async () => {
    try {
      dispatch(setLoading());
      
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      dispatch(setSession(session));
      
      if (session?.user) {
        dispatch(setUser(session.user));
        await fetchUserDetails(session.user.id);
      }
      
      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session);
          dispatch(setSession(session));
          
          if (session?.user) {
            dispatch(setUser(session.user));
            await fetchUserDetails(session.user.id);
          } else {
            dispatch(setUser(null));
            dispatch(setUserDetails(null));
          }
        }
      );
      
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error initializing auth:', error);
      dispatch(setAuthError(error instanceof Error ? error : new Error('Failed to initialize auth')));
    }
  }, [dispatch]);
  
  // Fetch user details from custom table
  const fetchUserDetails = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        const userDetails: UserDetails = {
          id: data.id,
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'user',
        };
        
        dispatch(setUserDetails(userDetails));
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  }, [dispatch]);
  
  // Sign in with email and password
  const signInWithPassword = useCallback(async (email: string, password: string) => {
    try {
      dispatch(setLoading());
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      dispatch(setAuthSuccess(data.user));
      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      dispatch(setAuthError(error instanceof Error ? error : new Error('Failed to sign in')));
      throw error;
    }
  }, [dispatch]);
  
  // Sign up with email and password
  const signUpWithPassword = useCallback(async (email: string, password: string, userData?: Partial<UserDetails>) => {
    try {
      dispatch(setLoading());
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user && userData) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: userData.name || '',
            role: userData.role || 'user',
          });
        
        if (profileError) throw profileError;
      }
      
      dispatch(setAuthSuccess(data.user));
      return data;
    } catch (error) {
      console.error('Error signing up:', error);
      dispatch(setAuthError(error instanceof Error ? error : new Error('Failed to sign up')));
      throw error;
    }
  }, [dispatch]);
  
  // Sign out
  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      dispatch(signOutAction());
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, [dispatch]);
  
  // Set up auth listener on mount
  useEffect(() => {
    const cleanup = initialize();
    return () => {
      cleanup.then((unsubscribe) => {
        if (unsubscribe) unsubscribe();
      });
    };
  }, [initialize]);
  
  return {
    // State
    user: state.data,
    session: state.session,
    userDetails: state.userDetails,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.loading,
    error: state.error,
    
    // Methods
    signInWithPassword,
    signUpWithPassword,
    signOut,
    fetchUserDetails,
  };
} 