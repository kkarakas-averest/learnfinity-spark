import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import EmployeeProfileForm from './EmployeeProfileForm';
import hrEmployeeService from '@/services/hrEmployeeService';
import hrDepartmentService from '@/services/hrDepartmentService';
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
import SupabaseDiagnostic from '@/SupabaseDiagnostic';
import { supabase } from '@/lib/supabase';

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
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

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
    
    // Show diagnostic UI if we're in development
    if (import.meta.env.DEV) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('debug') === 'true') {
        setShowDiagnostics(true);
      }
    }
    
    // Add a timer to ensure data loading is visible for at least 700ms
    // This gives better UX by preventing flashes of loading states
    const timer = setTimeout(() => {
      checkDatabaseAndFetchData();
    }, 700);
    
    return () => clearTimeout(timer);
  }, [retryCount]);
  
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
      
      // Create the employee with user account - with retry logic
      const result = await createEmployeeWithRetry(employeeData);
      
      // Abort if the operation failed after retries
      if (!result) {
        setIsLoading(false);
        return;
      }
      
      const { data, userAccount } = result;
      
      // Set credentials for display
      setCredentials(userAccount);
      
      // Fetch any auto-enrolled courses
      const { data: coursesData } = await hrEmployeeService.getEmployeeCourses(data.id);
      setEnrolledCourses(coursesData || []);
      
      // Display success and show credentials dialog
      toast.success('Employee created successfully');
      setShowCredentials(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error handling form submission:', error);
      setIsLoading(false);
      toast.error('An unexpected error occurred while creating the employee');
    }
  };
  
  // Function to retry Supabase operations with exponential backoff
  const createEmployeeWithRetry = async (employeeData, maxRetries = 3) => {
    let retryAttempt = 0;
    let lastError = null;
    
    while (retryAttempt < maxRetries) {
      try {
        // If not first attempt, add small delay with exponential backoff
        if (retryAttempt > 0) {
          const delayMs = Math.pow(2, retryAttempt) * 500; // 1s, 2s, 4s...
          await new Promise(resolve => setTimeout(resolve, delayMs));
          toast.info(`Retrying operation (${retryAttempt}/${maxRetries})...`);
        }
        
        const { data, error, userAccount, authError } = 
          await hrEmployeeService.createEmployeeWithUserAccount(employeeData);
        
        if (error) {
          // Specific error handling for this operation
          lastError = error;
          
          // Not all errors should be retried - detect permanent errors
          if (error.code === '23505') { // Postgres duplicate key error
            toast.error('An employee with this email already exists.');
            return null;
          }
          
          // Log but continue retrying for temporary errors
          console.warn(`Supabase operation failed (attempt ${retryAttempt + 1}):`, error);
          retryAttempt++;
          continue;
        }
        
        // Handle auth errors separately - these might be due to rate limiting or temporary issues
        if (authError) {
          lastError = authError;
          console.warn(`Auth operation failed (attempt ${retryAttempt + 1}):`, authError);
          retryAttempt++;
          continue;
        }
        
        // Return the successful result
        return { data, userAccount };
        
      } catch (error) {
        lastError = error;
        console.warn(`Exception in operation (attempt ${retryAttempt + 1}):`, error);
        retryAttempt++;
      }
    }
    
    // If we get here, all retries failed
    console.error('All retry attempts failed. Last error:', lastError);
    
    // Provide helpful error message
    let errorMessage = 'Failed to create employee after multiple attempts.';
    if (lastError?.message) {
      if (lastError.message.includes('hr_employees table does not exist')) {
        errorMessage = 'Database setup issue: HR tables not initialized. Please contact your system administrator.';
      } else {
        errorMessage = lastError.message;
      }
    }
    toast.error(errorMessage);
    
    return null;
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
    // Use query parameter to indicate which tab should be active
    navigate(ROUTES.HR_DASHBOARD + '?tab=employees');
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
      navigate(ROUTES.LOGIN);
    }
  };

  const runApiTest = async () => {
    setIsTestingApi(true);
    setTestResults(null);
    
    try {
      // Test Supabase connection
      const results = [];
      
      // Test 1: Check auth status
      results.push({
        name: 'Get Auth Session',
        startTime: new Date().toISOString(),
      });
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      results[0].endTime = new Date().toISOString();
      results[0].success = !sessionError;
      results[0].data = sessionData ? 'Session data retrieved' : 'No session';
      results[0].error = sessionError ? sessionError.message : null;
      
      // Test 2: Check departments table
      results.push({
        name: 'Get Departments',
        startTime: new Date().toISOString(),
      });
      
      const { data: deptData, error: deptError } = await supabase
        .from('hr_departments')
        .select('id, name')
        .limit(3);
      
      results[1].endTime = new Date().toISOString();
      results[1].success = !deptError;
      results[1].data = deptData ? `Retrieved ${deptData.length} departments` : 'No data';
      results[1].error = deptError ? deptError.message : null;
      
      // Test 3: Check users table
      results.push({
        name: 'Get Users',
        startTime: new Date().toISOString(),
      });
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .limit(3);
      
      results[2].endTime = new Date().toISOString();
      results[2].success = !userError;
      results[2].data = userData ? `Retrieved ${userData.length} users` : 'No data';
      results[2].error = userError ? userError.message : null;
      
      setTestResults(results);
    } catch (error) {
      setTestResults([{
        name: 'API Test',
        success: false,
        error: error.message
      }]);
    } finally {
      setIsTestingApi(false);
    }
  };

  // Force refresh data
  const handleRefreshData = () => {
    setRetryCount(prev => prev + 1);
    toast.info('Refreshing data...');
  };

  // If data is still loading, show a loading indicator
  if (isDataLoading) {
    return (
      <div className="container mx-auto p-4">
        <PageHeader 
          title="Create Employee" 
          description="Create a new employee account and profile" 
        />
        <div className="flex items-center justify-center p-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-lg">Loading data...</span>
        </div>
      </div>
    );
  }

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
      
      {/* Show diagnostics panel in development or if debug is enabled */}
      {showDiagnostics && (
        <div className="mb-8">
          <SupabaseDiagnostic />
        </div>
      )}
      
      {/* Test API Results */}
      {testResults && (
        <Alert className="mb-6">
          <AlertTitle>API Test Results</AlertTitle>
          <AlertDescription>
            <div className="mt-2 text-sm">
              {testResults.map((test, index) => (
                <div key={index} className="mb-2 p-2 border rounded">
                  <div className="font-medium">{test.name}: {test.success ? '✅ Success' : '❌ Failed'}</div>
                  {test.data && <div className="text-gray-600">{test.data}</div>}
                  {test.error && <div className="text-red-600">{test.error}</div>}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Debug actions */}
      {import.meta.env.DEV && (
        <div className="mb-6 flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
          >
            {showDiagnostics ? 'Hide Diagnostics' : 'Show Diagnostics'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={runApiTest}
            disabled={isTestingApi}
          >
            {isTestingApi ? 'Testing API...' : 'Test API Endpoints'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
          >
            Refresh Data
          </Button>
        </div>
      )}
      
      <EmployeeProfileForm 
        onSubmit={handleSubmit} 
        isLoading={isLoading}
        departments={departments}
        positions={positions}
      />

      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Employee Account Created</DialogTitle>
            <DialogDescription>
              An account has been created for the employee. You can share these login credentials with them.
            </DialogDescription>
          </DialogHeader>
          
          {credentials && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium text-gray-500">Email:</div>
                  <div className="col-span-2">{credentials.email}</div>
                  
                  <div className="font-medium text-gray-500">Password:</div>
                  <div className="col-span-2 font-mono">{credentials.tempPassword}</div>
                </div>
              </div>
              
              {enrolledCourses.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Auto-enrolled in courses:</h4>
                  <ul className="text-sm list-disc pl-5">
                    {enrolledCourses.map((course, index) => (
                      <li key={index}>{course.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter className="flex sm:justify-between">
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCopyCredentials}>
                Copy Credentials
              </Button>
              <Button variant="outline" onClick={handleGoToLearnerDashboard}>
                Login as User
              </Button>
            </div>
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