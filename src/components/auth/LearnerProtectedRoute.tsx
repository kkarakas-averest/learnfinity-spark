
import React from '@/lib/react-helpers';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

// This is a temporary placeholder for the real authentication logic
const useLearnerAuth = () => ({
  isAuthenticated: true, // For testing purposes, assume authenticated
  isLoading: false
});

interface LearnerProtectedRouteProps {
  children: React.ReactNode;
}

const LearnerProtectedRoute: React.FC<LearnerProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useLearnerAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  
  return <>{children}</>;
};

export default LearnerProtectedRoute;
