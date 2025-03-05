import React, { createContext, useContext, useState, useEffect } from '@/lib/react-helpers';
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { toast } from "@/components/ui/use-toast";

// Define the HR user type
interface HRUser {
  username: string;
  role: "hr";
}

// Define the context properties
interface HRAuthContextProps {
  hrUser: HRUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Create the context with a default value
const HRAuthContext = createContext<HRAuthContextProps>({
  hrUser: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: () => {},
});

// Create a hook for easier context access
export const useHRAuth = () => useContext(HRAuthContext);

// Create the provider component
export const HRAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hrUser, setHRUser] = useState<HRUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check for saved auth state on mount
  useEffect(() => {
    console.log("HRAuthContext: Initializing, checking for stored user");
    const storedHRUser = localStorage.getItem("hrUser");
    
    if (storedHRUser) {
      try {
        const parsedUser = JSON.parse(storedHRUser);
        console.log("HRAuthContext: Found stored user", parsedUser);
        setHRUser(parsedUser);
      } catch (error) {
        console.error("HRAuthContext: Failed to parse stored HR user:", error);
        localStorage.removeItem("hrUser");
      }
    } else {
      console.log("HRAuthContext: No stored user found");
    }
    
    setIsLoading(false);
  }, []);

  // Log when current path changes for debugging
  useEffect(() => {
    console.log("HRAuthContext: Current path:", location.pathname);
    console.log("HRAuthContext: Authentication state:", !!hrUser);
    
    // Redirect logic for HR protected routes
    const isHRRoute = location.pathname.startsWith('/hr-dashboard');
    if (isHRRoute && !hrUser && !isLoading && location.pathname !== ROUTES.HR_LOGIN) {
      console.log("HRAuthContext: Redirecting to login from protected route");
      navigate(ROUTES.HR_LOGIN);
      toast({
        title: "Authentication required",
        description: "Please log in to access the HR dashboard",
        variant: "destructive"
      });
    }
  }, [location.pathname, hrUser, isLoading, navigate]);

  const login = async (username: string, password: string) => {
    console.log("HRAuthContext: Attempting login");
    try {
      // Simulate authentication logic (replace with actual authentication)
      if (username === "hr" && password === "password") {
        console.log("HRAuthContext: Login successful");
        const user = { username, role: "hr" as const };
        
        // Set user in state and localStorage
        setHRUser(user);
        localStorage.setItem("hrUser", JSON.stringify(user));
        
        // Show success toast
        toast({
          title: "Login successful",
          description: "Welcome to the HR dashboard"
        });
        
        return true;
      } else {
        console.log("HRAuthContext: Invalid credentials");
        return false;
      }
    } catch (error) {
      console.error("HRAuthContext: Login error:", error);
      return false;
    }
  };

  const logout = () => {
    console.log("HRAuthContext: Logging out");
    setHRUser(null);
    localStorage.removeItem("hrUser");
    
    // Show logout toast
    toast({
      title: "Logged out",
      description: "You have been logged out of the HR system"
    });
    
    // Navigate to login page
    navigate(ROUTES.HR_LOGIN);
  };

  const value: HRAuthContextProps = {
    hrUser,
    isAuthenticated: !!hrUser,
    isLoading,
    login,
    logout,
  };

  return (
    <HRAuthContext.Provider value={value}>{children}</HRAuthContext.Provider>
  );
};
