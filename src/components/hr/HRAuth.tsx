import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useHRAuth } from '@/contexts/HRAuthContext';

interface HRAuthProps {
  children: React.ReactNode;
}

/**
 * Component that checks if the user is authenticated as HR
 * and redirects to login if not. This handles the HR authentication
 * logic in a reusable way.
 */
const HRAuth: React.FC<HRAuthProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useHRAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/hr-login" />;
  }

  return <>{children}</>;
};

export default HRAuth; 