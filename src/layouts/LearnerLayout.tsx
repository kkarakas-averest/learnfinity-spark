
import React from '@/lib/react-helpers';
import { Outlet } from 'react-router-dom';

const LearnerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* This could include learner-specific navigation */}
      <div className="flex min-h-screen">
        <div className="w-64 border-r bg-background p-4">
          <h2 className="font-semibold mb-4">Learner Dashboard</h2>
          <nav className="space-y-2">
            <a href="/learner-dashboard" className="block p-2 hover:bg-secondary rounded">Dashboard</a>
            <a href="/learner-dashboard/courses" className="block p-2 hover:bg-secondary rounded">My Courses</a>
            <a href="/learner-dashboard/profile" className="block p-2 hover:bg-secondary rounded">Profile</a>
          </nav>
        </div>
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LearnerLayout;
