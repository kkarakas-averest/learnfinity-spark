import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useHRAuth } from '@/contexts/HRAuthContext';
import { ROUTES } from '@/lib/routes';
import { LoadingSpinner } from '@/components/ui/loading-spinner'; // Assuming a loading spinner component exists

export const SuperAdminLayout: React.FC = () => {
  const { hrUser, isLoading, isAuthenticated } = useHRAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a loading indicator while authentication state is being determined
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If authenticated but not a super_admin, redirect to the main HR dashboard
  // If not authenticated, the HRAuthContext redirect should handle it, but we add a fallback.
  if (!isAuthenticated || (isAuthenticated && hrUser?.role !== 'super_admin')) {
    console.warn(
      `SuperAdminLayout: Unauthorized access attempt from path: ${location.pathname}. User role: ${hrUser?.role ?? 'guest'}`
    );
    // Redirect to HR Dashboard if logged in but wrong role, otherwise HRAuthContext handles login redirect
    const redirectPath = isAuthenticated ? ROUTES.HR_DASHBOARD : ROUTES.HR_LOGIN;
     // Use replace to avoid adding the unauthorized super-admin path to history
    return <Navigate to={redirectPath} replace />;
  }

  // Add a helper function to check active routes
  const isActiveRoute = (path: string): boolean => {
    if (path === '/super-admin') {
      return location.pathname === '/super-admin';
    }
    return location.pathname.startsWith(path);
  };

  // If authenticated and is a super_admin, render the nested routes
  return (
    <div className="flex h-screen flex-col">
      <header className="bg-gray-800 p-4 text-white flex justify-between items-center">
        <h1 className="text-xl font-semibold">Super Admin Panel</h1>
        <nav>
          <ul className="flex space-x-4">
            <li>
              <Link 
                to="/super-admin" 
                className={isActiveRoute('/super-admin') && location.pathname === '/super-admin' 
                  ? "text-blue-300 underline" 
                  : "hover:text-blue-300"}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/super-admin/companies" 
                className={isActiveRoute('/super-admin/companies') 
                  ? "text-blue-300 underline" 
                  : "hover:text-blue-300"}
              >
                Companies
              </Link>
            </li>
            <li>
              <Link 
                to="/super-admin/users" 
                className={isActiveRoute('/super-admin/users') 
                  ? "text-blue-300 underline" 
                  : "hover:text-blue-300"}
              >
                Users
              </Link>
            </li>
            <li>
              <Link 
                to="/super-admin/invite" 
                className={isActiveRoute('/super-admin/invite') 
                  ? "text-blue-300 underline" 
                  : "hover:text-blue-300"}
              >
                Invite User
              </Link>
            </li>
          </ul>
        </nav>
        {/* TODO: Add User menu/logout */}
      </header>
      <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
        <Outlet /> {/* Child routes will render here */}
      </main>
    </div>
  );
}; 