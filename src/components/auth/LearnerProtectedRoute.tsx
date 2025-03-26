
import React from '@/lib/react-helpers';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

// This is a simplified version - in a real app, this would check authentication status
const LearnerProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = true; // This would normally check authentication status
  
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  
  return <>{children}</>;
};

export default LearnerProtectedRoute;
