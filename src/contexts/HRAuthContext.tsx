// add console logs to help debug navigation issues
import * as React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/routes";

// Define the HR user type
interface HRUser {
  username: string;
  role: "hr";
}

// Define the context type
interface HRAuthContextProps {
  hrUser: HRUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Create the context with a default value
const HRAuthContext = createContext<HRAuthContextProps>({
  hrUser: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
});

// Create a custom hook to use the context
export const useHRAuth = () => useContext(HRAuthContext);

// Create the provider component
export const HRAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hrUser, setHRUser] = useState<HRUser | null>(() => {
    const storedUser = localStorage.getItem("hrUser");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!!hrUser);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user is already authenticated on component mount
    if (hrUser) {
      setIsAuthenticated(true);
    }
  }, [hrUser]);

  // Add debugging logs to login/logout functions
  const login = async (username, password) => {
    console.log("HRAuthContext: Attempting login");
    try {
      // Simulate authentication logic (replace with actual authentication)
      if (username === "hr" && password === "password") {
        console.log("HRAuthContext: Setting user state after successful login");
        setHRUser({ username, role: "hr" });
        setIsAuthenticated(true);
        localStorage.setItem("hrUser", JSON.stringify({ username, role: "hr" }));
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
    setIsAuthenticated(false);
    localStorage.removeItem("hrUser");
    navigate(ROUTES.HR_LOGIN);
  };

  const value: HRAuthContextProps = {
    hrUser,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <HRAuthContext.Provider value={value}>{children}</HRAuthContext.Provider>
  );
};
