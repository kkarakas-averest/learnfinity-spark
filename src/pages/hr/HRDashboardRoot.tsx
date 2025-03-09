import React from '@/lib/react-helpers';
import { useLocation, useParams } from 'react-router-dom';
import HRDashboardHeader from '@/components/hr/HRDashboardHeader';
import DashboardSidebar from '@/components/hr/DashboardSidebar';
import { useHRAuth } from '@/state';

// Import all pages
import HRDashboardMigrated from '@/pages/HRDashboardMigrated';
import EmployeesPage from '@/pages/hr/EmployeesPage';
import ProgramsPage from '@/pages/hr/ProgramsPage';
import ReportsPage from '@/pages/hr/ReportsPage';
import SettingsPage from '@/pages/hr/SettingsPage';
import EmployeeProfilePage from '@/pages/hr/EmployeeProfilePage';
import CourseBuilderPage from '@/pages/hr/CourseBuilderPage';
import CourseTemplates from '@/pages/hr/CourseTemplates';
import ModuleEditor from '@/pages/hr/ModuleEditor';

/**
 * Root layout component for the HR Dashboard
 * Provides the common header and sidebar while rendering content based on path
 */
const HRDashboardRoot: React.FC = () => {
  const { hrUser, logout } = useHRAuth();
  const location = useLocation();
  const params = useParams();
  
  console.log('HRDashboardRoot - Path:', location.pathname);
  console.log('HRDashboardRoot - Params:', params);

  // Handle logout
  const handleLogout = () => {
    logout();
  };
  
  // Render the appropriate component based on the path
  const renderContent = () => {
    const path = location.pathname;
    
    // Index page
    if (path === '/hr-dashboard') {
      return <HRDashboardMigrated />;
    }
    
    // First-level pages
    if (path === '/hr-dashboard/employees') return <EmployeesPage />;
    if (path === '/hr-dashboard/programs') return <ProgramsPage />;
    if (path === '/hr-dashboard/reports') return <ReportsPage />;
    if (path === '/hr-dashboard/settings') return <SettingsPage />;
    if (path === '/hr-dashboard/course-builder') return <CourseBuilderPage />;
    
    // Second-level pages
    if (path === '/hr-dashboard/course-builder/templates') return <CourseTemplates />;
    if (path === '/hr-dashboard/course-builder/modules') return <ModuleEditor />;
    
    // Dynamic routes
    if (path.startsWith('/hr-dashboard/employees/') && path.endsWith('/profile')) {
      return <EmployeeProfilePage />;
    }
    
    if (path.startsWith('/hr-dashboard/course-builder/modules/')) {
      return <ModuleEditor />;
    }
    
    // Default to dashboard
    return <HRDashboardMigrated />;
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
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default HRDashboardRoot; 