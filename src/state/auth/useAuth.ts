import React, { useCallback, useEffect, useRef } from '@/lib/react-helpers';
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

// Create a global initialization flag outside the hook to prevent multiple initializations across instances
const globalInitialized = { current: false };
const globalInitializing = { current: false };

/**
 * Custom hook for authentication
 * Provides methods for authentication and access to auth state
 */
export function useAuth() {
  const state = useAuthState();
  const dispatch = useAuthDispatch();
  // Use the global initialization refs instead of local ones
  const initEffectRan = useRef(false);
  
  // Initialize auth state
  const initialize = useCallback(async () => {
    // Prevent multiple simultaneous initializations across hook instances
    if (globalInitializing.current) {
      console.log("Auth: Already initializing in another instance, skipping");
      return;
    }
    
    // Only initialize once globally
    if (globalInitialized.current) {
      console.log("Auth: Already initialized globally, skipping");
      return;
    }
    
    try {
      globalInitializing.current = true;
      dispatch(setLoading());
      console.log("Auth: Initializing auth state");
      
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Auth: Initial session check:", session ? "Session found" : "No session");
      
      dispatch(setSession(session));
      
      if (session?.user) {
        console.log("Auth: User found in session, setting user and fetching details");
        dispatch(setUser(session.user));
        await fetchUserDetails(session.user.id);
      } else {
        console.log("Auth: No user in session, setting loading to false");
        // Important: Make sure to complete loading even if no user is found
        dispatch(setAuthSuccess(null));
      }
      
      // Set up auth state change listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session ? "Session exists" : "No session");
          dispatch(setSession(session));
          
          if (session?.user) {
            console.log('Auth: User found in updated session, setting user');
            dispatch(setUser(session.user));
            await fetchUserDetails(session.user.id);
          } else {
            console.log('Auth: No user in updated session, clearing user data');
            dispatch(setUser(null));
            dispatch(setUserDetails(null));
          }
        }
      );
      
      globalInitialized.current = true;
      return () => {
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('Error initializing auth:', error);
      dispatch(setAuthError(error instanceof Error ? error : new Error('Failed to initialize auth')));
      
      // Important: Make sure loading state is cleared even in case of error
      setTimeout(() => {
        if (state.loading) {
          console.log('Auth: Force-clearing loading state after error');
          dispatch(setAuthSuccess(null));
        }
      }, 3000);
    } finally {
      globalInitializing.current = false;
    }
  }, [dispatch, state.loading]);
  
  // Fetch user details from custom table
  const fetchUserDetails = useCallback(async (userId: string) => {
    try {
      console.log('Auth: Fetching user details for user:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user details:', error);
        // Add fallback behavior for missing profile
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          console.log('User profile not found, creating default profile');
          const userDetails: UserDetails = {
            id: userId,
            name: 'New User',
            email: '',
            role: 'learner',
          };
          dispatch(setUserDetails(userDetails));
          // Important: Make sure loading state is cleared
          dispatch(setAuthSuccess(await supabase.auth.getUser().then(res => res.data.user)));
          return;
        }
        throw error;
      }
      
      if (data) {
        console.log('Auth: User details found:', data);
        const userDetails: UserDetails = {
          id: data.id,
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'learner',
        };
        
        dispatch(setUserDetails(userDetails));
        // Important: Make sure loading state is cleared after setting user details
        dispatch(setAuthSuccess(await supabase.auth.getUser().then(res => res.data.user)));
      } else {
        // If no data but also no error, create default profile
        console.log('No user details found but no error, creating default profile');
        const userDetails: UserDetails = {
          id: userId,
          name: 'New User',
          email: '',
          role: 'learner',
        };
        dispatch(setUserDetails(userDetails));
        // Important: Make sure loading state is cleared
        dispatch(setAuthSuccess(await supabase.auth.getUser().then(res => res.data.user)));
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      
      // Add fallback behavior to prevent getting stuck
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        console.log('Creating fallback user details from auth data');
        const fallbackDetails: UserDetails = {
          id: userData.user.id,
          name: userData.user.email?.split('@')[0] || 'User',
          email: userData.user.email || '',
          role: 'learner',
        };
        dispatch(setUserDetails(fallbackDetails));
        
        // Important: Make sure loading state is cleared even on error
        dispatch(setAuthSuccess(userData.user));
      } else {
        // If we can't get user data, clear the loading state anyway to prevent getting stuck
        console.log('Could not get user data, clearing loading state');
        dispatch(setAuthSuccess(null));
      }
    }
  }, [dispatch]);
  
  // Sign in with email and password
  const signInWithPassword = useCallback(async (email: string, password: string) => {
    try {
      dispatch(setLoading());
      console.log('Auth: Attempting sign in with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log('Auth: Sign in successful, user:', data.user?.id);
      
      // Important: Fetch user details immediately after login
      if (data.user) {
        console.log('Auth: Fetching user details after login');
        try {
          await fetchUserDetails(data.user.id);
        } catch (detailsError) {
          console.error('Failed to fetch user details after login:', detailsError);
          // Create fallback user details if fetch fails
          const fallbackDetails: UserDetails = {
            id: data.user.id,
            name: data.user.email?.split('@')[0] || 'User',
            email: data.user.email || '',
            role: 'learner',
          };
          dispatch(setUserDetails(fallbackDetails));
        }
      }
      
      dispatch(setAuthSuccess(data.user));
      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      dispatch(setAuthError(error instanceof Error ? error : new Error('Failed to sign in')));
      throw error;
    }
  }, [dispatch, fetchUserDetails]);
  
  // Sign up with email and password
  const signUpWithPassword = useCallback(async (email: string, password: string, userData?: Partial<UserDetails>) => {
    try {
      dispatch(setLoading());
      console.log("Auth: Attempting signup with:", email, userData);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user && userData) {
        console.log("Auth: Creating user profile for new user:", data.user.id);
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: typeof userData === 'string' ? userData : userData.name || '',
            role: typeof userData === 'string' ? 'learner' : userData.role || 'learner',
          });
        
        if (profileError) {
          console.error("Error creating user profile:", profileError);
          // Continue anyway to prevent getting stuck
        } else {
          console.log("Auth: User profile created successfully");
        }
        
        // Set user details immediately to prevent loading state issues
        dispatch(setUserDetails({
          id: data.user.id,
          email: data.user.email || '',
          name: typeof userData === 'string' ? userData : userData.name || '',
          role: typeof userData === 'string' ? 'learner' : userData.role || 'learner',
        }));
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
  
  // Set up auth listener on mount - with more protection against multiple calls
  useEffect(() => {
    // Only run the effect once per component instance
    if (initEffectRan.current) {
      return;
    }
    
    console.log('Auth: Running initialization effect');
    initEffectRan.current = true;
    
    const cleanup = initialize();
    
    // Clean up function
    return () => {
      cleanup?.then((unsubscribe) => {
        if (unsubscribe) unsubscribe();
      }).catch(err => {
        console.error('Error during auth cleanup:', err);
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