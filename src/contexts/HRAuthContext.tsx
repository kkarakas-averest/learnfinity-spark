import React, { createContext, useContext, useState, useEffect, useCallback } from '@/lib/react-helpers';
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { toast } from "@/components/ui/use-toast";
import { useSupabaseClient, Session } from '@supabase/auth-helpers-react'; // Assume this hook exists
import { Database } from '@/types/supabase'; // Assuming you have generated types
import type { AuthChangeEvent } from '@supabase/supabase-js'; // Import type for event

// Define the HR user type - extended for B2B
type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
interface B2BUser extends UserProfile {
  // Inherits id, company_id, role, full_name, phone, status, created_at, updated_at
  // Add email from auth.users if needed separately
  email?: string;
}

// Define the context properties
interface HRAuthContextProps {
  hrUser: B2BUser | null;
  session: Session | null; // Keep track of Supabase session
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

// Create the context with a default value
const HRAuthContext = createContext<HRAuthContextProps>({
  hrUser: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false, error: 'Not initialized' }),
  logout: async () => {},
});

// Create a hook for easier context access
export const useHRAuth = () => useContext(HRAuthContext);

// Create the provider component
export const HRAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}: { children: React.ReactNode }) => {
  const supabase = useSupabaseClient<Database>(); // Get Supabase client
  const navigate = useNavigate();
  const location = useLocation();
  const [hrUser, setHrUser] = useState<B2BUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile based on user ID
  const fetchUserProfile = useCallback(async (userId: string): Promise<B2BUser | null> => {
    console.log("HRAuthContext: Fetching profile for user ID:", userId);
    try {
      const { data, error, status } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && status !== 406) { // 406 means no rows found, which is okay
        console.error("HRAuthContext: Error fetching profile:", error);
        throw error;
      }

      if (data) {
        console.log("HRAuthContext: Profile data found:", data);
        return data as B2BUser;
      } else {
        console.log("HRAuthContext: No profile found for user ID:", userId);
        return null; // No profile found for this user yet
      }
    } catch (error) {
      console.error("HRAuthContext: Exception fetching profile:", error);
      toast({
        title: "Error loading user data",
        description: "Could not fetch user profile.",
        variant: "destructive",
      });
      return null;
    }
  }, [supabase]);


  // Effect to handle auth state changes
  useEffect(() => {
    console.log("HRAuthContext: Setting up auth state listener");
    setIsLoading(true);

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }: { data: { session: Session | null } }) => {
      console.log("HRAuthContext: Initial session:", initialSession);
      setSession(initialSession);
      if (initialSession?.user) {
        const profile = await fetchUserProfile(initialSession.user.id);
        // Include email from the auth user object if needed
        if (profile) {
          setHrUser({ ...profile, email: initialSession.user.email });
        } else {
           setHrUser(null); // No profile yet, maybe redirect or show message?
           // This could happen if the profile creation trigger hasn't run yet
        }
      } else {
        setHrUser(null);
      }
      setIsLoading(false);
    });

    // Listen for future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log("HRAuthContext: Auth state changed:", event, session);
        setSession(session);
        if (event === 'SIGNED_IN' && session?.user) {
          setIsLoading(true);
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
             setHrUser({ ...profile, email: session.user.email });
          } else {
             setHrUser(null); // Handle case where profile might not exist immediately
          }
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setHrUser(null);
          setIsLoading(false);
        }
        // Handle other events like USER_UPDATED if necessary
      }
    );

    // Cleanup listener on unmount
    return () => {
      console.log("HRAuthContext: Unsubscribing auth listener");
      subscription?.unsubscribe();
    };
  }, [supabase, fetchUserProfile]);


  // Redirect logic for HR protected routes (keep or adjust as needed)
  useEffect(() => {
    // Only redirect if loading is finished
    if (!isLoading) {
      const isHRRoute = location.pathname.startsWith('/hr-dashboard') || location.pathname.startsWith('/super-admin'); // Adjust protected routes
      const isLoginPage = location.pathname === ROUTES.HR_LOGIN;

      console.log("HRAuthContext: Path:", location.pathname, "isHRRoute:", isHRRoute, "isAuthenticated:", !!hrUser, "isLoginPage:", isLoginPage);


      if (isHRRoute && !hrUser && !isLoginPage) {
        console.log("HRAuthContext: Redirecting to login from protected route");
        navigate(ROUTES.HR_LOGIN);
        // toast({
        //   title: "Authentication required",
        //   description: "Please log in to access this area.",
        //   variant: "destructive"
        // });
      } else if (isLoginPage && hrUser) {
        // Optional: Redirect away from login page if already authenticated
         console.log("HRAuthContext: Already logged in, redirecting from login page");
         // Determine redirect based on role?
         if (hrUser.role === 'super_admin') {
             navigate('/super-admin'); // Example redirect for super admin
         } else {
             navigate('/hr-dashboard'); // Default redirect
         }
      }
    }
  }, [location.pathname, hrUser, isLoading, navigate]);

  // Login function using Supabase
  const login = async (email: string, password: string) => {
    console.log("HRAuthContext: Attempting Supabase login for:", email);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error("HRAuthContext: Supabase login error:", error);
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return { success: false, error: error.message };
      }

      // Success: onAuthStateChange listener will handle setting user state
      console.log("HRAuthContext: Supabase sign-in successful, waiting for state change.");
       // Don't set loading false here, let the listener handle it
      return { success: true };

    } catch (error: any) {
      console.error("HRAuthContext: Unexpected login error:", error);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      setIsLoading(false);
      return { success: false, error: error.message || 'Unexpected error' };
    }
  };

  // Logout function using Supabase
  const logout = async () => {
    console.log("HRAuthContext: Attempting Supabase logout");
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("HRAuthContext: Supabase logout error:", error);
      toast({
        title: "Logout Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      console.log("HRAuthContext: Supabase logout successful");
      setHrUser(null); // Clear user immediately
      setSession(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out."
      });
      navigate(ROUTES.HR_LOGIN); // Navigate after state is cleared
    }
    setIsLoading(false); // Set loading false after operation completes
  };

  const value: HRAuthContextProps = {
    hrUser,
    session,
    isAuthenticated: !!hrUser && !!session, // User is authenticated if we have profile and session
    isLoading,
    login,
    logout,
  };

  return (
    <HRAuthContext.Provider value={value}>{children}</HRAuthContext.Provider>
  );
};
