import React from 'react';
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
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};

export default HRAuth; 