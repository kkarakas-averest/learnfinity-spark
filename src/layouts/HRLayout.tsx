
import React from '@/lib/react-helpers';
import { Outlet } from 'react-router-dom';
import DashboardSidebar from '@/components/hr/DashboardSidebar';

const HRLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default HRLayout;
