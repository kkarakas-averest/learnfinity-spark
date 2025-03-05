
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { hrEmployeeService } from '@/services/hrEmployeeService';

// First, let's fix the return type definition to include the data property
// Define return type for updateEmployeeWithRetry
type UpdateEmployeeReturnType = { success: boolean; data?: any; error?: any } | null;

const EditEmployeePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [employee, setEmployee] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

  // Now let's make sure the implementation returns this type correctly
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
        
        const { data, error } = 
          await hrEmployeeService.updateEmployee(employeeId, employeeData);
        
        if (error) {
          // Specific error handling for this operation
          lastError = error;
          
          // Not all errors should be retried - detect permanent errors
          if (error.code === '23505') { // Postgres duplicate key error
            toast({
              title: "An employee with this email already exists.",
              variant: "destructive"
            });
            return null;
          }
          
          // Log but continue retrying for temporary errors
          console.warn(`Supabase operation failed (attempt ${retryAttempt + 1}):`, error);
          retryAttempt++;
          continue;
        }
        
        // Return the successful result with data
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

  React.useEffect(() => {
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
      <pre>{JSON.stringify(employee, null, 2)}</pre>
      
      <div className="mt-4 flex space-x-4">
        <button 
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => handleUpdateEmployee({ name: employee.name + " (updated)" })}
        >
          Update Employee
        </button>
        
        <button 
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          onClick={() => navigate('/hr-dashboard/employees')}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default EditEmployeePage;
