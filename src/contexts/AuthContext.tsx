import * as React from "react";
// Create local constants for React hooks
const { createContext, useContext, useEffect, useState } = React;
// Use React.ReactNode instead of importing it separately
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/lib/database.types';
import { ROUTES } from '@/lib/routes';
import { isSupabaseConfigured } from '@/lib/supabase';

// Import the authentication workaround
import { authenticateUser, getUserByEmail, isUsingTestAccount, getOriginalEmail } from '../../auth-workaround';

// Type Definitions
interface AuthContextProps {
  user: User | null;
  session: Session | null;
  userDetails: UserDetails | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  signupDisabled: boolean;
}

interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Create context with default undefined value
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// Helper function to get user details from Supabase
const fetchUserDetailsFromSupabase = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user details:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching user details:', error);
    return null;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
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
        } else {
          // Check for stored credentials from HR employee creation
          const storedEmail = localStorage.getItem('temp_login_email');
          const storedPassword = localStorage.getItem('temp_login_password');
          
          if (storedEmail && storedPassword) {
            console.log('Found stored credentials, attempting auto-login...');
            
            try {
              // Use our authentication workaround instead of direct supabase auth
              const { data, error, method, originalUser } = await authenticateUser(storedEmail, storedPassword);
              
              if (error) {
                console.error('Auto-login failed:', error);
                toast({
                  title: 'Auto-login Failed',
                  description: error.message || 'Please try logging in manually.',
                  variant: 'destructive',
                });
              } else if (data.user) {
                console.log('Auto-login successful, setting session');
                setSession(data.session);
                setUser(data.user);
                
                // Get proper user details based on authentication method
                if (method === 'test') {
                  // If using a test user, get the original user's details
                  const originalEmail = getOriginalEmail(data.user);
                  const { data: originalUserData } = await getUserByEmail(originalEmail);
                  
                  if (originalUserData) {
                    setUserDetails(originalUserData);
                  } else {
                    // Fallback to user details from the original mapping
                    setUserDetails({
                      id: data.user.id,
                      name: originalUser?.originalName || originalEmail.split('@')[0],
                      email: originalEmail,
                      role: originalUser?.originalRole || 'learner'
                    });
                  }
                } else {
                  // Normal authentication - get user details directly
                  await fetchUserDetails(data.user.id);
                }
                
                toast({
                  title: 'Welcome!',
                  description: 'You have been automatically logged in.',
                });
              }
            } catch (error) {
              console.error('Error during auto-login:', error);
              toast({
                title: 'Auto-login Error',
                description: 'An unexpected error occurred. Please try logging in manually.',
                variant: 'destructive',
              });
            } finally {
              // Always remove stored credentials after attempt
              localStorage.removeItem('temp_login_email');
              localStorage.removeItem('temp_login_password');
            }
          }
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
        console.log("Auth state changed:", event, session ? "Session exists" : "No session");
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
          role: 'learner' as UserRole,
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
        role: 'learner' as UserRole,
      };
      setUserDetails(defaultDetails);
      redirectBasedOnRole();
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log("Attempting login with:", email);
      
      // Validate email format
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!isValidEmail) {
        console.error('Invalid email format:', email);
        throw new Error('Invalid email format');
      }

      // Check if password is provided
      if (!password || password.length < 1) {
        console.error('Password is empty');
        throw new Error('Password cannot be empty');
      }
      
      // Check if Supabase is properly configured
      if (!isSupabaseConfigured()) {
        console.error('Supabase is not properly configured. Check your environment variables.');
        throw new Error('Authentication service is not properly configured');
      }

      // Log the Supabase URL and key length for debugging
      const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      console.log('Supabase config check:', { 
        url: supabaseUrl,
        keyDefined: !!supabaseAnonKey,
        keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0
      });
      
      // Try authentication with workaround
      const { data, error, method, originalUser } = await authenticateUser(email, password);

      if (error) {
        console.error('Authentication error details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          method: method
        });
        throw error;
      }

      // Fetch user details and set them in context
      if (data.user) {
        let userDetails;
        
        if (method === 'test') {
          // If using a test user, get the original user's details from the database
          console.log('Using test user authentication, fetching original user details');
          const originalEmail = getOriginalEmail(data.user);
          const { data: originalUserData } = await getUserByEmail(originalEmail);
          
          if (originalUserData) {
            userDetails = originalUserData;
          } else {
            // Fallback to basic user details
            userDetails = {
              id: data.user.id,
              name: originalUser?.originalName || email.split('@')[0],
              email: originalEmail,
              role: originalUser?.originalRole || 'learner'
            };
          }
        } else {
          // Normal authentication - get user details from database
          const { data: dbUserDetails, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (!userError && dbUserDetails) {
            userDetails = dbUserDetails;
          } else {
            // If we can't get user details, set defaults
            userDetails = {
              id: data.user.id,
              name: data.user.user_metadata?.name || email,
              email: email,
              role: data.user.user_metadata?.role || 'learner'
            };
          }
        }
        
        // Set the user details in context
        setUserDetails(userDetails);

        // Redirect based on role
        redirectBasedOnRole();
      }

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
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

// Hook for easy context access
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
