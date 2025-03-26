
import React from '@/lib/react-helpers';
import { Outlet } from 'react-router-dom';

const LearnerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* This layout will contain the learner dashboard navigation */}
      <div className="flex flex-col">
        <header className="border-b bg-white">
          <div className="container mx-auto py-4 px-6">
            <h1 className="text-2xl font-bold">Learner Dashboard</h1>
          </div>
        </header>
        <main className="container mx-auto py-6 px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LearnerLayout;
