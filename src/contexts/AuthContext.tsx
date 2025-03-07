import React from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/lib/database.types';
import { ROUTES } from '@/lib/routes';
import { isSupabaseConfigured } from '@/lib/supabase';
import { 
  signInWithPassword, 
  signUpWithDetails, 
  signOut as authSignOut,
  getCurrentSession,
  getUserDetails,
  onAuthStateChange,
  UserDetails
} from '@/lib/auth';

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

// Create context with default undefined value
const AuthContext = React.createContext<AuthContextProps | undefined>(undefined);

// Auth Provider Component
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = React.useState<Session | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [userDetails, setUserDetails] = React.useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Set this to true to disable new sign ups
  const signupDisabled = false;

  React.useEffect(() => {
    // Get the initial session
    const getInitialSession = async () => {
      try {
        setIsLoading(true);
        
        const { success, session, user, error } = await getCurrentSession();
        
        if (success && session) {
          setSession(session);
          setUser(user);
          
          // Fetch additional user details from the database
          if (user) {
            const details = await getUserDetails(user.id);
            if (details) {
              setUserDetails(details);
            }
          }
        } else {
          // Check for stored credentials from HR employee creation
          const storedEmail = localStorage.getItem('temp_login_email');
          const storedPassword = localStorage.getItem('temp_login_password');
          
          if (storedEmail && storedPassword) {
            console.log('Found stored credentials, attempting auto-login...');
            
            try {
              const { success, data, userDetails, error } = await signInWithPassword(
                storedEmail, 
                storedPassword
              );
              
              if (!success || error) {
                toast({
                  title: 'Auto-login Failed',
                  description: error?.message || 'Please try logging in manually.',
                  variant: 'destructive',
                });
              } else if (data?.user) {
                setSession(data.session);
                setUser(data.user);
                
                if (userDetails) {
                  setUserDetails(userDetails);
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
    const subscription = onAuthStateChange((session, user) => {
      setSession(session);
      setUser(user);
      
      if (user) {
        // Fetch user details when auth state changes
        getUserDetails(user.id).then(details => {
          if (details) {
            setUserDetails(details);
          }
        });
      } else {
        setUserDetails(null);
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Input validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        throw new Error('Authentication service is not properly configured');
      }
      
      // Sign in with the new auth service
      const { success, data, userDetails, error } = await signInWithPassword(email, password);
      
      if (!success || error) {
        throw error;
      }
      
      // Set user state
      setSession(data.session);
      setUser(data.user);
      
      // Set user details if available
      if (userDetails) {
        setUserDetails(userDetails);
      }
      
      // Redirect based on user role
      if (userDetails) {
        redirectBasedOnRole(userDetails.role);
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: error.message || 'An error occurred during sign in.',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      setIsLoading(true);
      
      // Check if signup is disabled
      if (signupDisabled) {
        throw new Error('New user registration is currently disabled');
      }
      
      // Input validation
      if (!email || !password || !name) {
        throw new Error('Email, password, and name are required');
      }
      
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        throw new Error('Authentication service is not properly configured');
      }
      
      // Sign up with the new auth service
      const { success, data, error, warning } = await signUpWithDetails(
        email, 
        password, 
        name, 
        role
      );
      
      if (!success || error) {
        throw error;
      }
      
      if (warning) {
        console.warn(warning);
      }
      
      // Set user state if auto-confirmed
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        
        // Get user details
        const details = await getUserDetails(data.user.id);
        if (details) {
          setUserDetails(details);
        }
        
        // Redirect based on role
        redirectBasedOnRole(role);
      } else {
        // For email confirmation flow
        navigate('/login?confirmed=false');
      }
      
      toast({
        title: 'Account created',
        description: data.session 
          ? 'Your account has been created and you are now logged in.' 
          : 'Your account has been created. Please check your email to confirm your account.',
      });
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast({
        variant: 'destructive',
        title: 'Registration Error',
        description: error.message || 'An error occurred during account creation.',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Use the new auth service to sign out
      const { success, error } = await authSignOut();
      
      if (!success) {
        console.error("SignOut: Error in auth service signOut", error);
      }
      
      // Clear state regardless of API result
      setSession(null);
      setUser(null);
      setUserDetails(null);
      
      // Clear any stored credentials
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('temp_login_email');
      localStorage.removeItem('temp_login_password');
      
      // Redirect to home page
      navigate('/');
      
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
    } catch (error) {
      console.error('Error during sign out:', error);
      
      // Still clear state and redirect on error
      setSession(null);
      setUser(null);
      setUserDetails(null);
      navigate('/');
      
      toast({
        variant: 'destructive',
        title: 'Sign Out Error',
        description: 'An error occurred during sign out, but you have been logged out of this device.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const redirectBasedOnRole = (role: UserRole) => {
    switch (role) {
      case 'superadmin':
        navigate(ROUTES.ADMIN_DASHBOARD);
        break;
      case 'hr':
        navigate(ROUTES.HR_DASHBOARD);
        break;
      case 'mentor':
        navigate(ROUTES.MENTOR_DASHBOARD);
        break;
      case 'learner':
      default:
        navigate(ROUTES.DASHBOARD);
        break;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userDetails,
        isLoading,
        signIn,
        signUp,
        signOut,
        signupDisabled
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
