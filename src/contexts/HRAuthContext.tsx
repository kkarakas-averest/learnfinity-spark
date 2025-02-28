import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HRUser, HRAuthContext as HRAuthContextType } from '@/types/hr.types';
import { useToast } from '@/hooks/use-toast';

// Hardcoded HR credentials
const HR_CREDENTIALS = {
  username: "adminhr",
  password: "adminhr"
};

// Create context with default values
const HRAuthContext = createContext<HRAuthContextType>({
  currentUser: null,
  isLoading: false,
  isAuthenticated: false,
  login: async () => { throw new Error('HRAuthContext not initialized'); },
  logout: () => {},
});

export const HRAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<HRUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for existing login on mount
  useEffect(() => {
    const checkExistingLogin = () => {
      try {
        const userStr = localStorage.getItem("currentUser");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.role === "hr") {
            setCurrentUser(user);
          }
        }
      } catch (error) {
        console.error("Error checking existing login:", error);
        localStorage.removeItem("currentUser");
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingLogin();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<HRUser> => {
    setIsLoading(true);
    
    try {
      // Check against hardcoded credentials
      if (username === HR_CREDENTIALS.username && password === HR_CREDENTIALS.password) {
        // Create HR user object
        const hrUser: HRUser = {
          id: "hr-admin-id",
          name: "HR Administrator",
          email: "hr@learnfinity.com",
          role: "hr"
        };
        
        // Store in localStorage
        localStorage.setItem("currentUser", JSON.stringify(hrUser));
        
        // Update state
        setCurrentUser(hrUser);
        
        // Success message
        toast({
          title: "HR Login Successful",
          description: "Welcome to the HR dashboard",
        });
        
        return hrUser;
      } else {
        throw new Error("Invalid HR credentials");
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Authentication failed",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    navigate('/hr-login');
  };

  return (
    <HRAuthContext.Provider value={{
      currentUser,
      isLoading,
      isAuthenticated: !!currentUser,
      login,
      logout
    }}>
      {children}
    </HRAuthContext.Provider>
  );
};

// Custom hook for using the HR auth context
export const useHRAuth = () => {
  const context = useContext(HRAuthContext);
  if (context === undefined) {
    throw new Error('useHRAuth must be used within an HRAuthProvider');
  }
  return context;
}; 