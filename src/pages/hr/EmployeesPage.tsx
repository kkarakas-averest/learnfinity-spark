import React from "@/lib/react-helpers";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import EmployeeManagement from "@/components/hr/EmployeeManagement";

const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate("/hr-dashboard");
  };

  const handleViewDetails = (employee: any) => {
    console.log("View details for:", employee);
    // In a real implementation, this would navigate to a detailed view
  };

  const handleIntervene = (employee: any) => {
    console.log("Intervene for:", employee);
    // In a real implementation, this would show the intervention dialog
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" onClick={goBack} className="mr-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Employee Management</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <EmployeeManagement
          onViewDetails={handleViewDetails}
          onIntervene={handleIntervene}
        />
      </div>
    </div>
  );
};

export default EmployeesPage; 