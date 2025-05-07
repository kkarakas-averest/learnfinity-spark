import React from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { 
  Building,
  ArrowRight,
  UserPlus, 
  Users,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import HRProcessRoadmap from './HRProcessRoadmap';
import { generateEmployeeCSVTemplate } from '@/lib/utils/csvTemplates';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import EmployeeBulkImport from './EmployeeBulkImport';

const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasOrganizationStructure, setHasOrganizationStructure] = React.useState(false);
  const [showRoadmap, setShowRoadmap] = React.useState(false);
  const [onboardingInProgress, setOnboardingInProgress] = React.useState(false);
  const [onboardingStep, setOnboardingStep] = React.useState(0);
  const [totalOnboardingSteps, setTotalOnboardingSteps] = React.useState(0);
  const { toast } = useToast();

  // Check if organization has departments and positions already set up
  React.useEffect(() => {
    const checkOrganizationStructure = async () => {
      try {
        // In a real implementation, we would check if departments exist in the database
        // For now, let's use localStorage to simulate this check
        const hasSetup = localStorage.getItem('hasOrganizationSetup') === 'true';
        setHasOrganizationStructure(hasSetup);
        
        // Check if onboarding is in progress
        try {
          const onboardingData = localStorage.getItem('onboardingFlow');
          if (onboardingData) {
            const parsedData = JSON.parse(onboardingData);
            setOnboardingInProgress(true);
            setOnboardingStep(parsedData.currentStep || 0);
            setTotalOnboardingSteps(parsedData.totalSteps || 6);
          }
        } catch (err) {
          console.error('Error parsing onboarding flow data:', err);
        }
      } catch (error) {
        console.error('Error checking organization structure:', error);
      }
    };

    checkOrganizationStructure();
  }, []);

  // Function to navigate to organization setup wizard
  const navigateToOrganizationSetup = () => {
    navigate('/hr-dashboard/organization-setup');
  };
  
  // Function to continue existing onboarding flow
  const continueOnboarding = () => {
    if (onboardingStep >= 4) {
      // If we're in the employee phase (steps 4-6)
      navigate('/hr-dashboard/employees/new');
    } else {
      // If we're in the organization setup phase (steps 1-3)
      navigate('/hr-dashboard/organization-setup');
    }
  };
  
  // Function to navigate to add new employee page
  const navigateToAddEmployee = () => {
    navigate('/hr-dashboard/employees/new');
  };

  // Function to download CSV template
  const handleDownloadTemplate = () => {
    generateEmployeeCSVTemplate();
    toast({
      title: "Template Downloaded",
      description: "Employee import template has been downloaded.",
      duration: 3000,
    });
  };

  // Display loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center py-6">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome to your HR Dashboard</h2>
        <p className="text-gray-600">Manage your organization's structure and employee skills</p>
      </div>
      
      {onboardingInProgress && (
        <Card className="border-amber-200 bg-amber-50 shadow-sm mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-800">Setup in Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>You have an organization setup in progress. You're on step {onboardingStep} of {totalOnboardingSteps}.</p>
              <Button 
                variant="default" 
                className="w-full justify-start bg-amber-600 hover:bg-amber-700"
                onClick={continueOnboarding}
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                Continue Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-800">Get Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!hasOrganizationStructure && !onboardingInProgress ? (
                <Button 
                  variant="default" 
                  className="w-full justify-start"
                  onClick={navigateToOrganizationSetup}
                >
                  <Building className="mr-2 h-4 w-4" />
                  Set Up Your Organization
                </Button>
              ) : (
                <>
                  <Button 
                    variant="default" 
                    className="w-full justify-start"
                    onClick={navigateToAddEmployee}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Employee
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                      >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Bulk Import Employees
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Bulk Employee Import</DialogTitle>
                        <DialogDescription>
                          Import multiple employees at once using a CSV file
                        </DialogDescription>
                      </DialogHeader>
                      <EmployeeBulkImport />
                    </DialogContent>
                  </Dialog>
                </>
              )}
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/hr-dashboard/employees')}
              >
                <Users className="mr-2 h-4 w-4 text-blue-500" />
                View Employees
              </Button>
              
              {hasOrganizationStructure && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="mr-2 h-4 w-4 text-blue-500" />
                  Download CSV Template
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-800">HR Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {!hasOrganizationStructure 
                ? "Start by setting up your organization structure before adding employees."
                : "View the complete employee skills management process from onboarding to course generation."
              }
            </p>
            <Button 
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => setShowRoadmap(!showRoadmap)}
            >
              {showRoadmap ? 'Hide Process Roadmap' : 'View Process Roadmap'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* HR Process Roadmap conditionally shown */}
      {showRoadmap && (
        <div className="mt-6 border-t pt-6">
          <HRProcessRoadmap />
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
