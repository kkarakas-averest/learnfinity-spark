import React from '@/lib/react-helpers';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import HRDashboardHeader from '@/components/hr/HRDashboardHeader';
import DashboardSidebar from '@/components/hr/DashboardSidebar';
import { useHRAuth } from '@/state';
import { Button } from '@/components/ui/button';
import { Activity } from 'lucide-react';
import { hrServices } from '@/services/hrServices';
import { motion, AnimatePresence } from 'framer-motion';

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
import LearnerProgressSummary from '@/components/hr/LearnerProgressSummary';
import AddEmployeeForm from '@/pages/hr/AddEmployeeForm';
import CreateEmployeePage from '@/components/hr/CreateEmployeePage';
import SkillsInventoryPage from '@/pages/hr/SkillsInventoryPage';
import CourseGeneratorPage from '@/pages/hr/CourseGeneratorPage';
import PositionRequirementsPage from '@/pages/hr/PositionRequirementsPage';
import OrganizationSetupWizard from '@/components/hr/OrganizationSetupWizard';

/**
 * Root layout component for the HR Dashboard
 * Provides the common header and sidebar while rendering content based on path
 */
const HRDashboardRoot: React.FC = () => {
  const { hrUser, logout } = useHRAuth();
  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();
  const [isFirstLogin, setIsFirstLogin] = React.useState(false);
  const [hasCheckedFirstLogin, setHasCheckedFirstLogin] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  
  console.log('HRDashboardRoot - Path:', location.pathname);
  console.log('HRDashboardRoot - Params:', params);

  // Check if this is the user's first login by checking if there are any employees
  React.useEffect(() => {
    // Skip check if not on the main dashboard page
    if (location.pathname !== '/hr-dashboard') {
      setHasCheckedFirstLogin(true);
      return;
    }
    
    const checkFirstLogin = async () => {
      try {
        // Check if there are any employees in the system
        const result = await hrServices.getDashboardMetrics();
        
        if (result && result.success && result.metrics) {
          const hasEmployees = result.metrics.activeEmployees > 0;
          setIsFirstLogin(!hasEmployees);
          
          // Auto-redirect to add employee page if this is the first login
          // and we're on the main dashboard page
          if (!hasEmployees && location.pathname === '/hr-dashboard') {
            // Small delay to ensure the user sees the dashboard briefly
            setTimeout(() => {
              navigate('/hr-dashboard/employees/new');
            }, 500);
          }
        }
      } catch (error) {
        console.error('Error checking first login status:', error);
      } finally {
        setHasCheckedFirstLogin(true);
      }
    };
    
    checkFirstLogin();
  }, [location.pathname, navigate]);

  // Handle logout
  const handleLogout = () => {
    logout();
  };
  
  // Handle toggling the sidebar
  const handleToggleSidebar = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
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
    if (path === '/hr-dashboard/skills-inventory') return <SkillsInventoryPage />;
    if (path === '/hr-dashboard/positions/requirements') return <PositionRequirementsPage />;
    if (path === '/hr-dashboard/course-generator') return <CourseGeneratorPage />;
    if (path === '/hr-dashboard/organization-setup') return <OrganizationSetupWizard />;
    
    // Second-level pages
    if (path === '/hr-dashboard/course-builder/templates') return <CourseTemplates />;
    if (path === '/hr-dashboard/course-builder/modules') return <ModuleEditor />;
    
    // Dynamic routes
    if (path.includes('/hr-dashboard/employees/') && path.includes('/profile')) {
      // Extract the employee ID from the path
      const employeeId = path.split('/').filter(Boolean)[2];
      return <EmployeeProfilePage />;
    }
    
    // Handle direct employee profile URLs
    if (path.match(/^\/hr-dashboard\/employees\/[^/]+$/)) {
      const employeeId = path.split('/').pop();
      console.log('Loading employee profile with ID:', employeeId);
      
      // If the ID is "new", render the CreateEmployeePage
      if (employeeId === 'new') {
        return <CreateEmployeePage />;
      }
      
      // Otherwise render the EmployeeProfilePage with the specific ID
      return <EmployeeProfilePage key={employeeId} employeeId={employeeId} />; // Pass employeeId as prop
    }
    
    if (path.startsWith('/hr-dashboard/course-builder/modules/')) {
      return <ModuleEditor />;
    }
    
    // Add a new case for 'learner-progress'
    if (path === '/hr-dashboard/learner-progress') return <LearnerProgressSummary period="month" />;
    
    // Default to dashboard
    return <HRDashboardMigrated />;
  };

  // Display a simple loading state until we check for first login
  if (!hasCheckedFirstLogin && location.pathname === '/hr-dashboard') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HRDashboardHeader 
        username={hrUser?.username || "HR Admin"} 
        onLogout={handleLogout} 
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Pass sidebar collapsed state handler to the sidebar component */}
        <DashboardSidebar onToggleCollapse={handleToggleSidebar} />
        
        <motion.main 
          className="flex-1 overflow-y-auto p-6"
          initial={{ marginLeft: "0" }}
          animate={{ 
            marginLeft: "0",
            width: "100%" 
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {renderContent()}
        </motion.main>
      </div>
    </div>
  );
};

export default HRDashboardRoot; 