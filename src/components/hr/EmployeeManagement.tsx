import * as React from "react";
import { toast } from "@/components/ui/use-toast";
import { hrEmployeeService } from '@/services/hrEmployeeService';

// Complete component with fixed fetchEmployees function
const EmployeeManagement = () => {
  const [employees, setEmployees] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const result = await hrEmployeeService.getEmployees();
      if (result && result.success && Array.isArray(result.employees)) {
        setEmployees(result.employees);
      } else {
        console.error("Failed to fetch employees:", result?.error || "Unknown error");
        toast({
          title: "Error",
          description: "Failed to fetch employees. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
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

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div>
      {/* Employee management component UI */}
    </div>
  );
};

export default EmployeeManagement;
