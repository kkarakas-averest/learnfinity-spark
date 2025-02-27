
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
        throw error;
      }

      if (data) {
        setUserDetails({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
        });
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch your user details.',
        variant: 'destructive',
      });
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
        redirectBasedOnRole();
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
      setIsLoading(true);
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // Insert user into users table
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
        // Rollback auth user creation if profile creation fails
        await supabase.auth.signOut();
        throw insertError;
      }

      toast({
        title: 'Account created!',
        description: 'Your account has been successfully created.',
      });

      // After signup, we already have a session due to Supabase's auto sign-in
      await fetchUserDetails(authData.user.id);
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
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      setSession(null);
      setUserDetails(null);
      
      toast({
        title: 'Signed out',
        description: 'You have successfully signed out.',
      });
      
      navigate('/');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: 'Sign Out Failed',
        description: error.message || 'An error occurred during sign out.',
        variant: 'destructive',
      });
    } finally {
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
