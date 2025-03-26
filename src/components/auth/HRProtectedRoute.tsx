
import React from '@/lib/react-helpers';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

// This is a temporary placeholder for the real authentication logic
const useHRAuth = () => ({
  isAuthenticated: true, // For testing purposes, assume authenticated
  isLoading: false
});

interface HRProtectedRouteProps {
  children: React.ReactNode;
}

const HRProtectedRoute: React.FC<HRProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useHRAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.HR_LOGIN} replace />;
  }
  
  return <>{children}</>;
};

export default HRProtectedRoute;
