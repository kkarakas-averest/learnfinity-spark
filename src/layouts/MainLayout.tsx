
import React from '@/lib/react-helpers';
import { Outlet } from 'react-router-dom';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* This layout could include global navigation, header, footer, etc. */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
