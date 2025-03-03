import * as React from 'react';
type ReactNode = React.ReactNode;
const { createContext, useContext, useEffect, useState } = React;
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/lib/database.types';
import { useNavigate } from 'react-router-dom';

interface AuthContextProps {
  user: User | null;
  session: Session | null;
  userDetails: UserDetails | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  signupDisabled: boolean; // Added this property to expose signup status
}

interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Set this to true to disable new sign ups
  const signupDisabled = false;

  useEffect(() => {
    // Get the initial session
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setSession(session);
          setUser(session.user);
          
          // Fetch additional user details from the database
          await fetchUserDetails(session.user.id);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        toast({
          title: 'Authentication Error',
          description: 'Failed to restore your session.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserDetails(session.user.id);
        } else {
          setUserDetails(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const fetchUserDetails = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, role')
        .eq('id', userId)
        .single();

      if (error) {
        // If the 'users' table doesn't exist or has no record for this user
        // Set some default user details to allow the user to continue
        console.warn('Error fetching user details:', error);
        
        // Create default user details with learner role
        const defaultDetails = {
          id: userId,
          name: 'User',
          email: user?.email || '',
          role: 'learner',
        };
        setUserDetails(defaultDetails);
        redirectBasedOnRole();
        return;
      }

      if (data) {
        setUserDetails({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
        });
        redirectBasedOnRole();
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Create default user details with learner role
      const defaultDetails = {
        id: userId,
        name: 'User',
        email: user?.email || '',
        role: 'learner',
      };
      setUserDetails(defaultDetails);
      redirectBasedOnRole();
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });

      // Redirect based on role
      if (data.user) {
        await fetchUserDetails(data.user.id);
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({
        title: 'Sign In Failed',
        description: error.message || 'An error occurred during sign in.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      // Check if signups are disabled
      if (signupDisabled) {
        toast({
          title: 'Registration Closed',
          description: 'New user registration is currently disabled.',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      
      // Create auth user with email confirmation disabled
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name,
            role
          }
        }
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // Try to insert user into users table
      try {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name,
            email,
            password: 'hashed-in-rpc', // The actual password is handled by Supabase Auth
            role,
          });

        if (insertError) {
          console.warn('Failed to create user profile, but auth user was created:', insertError);
          // We'll continue anyway and create a default profile in memory
        }
      } catch (insertError) {
        console.warn('Exception when creating user profile:', insertError);
        // Continue with the flow even if profile creation fails
      }

      // Set user details in memory even if database insertion failed
      setUserDetails({
        id: authData.user.id,
        name,
        email,
        role,
      });

      toast({
        title: 'Account created!',
        description: 'Your account has been successfully created.',
      });

      // After signup, we already have a session due to Supabase's auto sign-in
      redirectBasedOnRole();
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast({
        title: 'Sign Up Failed',
        description: error.message || 'An error occurred during account creation.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      console.log("SignOut: Starting sign out process");
      
      // First clear application state immediately
      console.log("SignOut: Pre-emptively clearing local state");
      setUser(null);
      setSession(null);
      setUserDetails(null);
      
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Supabase signOut timed out after 3 seconds')), 3000);
      });
      
      console.log("SignOut: Calling supabase.auth.signOut()");
      
      try {
        // Race between the signOut call and the timeout
        await Promise.race([
          supabase.auth.signOut(),
          timeoutPromise
        ]);
        console.log("SignOut: Successfully signed out from Supabase");
      } catch (supabaseError) {
        console.error("SignOut: Error or timeout in supabase.auth.signOut()", supabaseError);
        console.log("SignOut: Continuing with local logout despite Supabase error");
      }
      
      // Aggressively clear all storage types
      console.log("SignOut: Aggressively clearing all storage");
      try {
        // Clear Supabase items from localStorage
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            console.log(`SignOut: Removing localStorage item: ${key}`);
            localStorage.removeItem(key);
          }
        }
        
        // Clear sessionStorage as well
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && (key.includes('supabase') || key.includes('sb-'))) {
            console.log(`SignOut: Removing sessionStorage item: ${key}`);
            sessionStorage.removeItem(key);
          }
        }
        
        // Try to clear any cookies (this is browser-dependent)
        document.cookie.split(";").forEach(function(c) {
          if (c.includes('supabase') || c.includes('sb-')) {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
            console.log(`SignOut: Attempting to clear cookie: ${c}`);
          }
        });
      } catch (storageError) {
        console.error("SignOut: Error clearing storage", storageError);
      }
      
      console.log("SignOut: Showing success toast");
      toast({
        title: 'Signed out',
        description: 'You have successfully signed out.',
      });
      
      // Wait a moment to ensure all state changes have propagated
      console.log("SignOut: Waiting before reload to ensure state changes propagate");
      setTimeout(() => {
        console.log("SignOut: Forcing complete page reload");
        // Force a complete page reload to ensure clean state
        window.location.replace('/');
      }, 100);
      
    } catch (error: any) {
      console.error('SignOut: Error in signOut function:', error);
      toast({
        title: 'Sign Out Failed',
        description: error.message || 'An error occurred during sign out.',
        variant: 'destructive',
      });
      
      // Even if there's an error, try to force logout with a complete reload
      console.log("SignOut: Attempting forced logout despite error");
      setUser(null);
      setSession(null);
      setUserDetails(null);
      
      setTimeout(() => {
        window.location.replace('/');
      }, 100);
    } finally {
      console.log("SignOut: Setting isLoading to false");
      setIsLoading(false);
    }
  };

  const redirectBasedOnRole = () => {
    if (!userDetails) return;
    
    switch (userDetails.role) {
      case 'superadmin':
        navigate('/admin');
        break;
      case 'hr':
        navigate('/hr');
        break;
      case 'mentor':
        navigate('/mentor');
        break;
      case 'learner':
      default:
        navigate('/dashboard');
        break;
    }
  };

  const value = {
    user,
    session,
    userDetails,
    isLoading,
    signIn,
    signUp,
    signOut,
    signupDisabled, // Expose signup status to components
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
