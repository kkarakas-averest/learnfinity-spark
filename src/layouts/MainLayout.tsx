
import React from '@/lib/react-helpers';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

/**
 * Main layout component that wraps all pages
 * Provides consistent structure for the application
 */
const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content area */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
};

export default MainLayout;
