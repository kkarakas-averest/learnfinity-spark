import React from 'react';
import { User } from '@/types/hr.types';

// Define context types
interface HRAuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create the context with default values
const HRAuthContext = React.createContext<HRAuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {},
  logout: () => {},
});

// Custom hook for using the auth context
export const useHRAuth = () => React.useContext(HRAuthContext);

interface HRAuthProviderProps {
  children: React.ReactNode;
}

export const HRAuthProvider: React.FC<HRAuthProviderProps> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Check for existing session on mount
  React.useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const storedUser = localStorage.getItem('hrUser');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error checking HR auth status:', error);
        localStorage.removeItem('hrUser');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Hard-coded credentials for demo
  const ADMIN_USERNAME = 'adminhr';
  const ADMIN_PASSWORD = 'adminhr';

  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    return new Promise((resolve, reject) => {
      // Simulate API delay
      setTimeout(() => {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          const hrUser: User = {
            id: '1',
            name: 'HR Admin',
            email: 'hr@learnfinity.com',
            role: 'hr',
          };
          
          // Store in localStorage
          localStorage.setItem('hrUser', JSON.stringify(hrUser));
          setUser(hrUser);
          setIsLoading(false);
          console.log('HR Login successful');
          resolve();
        } else {
          setIsLoading(false);
          console.log('HR Login failed');
          reject(new Error('Invalid credentials'));
        }
      }, 800);
    });
  };

  const logout = () => {
    localStorage.removeItem('hrUser');
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
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

export default HRAuthProvider; 