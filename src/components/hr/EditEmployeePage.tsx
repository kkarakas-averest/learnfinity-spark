import { useState, useEffect } from '@/lib/react-helpers';
import { useNavigate, useParams } from 'react-router-dom';
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
import { AlertCircle, Info, Wrench } from 'lucide-react';

const EditEmployeePage = () => {
  // For debugging
  console.log('=== Rendering EditEmployeePage ===');
  
  const navigate = useNavigate();
  const { employeeId } = useParams();
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [errorDetails, setErrorDetails] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState('');

  useEffect(() => {
    const checkDatabaseAndFetchData = async () => {
      try {
        setLoading(true);
        
        // Check if all HR tables exist
        // Use the method from hrEmployeeService that actually exists
        const { success, error } = await hrEmployeeService.initialize();
        if (!success) {
          toast.error(
            `Database tables missing: check Supabase setup`,
            { 
              description: 'Please run the SQL initialization script in Supabase', 
              duration: 10000 
            }
          );
          return;
        }
        
        // Fetch departments - using the correct method from the service
        const { data: departmentsData, error: departmentsError } = 
          await hrDepartmentService.getAllDepartments();
        
        if (departmentsError) {
          console.error('Error fetching departments:', departmentsError);
          toast.error('Failed to load departments. Please check the console for details.');
          throw departmentsError;
        }
        setDepartments(departmentsData || []);
        
        // Fetch positions - using the correct method in the service
        const { data: positionsData, error: positionsError } = 
          await hrDepartmentService.getAllPositions();
        
        if (positionsError) {
          console.error('Error fetching positions:', positionsError);
          toast.error('Failed to load positions. Please check the console for details.');
          throw positionsError;
        }
        setPositions(positionsData || []);

        // Fetch employee data - using the correct method name
        if (employeeId) {
          // Get the employee data and handle the result structure correctly
          const { data, error } = await hrEmployeeService.getEmployee(employeeId);
          
          if (error) {
            console.error('Error fetching employee:', error);
            toast.error('Failed to load employee data. Please check the console for details.');
            throw error;
          }
          
          setEmployeeData(data || null);
        }
        
      } catch (error) {
        console.error('Error in checkDatabaseAndFetchData:', error);
        toast.error('Failed to initialize. Please check the console for details.');
        setErrorMessage(error.message || 'Unknown error occurred');
        setErrorCode(error.code || '');
        setIsErrorDialogOpen(true);
      } finally {
        setLoading(false);
      }
    };
    
    // Add a timer to ensure data loading is visible for at least 700ms
    // This gives better UX by preventing flashes of loading states
    const timer = setTimeout(() => {
      checkDatabaseAndFetchData();
    }, 700);
    
    return () => clearTimeout(timer);
  }, [employeeId, retryCount]);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      
      // Create the employee data object
      const employeeDataToUpdate = {
        name: formData.name,
        email: formData.email,
        department_id: formData.department,
        position_id: formData.position,
        status: 'active',
        phone: formData.phone || null
      };
      
      // Update the employee data - with retry logic
      const result = await updateEmployeeWithRetry(employeeId, employeeDataToUpdate);
      
      // Abort if the operation failed after retries
      if (!result) {
        setLoading(false);
        return;
      }
      
      // Success case
      toast.success('Employee updated successfully');
      setLoading(false);
      
      // Use query parameter to indicate which tab should be active
      navigate(ROUTES.HR_DASHBOARD + '?tab=employees');
    } catch (error) {
      console.error('Error handling form submission:', error);
      setLoading(false);
      setErrorMessage(error.message || 'Unknown error occurred');
      setErrorCode(error.code || '');
      setIsErrorDialogOpen(true);
      toast.error('An unexpected error occurred while updating the employee');
    }
  };
  
  // Function to retry Supabase operations with exponential backoff
  const updateEmployeeWithRetry = async (employeeId, employeeData, maxRetries = 3) => {
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
        
        const { data, error } = 
          await hrEmployeeService.updateEmployee(employeeId, employeeData);
        
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
        
        // Return the successful result
        return { success: true, data };
        
      } catch (error) {
        lastError = error;
        console.warn(`Exception in operation (attempt ${retryAttempt + 1}):`, error);
        retryAttempt++;
      }
    }
    
    // If we get here, all retries failed
    console.error('All retry attempts failed. Last error:', lastError);
    
    // Provide helpful error message
    let errorMessage = 'Failed to update employee after multiple attempts.';
    if (lastError?.message) {
      if (lastError.message.includes('hr_employees table does not exist')) {
        errorMessage = 'Database setup issue: HR tables not initialized. Please contact your system administrator.';
      } else {
        errorMessage = lastError.message;
      }
    }
    toast.error(errorMessage);
    setErrorMessage(errorMessage);
    setErrorCode(lastError?.code || '');
    setIsErrorDialogOpen(true);
    
    return null;
  };

  const handleRetry = () => {
    setErrorDetails(null);
    setIsErrorDialogOpen(false);
    setRetryCount(prevCount => prevCount + 1);
    toast.info('Retrying operation...');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Main content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <PageHeader 
          title="Edit Employee"
          description="Edit an existing employee in the system"
          backUrl={ROUTES.HR_DASHBOARD + '?tab=employees'}
        />
        
        {errorDetails && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertTitle>Error Updating Employee</AlertTitle>
            <AlertDescription>
              {errorDetails.message}
              {errorDetails.hint && (
                <div className="mt-2 text-sm">
                  <strong>Hint:</strong> {errorDetails.hint}
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          employeeData && (
            <EmployeeProfileForm 
              departments={departments}
              positions={positions}
              onSubmit={handleSubmit}
              isCreating={false}
              initialValues={{
                name: employeeData.name,
                email: employeeData.email,
                department: employeeData.department_id,
                position: employeeData.position_id,
                phone: employeeData.phone || '',
              }}
            />
          )
        )}
      </div>

      {/* Error Dialog */}
      <Dialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              Database Error
            </DialogTitle>
            <DialogDescription>
              There was an error communicating with the database. This could be due to a connectivity issue or a problem with the database itself.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription className="break-words">
                {errorMessage}
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Error Code: {errorCode || 'Unknown'}</p>
              <p className="text-sm text-muted-foreground mt-1">Timestamp: {new Date().toLocaleString()}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setIsErrorDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={handleRetry}>
              <Wrench className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EditEmployeePage;
