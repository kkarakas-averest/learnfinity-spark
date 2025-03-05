
// First, let's fix the return type definition to include the data property
// Define return type for updateEmployeeWithRetry - Fix: added data property to align with implementation
type UpdateEmployeeReturnType = { success: boolean; data?: any; error?: any } | null;

// Now let's make sure the implementation returns this type correctly
const updateEmployeeWithRetry = async (employeeId, employeeData, maxRetries = 3): Promise<UpdateEmployeeReturnType> => {
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
  
  return { success: false, error: lastError };
}
