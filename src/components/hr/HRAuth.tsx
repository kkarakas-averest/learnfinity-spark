import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface HRAuthProps {
  children: React.ReactNode;
}

/**
 * Component that checks if the user is authenticated as HR
 * and redirects to login if not. This handles the HR authentication
 * logic in a reusable way.
 */
const HRAuth: React.FC<HRAuthProps> = ({ children }) => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkHRAuth = () => {
      try {
        console.log("HRAuth: Checking HR authentication");
        const userStr = localStorage.getItem("currentUser");
        
        if (!userStr) {
          console.log("HRAuth: No user found in localStorage");
          navigate('/hr-login');
          return false;
        }
        
        const user = JSON.parse(userStr);
        console.log("HRAuth: Found user with role:", user.role);
        
        if (user.role !== 'hr') {
          console.log("HRAuth: User is not HR, redirecting to login");
          navigate('/hr-login');
          return false;
        }
        
        console.log("HRAuth: User is authorized as HR");
        return true;
      } catch (error) {
        console.error("HRAuth: Error checking authentication", error);
        navigate('/hr-login');
        return false;
      }
    };

    const isAuth = checkHRAuth();
    setIsAuthorized(isAuth);
    setIsLoading(false);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
};

export default HRAuth; 