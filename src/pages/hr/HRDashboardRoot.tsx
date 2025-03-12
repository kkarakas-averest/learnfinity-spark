import React from '@/lib/react-helpers';
import { useLocation, useParams } from 'react-router-dom';
import HRDashboardHeader from '@/components/hr/HRDashboardHeader';
import DashboardSidebar from '@/components/hr/DashboardSidebar';
import { useHRAuth } from '@/state';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';

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
import AgentManagement from '@/components/hr/AgentManagement';
import LearnerProgressSummary from '@/components/hr/LearnerProgressSummary';

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
    if (path === '/hr-dashboard/agent-management') return <AgentManagement />;
    
    // Second-level pages
    if (path === '/hr-dashboard/course-builder/templates') return <CourseTemplates />;
    if (path === '/hr-dashboard/course-builder/modules') return <ModuleEditor />;
    
    // Dynamic routes
    if (path.includes('/hr-dashboard/employees/') && path.includes('/profile')) {
      // Extract the employee ID from the path
      const employeeId = path.split('/').filter(Boolean)[2];
      return <EmployeeProfilePage />;
    }
    
    if (path.startsWith('/hr-dashboard/course-builder/modules/')) {
      return <ModuleEditor />;
    }
    
    // Add a new case for 'learner-progress'
    if (path === '/hr-dashboard/learner-progress') return <LearnerProgressSummary period="month" />;
    
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