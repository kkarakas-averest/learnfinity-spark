import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import EmployeeProfileForm from './EmployeeProfileForm';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { hrDepartmentService } from '@/services/hrDepartmentService';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PageHeader } from '@/components/PageHeader';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from '@/components/ui/alert';
import { Copy, Info, Wrench, AlertCircle } from 'lucide-react';

const CreateEmployeePage = () => {
  // For debugging
  console.log('=== Rendering CreateEmployeePage with diagnostic button ===');
  
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [showCredentials, setShowCredentials] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [testResults, setTestResults] = useState(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  useEffect(() => {
    const checkDatabaseAndFetchData = async () => {
      try {
        setIsDataLoading(true);
        
        // Check if all HR tables exist
        const { exists, missingTables } = await hrEmployeeService.checkHRTablesExist();
        if (!exists) {
          toast.error(
            `Database tables missing: ${missingTables.join(', ')}`,
            { 
              description: 'Please run the SQL initialization script in Supabase', 
              duration: 10000 
            }
          );
          return;
        }
        
        // Fetch departments
        const { data: departmentsData, error: departmentsError } = 
          await hrDepartmentService.getDepartments();
        
        if (departmentsError) {
          console.error('Error fetching departments:', departmentsError);
          toast.error('Failed to load departments. Please check the console for details.');
          throw departmentsError;
        }
        setDepartments(departmentsData || []);
        
        // Fetch positions
        const { data: positionsData, error: positionsError } = 
          await hrDepartmentService.getPositions();
        
        if (positionsError) {
          console.error('Error fetching positions:', positionsError);
          toast.error('Failed to load positions. Please check the console for details.');
          throw positionsError;
        }
        setPositions(positionsData || []);
        
      } catch (error) {
        console.error('Error in checkDatabaseAndFetchData:', error);
        toast.error('Failed to initialize. Please check the console for details.');
      } finally {
        setIsDataLoading(false);
      }
    };
    
    checkDatabaseAndFetchData();
  }, []);
  
  // Add an effect to run the API test once after a short delay
  useEffect(() => {
    // Wait 3 seconds then automatically run the API test
    const timer = setTimeout(() => {
      console.log('Automatically running API test on component mount...');
      runApiTest();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      
      // Create the employee data object
      const employeeData = {
        name: formData.name,
        email: formData.email,
        department_id: formData.department,
        position_id: formData.position,
        status: 'active',
        phone: formData.phone || null
      };
      
      // Create the employee with user account
      const { data, error, userAccount, authError } = await hrEmployeeService.createEmployeeWithUserAccount(employeeData);
      
      setIsLoading(false);
      
      if (error) {
        console.error('Error creating employee:', error);
        
        // Show a more helpful error message
        let errorMessage = 'Failed to create employee.';
        
        if (error.message) {
          if (error.message.includes('hr_employees table does not exist')) {
            errorMessage = 'Database setup issue: HR tables not initialized. Please contact your system administrator.';
          } else if (error.message.includes('duplicate key')) {
            errorMessage = 'An employee with this email already exists.';
          } else {
            errorMessage = error.message;
          }
        }
        
        toast.error(errorMessage);
        throw error;
      }
      
      if (userAccount && userAccount.email && userAccount.tempPassword) {
        // Set credentials from userAccount response
        setCredentials({
          email: userAccount.email,
          tempPassword: userAccount.tempPassword,
          id: userAccount.id
        });
        setShowCredentials(true);
      } else if (authError) {
        toast.warning(
          'Employee created, but failed to create user account',
          { description: authError.message || 'Please create the user account manually.' }
        );
        setTimeout(() => navigate(ROUTES.HR_DASHBOARD_EMPLOYEES), 3000);
      } else {
        toast.success('Employee created successfully!');
        navigate(ROUTES.HR_DASHBOARD_EMPLOYEES);
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      // Error is already handled above, no need to show a duplicate toast
      setIsLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (credentials) {
      navigator.clipboard.writeText(
        `Email: ${credentials.email}\nPassword: ${credentials.tempPassword}`
      );
      toast.success('Credentials copied to clipboard');
    }
  };

  const handleCloseCredentialsDialog = () => {
    setShowCredentials(false);
    setCredentials(null);
    navigate(ROUTES.HR_DASHBOARD_EMPLOYEES);
  };

  const handleGoToLearnerDashboard = () => {
    if (credentials) {
      // Store the credentials in localStorage for the login page to use
      localStorage.setItem('pendingAutoLogin', JSON.stringify({
        email: credentials.email,
        password: credentials.tempPassword
      }));
      
      // Close the dialog and redirect to the login page
      setShowCredentials(false);
      setCredentials(null);
      
      // Show a toast indicating what's happening
      toast.info('Redirecting to login page for learner access...');
      
      // Navigate to the login page, which will detect and use the stored credentials
      window.location.href = '/login?autoLogin=true';
    }
  };

  const runApiTest = async () => {
    try {
      console.log('API test button clicked!');
      toast.info('Starting API diagnostics test...', { duration: 5000 });
      
      setIsTestingApi(true);
      setTestResults(null);
      
      console.log('Calling hrEmployeeService.testMinimalApiRequest()...');
      const results = await hrEmployeeService.testMinimalApiRequest();
      console.log('API test results received:', results);
      
      setTestResults(results);
      
      if (results.success) {
        toast.success('API test successful!');
      } else {
        toast.error('API test failed. Check console for details.');
      }
    } catch (error) {
      console.error('Error running API test:', error);
      setTestResults({ success: false, error, responseText: error.message });
      toast.error('API test error: ' + error.message);
    } finally {
      setIsTestingApi(false);
    }
  };
  
  // Add a global function to run the API test from the console
  // This provides a fallback method if the button doesn't work
  useEffect(() => {
    window.runHrApiTest = runApiTest;
    console.log('Global function window.runHrApiTest() is now available in the console');
    
    return () => {
      delete window.runHrApiTest;
    };
  }, []);

  return (
    <div className="container mx-auto p-4">
      <PageHeader
        title="Create New Employee"
        description="Add a new employee to the HR system"
        backButton={{
          label: 'Back to Employees',
          to: ROUTES.HR_DASHBOARD_EMPLOYEES
        }}
      />
      
      {isDataLoading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="mb-6 bg-blue-50 p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-3">API Diagnostics</h3>
            <Button 
              variant="default" 
              onClick={runApiTest} 
              disabled={isTestingApi}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Wrench className="h-4 w-4" />
              {isTestingApi ? 'Testing API...' : 'Run API Diagnostics'}
            </Button>
            
            {testResults && (
              <div className="mt-4 p-4 border rounded-md bg-muted/30">
                <h3 className="text-lg font-medium mb-2">
                  API Test Results
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${testResults.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {testResults.success ? 'SUCCESS' : 'FAILED'}
                  </span>
                </h3>
                {testResults.responseText && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium">Response:</h4>
                    <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto max-h-32">
                      {testResults.responseText}
                    </pre>
                  </div>
                )}
                {testResults.error && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium text-red-600">Error:</h4>
                    <pre className="text-xs mt-1 p-2 bg-red-50 text-red-900 rounded overflow-auto max-h-32">
                      {JSON.stringify(testResults.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <EmployeeProfileForm 
            onSubmit={handleSubmit} 
            isLoading={isLoading}
            departments={departments}
            positions={positions}
          />
        </>
      )}

      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Account Created</DialogTitle>
            <DialogDescription>
              A learning platform account has been created for this employee.
              Please save or share these credentials securely with the employee.
            </DialogDescription>
          </DialogHeader>
          
          {credentials && (
            <div className="space-y-4 py-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>User Credentials</AlertTitle>
                <AlertDescription className="mt-2">
                  <div><strong>Email:</strong> {credentials.email}</div>
                  <div><strong>Temporary Password:</strong> {credentials.tempPassword}</div>
                </AlertDescription>
              </Alert>
              
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  This temporary password is only displayed once. Please copy it and share it with the employee securely.
                  The employee should change this password after first login.
                </AlertDescription>
              </Alert>
              
              {enrolledCourses.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Enrolled Courses:</h4>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {enrolledCourses.map((course, index) => (
                      <li key={index}>{course}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground">
                These credentials will not be shown again. Please make sure to save them securely.
              </p>
            </div>
          )}
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleCopyCredentials} className="flex gap-2">
              <Copy className="h-4 w-4" />
              Copy Credentials
            </Button>
            <Button variant="outline" onClick={handleGoToLearnerDashboard} className="flex gap-2">
              <Info className="h-4 w-4" />
              Go to Learner Dashboard
            </Button>
            <Button onClick={handleCloseCredentialsDialog}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Make availableCourses accessible for the component
const availableCourses = [
  { id: 'course-1', title: 'Cybersecurity for Fintech', description: 'Essential security practices for fintech industry' },
  { id: 'course-2', title: 'New Employee Orientation', description: 'Introduction to company policies and procedures' },
  { id: 'course-3', title: 'Leadership Fundamentals', description: 'Core principles for effective leadership' }
];

export default CreateEmployeePage; 