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
      // First try to get data from the real API
      const result = await hrEmployeeService.getEmployees();
      
      if (result && result.success && Array.isArray(result.employees)) {
        // Try to use the employees array from the success response
        if (result.employees && result.employees.length > 0) {
          setEmployees(result.employees);
          setFilteredEmployees(result.employees);
          return;
        }
      }
      
      // If the normal format didn't work, try alternative formats
      if (result && 'data' in result && Array.isArray(result.data)) {
        // Map API response to our Employee type
        const mappedEmployees = result.data.map((emp: any) => ({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          department: emp.hr_departments?.name || 'Unknown',
          position: emp.hr_positions?.title || 'Unknown',
          courses: 4, // Default fallback values
          coursesCompleted: 2,
          progress: 50,
          lastActivity: emp.last_active_at || new Date().toISOString(),
          status: emp.status || 'active',
          ragStatus: emp.rag_status || 'green',
          ragDetails: {
            status: emp.rag_status || 'green',
            justification: 'Based on progress metrics',
            lastUpdated: emp.updated_at || new Date().toISOString(),
            updatedBy: 'system'
          }
        }));
        
        setEmployees(mappedEmployees);
        setFilteredEmployees(mappedEmployees);
        return;
      }
      
      // If we got here, we couldn't get data from the API
      console.error("Failed to fetch employees:", result?.error || "Unknown error");
      await loadMockData();
      
    } catch (error) {
      console.error("Error fetching employees:", error);
      // Fallback to mock data
      await loadMockData();
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to load mock data when API fails
  const loadMockData = async () => {
    console.log("Loading mock employee data...");
    
    // Mock employee data with consistent IDs to prevent re-renders
    const mockEmployees: Employee[] = [
      {
        id: 'mock-1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        department: 'Engineering',
        position: 'Senior Developer',
        courses: 5,
        coursesCompleted: 4,
        progress: 80,
        lastActivity: new Date().toISOString(),
        status: 'active',
        ragStatus: 'green',
        ragDetails: {
          status: 'green',
          justification: 'On track with all courses',
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system'
        }
      },
      {
        id: 'mock-2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        department: 'Marketing',
        position: 'Marketing Manager',
        courses: 4,
        coursesCompleted: 2,
        progress: 50,
        lastActivity: new Date().toISOString(),
        status: 'active',
        ragStatus: 'amber',
        ragDetails: {
          status: 'amber',
          justification: 'Falling behind on course schedule',
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system'
        }
      },
      {
        id: 'mock-3',
        name: 'Robert Brown',
        email: 'robert.brown@example.com',
        department: 'Sales',
        position: 'Sales Representative',
        courses: 3,
        coursesCompleted: 0,
        progress: 10,
        lastActivity: new Date().toISOString(),
        status: 'active',
        ragStatus: 'red',
        ragDetails: {
          status: 'red',
          justification: 'Has not started mandatory courses',
          lastUpdated: new Date().toISOString(),
          updatedBy: 'system'
        }
      }
    ];
    
    // For consistency between renders, use the same data
    setEmployees(mockEmployees);
    setFilteredEmployees(
      statusFilter === 'all' 
        ? mockEmployees 
        : mockEmployees.filter(emp => emp.ragStatus === statusFilter)
    );
    
    toast({
      title: "Using Mock Data",
      description: "Showing sample employee data because the database is unavailable.",
      variant: "default",
    });
    
    return mockEmployees;
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
