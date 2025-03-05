import React from "@/lib/react-helpers";
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { User } from '@supabase/supabase-js';

// Define the HRAuthContext type
type HRAuthContextType = {
  hrUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

// Create the HRAuthContext with a default value
const HRAuthContext = createContext<HRAuthContextType>({
  hrUser: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => false, // Provide a default, no-op implementation
  logout: () => {}, // Provide a default, no-op implementation
});

// HRAuthProvider component
export const HRAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hrUser, setHRUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setHRUser(user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        toast({
          title: "Authentication Error",
          description: "Failed to load user data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) {
        console.error("Login error:", error);
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials.",
          variant: "destructive",
        });
        return false;
      }

      setHRUser(data.user);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    supabase.auth.signOut();
    setHRUser(null);
    setIsAuthenticated(false);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const value: HRAuthContextType = {
    hrUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };

  return (
    <HRAuthContext.Provider value={value}>
      {children}
    </HRAuthContext.Provider>
  );
};

// Custom hook to use the HRAuthContext
export const useHRAuth = () => {
  const context = useContext(HRAuthContext);
  if (!context) {
    throw new Error("useHRAuth must be used within a HRAuthProvider");
  }
  return context;
};
