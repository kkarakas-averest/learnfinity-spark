
// Fix the GetEmployees usage to match the updated type interface
// Only replacing the specific part that needs fixing

const fetchEmployees = async () => {
  setIsLoading(true);
  try {
    const result = await hrEmployeeService.getEmployees();
    if (result.success && result.employees) {
      setEmployees(result.employees);
    } else {
      console.error("Failed to fetch employees:", result.error);
      toast({
        title: "Error",
        description: "Failed to fetch employees. Please try again.",
        variant: "destructive",
      });
    }
  } catch (error) {
    console.error("Error fetching employees:", error);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};
