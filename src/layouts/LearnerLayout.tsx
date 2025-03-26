
import React from '@/lib/react-helpers';
import { Outlet } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';

/**
 * Layout component for Learner pages
 * Provides consistent structure for learner-specific pages
 */
const LearnerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main content area */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  );
};

export default LearnerLayout;
