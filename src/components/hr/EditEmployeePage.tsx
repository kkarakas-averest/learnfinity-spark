
import { useState, useEffect } from "@/lib/react-helpers";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { hrEmployeeService, Employee } from "@/services/hrEmployeeService";
import { Button } from "@/components/ui/button";
import { SupabaseResponse, RetryOperationResult, SupabaseError } from "@/types/service-responses";

// Define the type for employee updates
type EmployeeUpdate = Partial<Employee>;

/**
 * This component handles the employee editing functionality.
 */
const EditEmployeePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  /**
   * Implements a retry mechanism for updating employee data
   * @param employeeId - The ID of the employee to update
   * @param employeeData - The updated employee data
   * @param maxRetries - Maximum number of retry attempts
   * @returns A promise that resolves to a RetryOperationResult
   */
  const updateEmployeeWithRetry = async (
    employeeId: string,
    employeeData: EmployeeUpdate,
    maxRetries = 3
  ): Promise<RetryOperationResult<Employee>> => {
    let retryAttempt = 0;
    let lastError: Error | SupabaseError | null = null;
    
    while (retryAttempt < maxRetries) {
      try {
        // If not first attempt, add small delay with exponential backoff
        if (retryAttempt > 0) {
          const delayMs = Math.pow(2, retryAttempt) * 500; // 1s, 2s, 4s...
          await new Promise(resolve => setTimeout(resolve, delayMs));
          toast({
            title: `Retrying operation (${retryAttempt}/${maxRetries})...`,
            variant: "default"
          });
        }
        
        // Call the employee service
        const response = await hrEmployeeService.updateEmployee(employeeId, employeeData);
        
        // Check for errors in the response
        if (response.error) {
          // Specific error handling for this operation
          lastError = response.error;
          
          // Not all errors should be retried - detect permanent errors
          if (response.error.code === '23505') { // Postgres duplicate key error
            toast({
              title: "An employee with this email already exists.",
              variant: "destructive"
            });
            
            return {
              success: false,
              error: response.error
            };
          }
          
          // Log but continue retrying for temporary errors
          console.warn(`Supabase operation failed (attempt ${retryAttempt + 1}):`, response.error);
          retryAttempt++;
          continue;
        }
        
        // Success case - properly type the return value
        return { 
          success: true,
          data: response.data as Employee // Explicitly cast the data to ensure type safety
        };
        
      } catch (error) {
        // Handle unexpected errors
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`Exception in operation (attempt ${retryAttempt + 1}):`, error);
        retryAttempt++;
      }
    }
    
    // If we get here, all retries failed
    console.error('All retry attempts failed. Last error:', lastError);
    
    // Provide helpful error message
    let errorMsg = 'Failed to update employee after multiple attempts.';
    if (lastError instanceof Error) {
      if (lastError.message.includes('hr_employees table does not exist')) {
        errorMsg = 'Database setup issue: HR tables not initialized. Please contact your system administrator.';
      } else {
        errorMsg = `Operation failed: ${lastError.message}`;
      }
    } else if (lastError && typeof lastError === 'object' && 'message' in lastError) {
      errorMsg = `Operation failed: ${lastError.message}`;
    }
    
    // Set error state for user display
    setErrorMessage(errorMsg);
    
    if (lastError && typeof lastError === 'object' && 'code' in lastError) {
      setErrorCode(String(lastError.code));
    } else {
      setErrorCode('UNKNOWN_ERROR');
    }
    
    setIsErrorDialogOpen(true);
    
    return { 
      success: false, 
      error: lastError || new Error('Unknown error during retry operation'),
      data: undefined // Add the data property with undefined value for failed operations
    };
  };

  // Fetch employee data on component mount
  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await hrEmployeeService.getEmployee(id);
        if (error) {
          toast({
            title: "Error loading employee data",
            description: error.message || "Failed to load employee data",
            variant: "destructive"
          });
          return;
        }
        setEmployee(data);
      } catch (error) {
        console.error("Failed to fetch employee:", error);
        toast({
          title: "Error loading employee data",
          description: error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  /**
   * Handles the employee update process
   * @param formData - The updated employee data
   */
  const handleUpdateEmployee = async (formData: EmployeeUpdate) => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const result = await updateEmployeeWithRetry(id, formData);
      
      if (result.success && result.data) {
        toast({
          title: "Employee updated successfully",
          variant: "default"
        });
        navigate('/hr-dashboard/employees');
      }
    } catch (error) {
      console.error("Failed to update employee:", error);
      toast({
        title: "Error updating employee",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !employee) {
    return <div className="p-8">Loading employee data...</div>;
  }

  if (!employee && !isLoading) {
    return <div className="p-8">Employee not found or error loading data.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Employee</h1>
      {/* Form implementation will go here */}
      <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60 mb-4">
        {JSON.stringify(employee, null, 2)}
      </pre>
      
      <div className="mt-4 flex space-x-4">
        <Button 
          onClick={() => employee && handleUpdateEmployee({ name: employee.name + " (updated)" })}
          variant="default"
        >
          Update Employee
        </Button>
        
        <Button 
          onClick={() => navigate('/hr-dashboard/employees')}
          variant="outline"
        >
          Cancel
        </Button>
      </div>

      {isErrorDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Error</h2>
            <p className="text-red-500 mb-2">{errorMessage}</p>
            {errorCode && <p className="text-sm text-gray-500">Error code: {errorCode}</p>}
            <Button 
              onClick={() => setIsErrorDialogOpen(false)}
              className="mt-4"
              variant="default"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditEmployeePage;
