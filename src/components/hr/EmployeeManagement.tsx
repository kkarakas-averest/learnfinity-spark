import React from "@/lib/react-helpers";
import { toast } from "@/components/ui/use-toast";
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { Badge } from "@/components/ui/badge";
import { Employee, RAGStatus } from "@/types/hr.types";

interface EmployeeManagementProps {
  onViewDetails: (employee: Employee) => void;
  onIntervene: (employee: Employee) => void;
}

// RAG status badge component
const RAGStatusBadge = ({ status }: { status: RAGStatus }) => {
  const variants = {
    green: "bg-green-500 hover:bg-green-600",
    amber: "bg-amber-500 hover:bg-amber-600",
    red: "bg-red-500 hover:bg-red-600"
  };
  
  const labels = {
    green: "On Track",
    amber: "Needs Attention",
    red: "Urgent Intervention"
  };
  
  return (
    <Badge className={variants[status]}>
      {labels[status]}
    </Badge>
  );
};

// Complete component with RAG status filtering
const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ onViewDetails, onIntervene }) => {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = React.useState<Employee[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<RAGStatus | 'all'>('all');

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const result = await hrEmployeeService.getEmployees();
      if (result && result.success && Array.isArray(result.employees)) {
        setEmployees(result.employees);
        setFilteredEmployees(result.employees);
      } else {
        console.error("Failed to fetch employees:", result?.error || "Unknown error");
        toast({
          title: "Error",
          description: "Failed to fetch employees. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: Error | unknown) {
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
  
  React.useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredEmployees(employees);
    } else {
      setFilteredEmployees(employees.filter(emp => emp.ragStatus === statusFilter));
    }
  }, [statusFilter, employees]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employee Management</h2>
        <div className="flex space-x-2">
          <button 
            className={`px-3 py-1 rounded ${statusFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-200'}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
          <button 
            className={`px-3 py-1 rounded ${statusFilter === 'green' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setStatusFilter('green')}
          >
            On Track
          </button>
          <button 
            className={`px-3 py-1 rounded ${statusFilter === 'amber' ? 'bg-amber-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setStatusFilter('amber')}
          >
            Needs Attention
          </button>
          <button 
            className={`px-3 py-1 rounded ${statusFilter === 'red' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setStatusFilter('red')}
          >
            Urgent
          </button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="loader">Loading...</div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.department}</div>
                    {employee.position && (
                      <div className="text-sm text-gray-500">{employee.position}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${employee.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {employee.progress}% ({employee.coursesCompleted}/{employee.courses} courses)
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RAGStatusBadge status={employee.ragStatus} />
                    <div className="text-xs text-gray-500 mt-1">
                      Updated: {new Date(employee.ragDetails?.lastUpdated || Date.now()).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(employee.lastActivity).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      onClick={() => onViewDetails(employee)}
                    >
                      View Details
                    </button>
                    <button 
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={() => onIntervene(employee)}
                    >
                      Intervene
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;
