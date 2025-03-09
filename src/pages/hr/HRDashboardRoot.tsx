import React from '@/lib/react-helpers';
import { Outlet } from 'react-router-dom';
import HRDashboardHeader from '@/components/hr/HRDashboardHeader';
import DashboardSidebar from '@/components/hr/DashboardSidebar';
import { useHRAuth } from '@/state';

/**
 * Root layout component for the HR Dashboard
 * Provides the common header and sidebar while rendering child routes in the Outlet
 */
const HRDashboardRoot: React.FC = () => {
  const { hrUser, logout } = useHRAuth();

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HRDashboardHeader 
        username={hrUser?.username || "HR Admin"} 
        onLogout={handleLogout} 
      />
      
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default HRDashboardRoot; 