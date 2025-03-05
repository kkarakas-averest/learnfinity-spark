// add console logs to help debug navigation issues
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/routes";

// Define the HR user type
interface HRUser {
  username: string;
  role: "hr";
}

// Define the context properties
interface HRAuthContextProps {
  hrUser: HRUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Create the context with a default value
const HRAuthContext = React.createContext<HRAuthContextProps>({
  hrUser: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
});

// Create a hook for easier context access
export const useHRAuth = () => React.useContext(HRAuthContext);

// Create the provider component
export const HRAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const [hrUser, setHRUser] = React.useState<HRUser | null>(null);
  
  // Check for saved auth state on mount
  React.useEffect(() => {
    const storedHRUser = localStorage.getItem("hrUser");
    if (storedHRUser) {
      try {
        setHRUser(JSON.parse(storedHRUser));
      } catch (error) {
        console.error("Failed to parse stored HR user:", error);
        localStorage.removeItem("hrUser");
      }
    }
  }, []);

  // Add debugging logs to login/logout functions
  const login = async (username: string, password: string) => {
    console.log("HRAuthContext: Attempting login");
    try {
      // Simulate authentication logic (replace with actual authentication)
      if (username === "hr" && password === "password") {
        console.log("HRAuthContext: Setting user state after successful login");
        setHRUser({ username, role: "hr" });
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
    localStorage.removeItem("hrUser");
    navigate(ROUTES.HR_LOGIN);
  };

  const value: HRAuthContextProps = {
    hrUser,
    isAuthenticated: !!hrUser,
    login,
    logout,
  };

  return (
    <HRAuthContext.Provider value={value}>{children}</HRAuthContext.Provider>
  );
};
