import { useState, useEffect } from "@/lib/react-helpers";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { hrEmployeeService } from "@/services/hrEmployeeService";
import { Button } from "@/components/ui/button";

// Define the service response type based on what hrEmployeeService actually returns
interface ServiceResponse {
  data: any | null;
  error: any | null;
}

// Define return type for updateEmployeeWithRetry
interface UpdateEmployeeReturnType { 
  success: boolean; 
  data?: any; 
  error?: any;
}

/**
 * This component handles the employee editing functionality.
 * Note: The hrEmployeeService.updateEmployee returns { data, error } but TypeScript
 * has some issues inferring this properly, so a type assertion is used in the retry function.
 */
const EditEmployeePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [employee, setEmployee] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  // Implement the retry functionality
  const updateEmployeeWithRetry = async (employeeId: string, employeeData: any, maxRetries = 3): Promise<UpdateEmployeeReturnType> => {
    let retryAttempt = 0;
    let lastError = null;
    
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
        
        // Call the service and explicitly extract data and error
        const serviceResponse = await hrEmployeeService.updateEmployee(employeeId, employeeData);
        
        // Check for errors in the response
        if (serviceResponse.error) {
          // Specific error handling for this operation
          lastError = serviceResponse.error;
          
          // Not all errors should be retried - detect permanent errors
          if (serviceResponse.error.code === '23505') { // Postgres duplicate key error
            toast({
              title: "An employee with this email already exists.",
              variant: "destructive"
            });
            return { success: false, error: serviceResponse.error };
          }
          
          // Log but continue retrying for temporary errors
          console.warn(`Supabase operation failed (attempt ${retryAttempt + 1}):`, serviceResponse.error);
          retryAttempt++;
          continue;
        }
        
        // Return the successful result with data
        // Use type assertion to fix TypeScript error
        return { 
          success: true, 
          data: (serviceResponse as any).data 
        };
        
      } catch (error) {
        lastError = error;
        console.warn(`Exception in operation (attempt ${retryAttempt + 1}):`, error);
        retryAttempt++;
      }
    }
    
    // If we get here, all retries failed
    console.error('All retry attempts failed. Last error:', lastError);
    
    // Provide helpful error message
    let errorMsg = 'Failed to update employee after multiple attempts.';
    if (lastError?.message) {
      if (lastError.message.includes('hr_employees table does not exist')) {
        errorMsg = 'Database setup issue: HR tables not initialized. Please contact your system administrator.';
      } else {
        errorMsg = lastError.message;
      }
    }
    toast({
      title: errorMsg,
      variant: "destructive"
    });
    setErrorMessage(errorMsg);
    setErrorCode(lastError?.code || '');
    setIsErrorDialogOpen(true);
    
    return { success: false, error: lastError };
  };

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await hrEmployeeService.getEmployee(id);
        if (error) {
          toast({
            title: "Error loading employee data",
            description: error.message,
            variant: "destructive"
          });
          return;
        }
        setEmployee(data);
      } catch (error) {
        console.error("Failed to fetch employee:", error);
        toast({
          title: "Error loading employee data",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  const handleUpdateEmployee = async (formData: any) => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const result = await updateEmployeeWithRetry(id, formData);
      
      if (result && result.success) {
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
        description: "An unexpected error occurred",
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
          onClick={() => handleUpdateEmployee({ name: employee.name + " (updated)" })}
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
