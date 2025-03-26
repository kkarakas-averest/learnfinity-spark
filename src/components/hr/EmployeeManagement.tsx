import React from "@/lib/react-helpers";
import { toast } from "@/components/ui/use-toast";
import { hrEmployeeService } from '@/lib/services/hrEmployeeService';
import { hrDepartmentService } from '@/lib/services/hrDepartmentService';
import { Badge } from "@/components/ui/badge";
import { EmployeeDetail, RAGStatus } from "@/types/hr.types";
import { useAgentSystem } from '@/hooks/useAgentSystem';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Activity, Edit, MessageSquare, User, MoreHorizontal, Filter } from "lucide-react";
import { RAGStatusBadge } from './RAGStatusBadge';
import RAGStatusHistory, { StatusHistoryEntry } from './RAGStatusHistory';
import { ragStatusService } from '@/services/rag-status.service';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmployeeManagementProps {
  onViewDetails: (employee: EmployeeDetail) => void;
  onIntervene: (employee: EmployeeDetail) => void;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ onViewDetails, onIntervene }) => {
  const [employees, setEmployees] = React.useState<EmployeeDetail[]>([]);
  const [filteredEmployees, setFilteredEmployees] = React.useState<EmployeeDetail[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<RAGStatus | 'all'>('all');
  const [employmentStatusFilter, setEmploymentStatusFilter] = React.useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = React.useState<string>('all');
  const [departments, setDepartments] = React.useState<{id: string, name: string}[]>([]);
  
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [employeesBeingAnalyzed, setEmployeesBeingAnalyzed] = React.useState<Record<string, boolean>>({});
  const [statusHistories, setStatusHistories] = React.useState<Record<string, StatusHistoryEntry[]>>({});
  
  const { 
    isInitialized: isAgentSystemInitialized,
    isProcessing: isAgentProcessing,
    determineRAGStatus
  } = useAgentSystem();

  const fetchDepartments = async () => {
    try {
      const { data, error } = await hrDepartmentService.getDepartments();
      if (error) {
        console.error("Error fetching departments:", error);
        return;
      }
      if (data) {
        setDepartments(data);
      }
    } catch (err) {
      console.error("Exception fetching departments:", err);
    }
  };

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const result = await hrEmployeeService.getEmployees();
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Failed to fetch employees');
      }
      
      if (!Array.isArray(result.employees) || result.employees.length === 0) {
        toast({
          title: 'No employees found',
          description: 'There are no employees in the system yet.',
          variant: 'default',
        });
        setEmployees([]);
        setFilteredEmployees([]);
        return;
      }
      
      const normalizedEmployees = result.employees.map(emp => ({
        ...emp,
        ragStatus: emp.ragStatus || emp.rag_status || 'green'
      }));
      
      setEmployees(normalizedEmployees);
      
      applyFilters(normalizedEmployees, statusFilter, departmentFilter, employmentStatusFilter);
      
      const histories: Record<string, StatusHistoryEntry[]> = {};
      
      for (const employee of normalizedEmployees) {
        try {
          const history = await ragStatusService.getEmployeeRAGHistory(employee.id);
          histories[employee.id] = history.entries.map(entry => ({
            status: entry.status,
            date: entry.createdAt,
            reason: entry.reason
          }));
        } catch (error) {
          console.error(`Error fetching history for employee ${employee.id}:`, error);
          histories[employee.id] = [];
        }
      }
      
      setStatusHistories(histories);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employees. Please try again later.',
        variant: 'destructive',
      });
      
      setEmployees([]);
      setFilteredEmployees([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = (employeeList: EmployeeDetail[], ragFilter: RAGStatus | 'all', deptFilter: string, empStatusFilter: string) => {
    let filtered = [...employeeList];
    
    if (ragFilter !== 'all') {
      filtered = filtered.filter(employee => employee.ragStatus === ragFilter);
    }
    
    if (deptFilter !== 'all') {
      filtered = filtered.filter(employee => {
        if (employee.department_id) {
          return employee.department_id === deptFilter;
        } else if (typeof employee.department === 'string') {
          const dept = departments.find(d => d.name === employee.department);
          return dept?.id === deptFilter;
        }
        return false;
      });
    }
    
    if (empStatusFilter !== 'all') {
      filtered = filtered.filter(employee => employee.status === empStatusFilter);
    }
    
    setFilteredEmployees(filtered);
  };

  const analyzeEmployee = async (employee: EmployeeDetail) => {
    if (!isAgentSystemInitialized) {
      toast({
        title: 'Agent System Not Available',
        description: 'The AI analysis system is not currently available.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setEmployeesBeingAnalyzed(prev => ({ ...prev, [employee.id]: true }));
      
      const analysisResult = await determineRAGStatus(employee);
      
      if (analysisResult && analysisResult.status) {
        const updatedEmployee = {
          ...employee,
          ragStatus: analysisResult.status,
          ragDetails: {
            status: analysisResult.status,
            justification: analysisResult.justification || "Status determined by AI analysis",
            lastUpdated: new Date().toISOString(),
            updatedBy: 'agent-system',
            recommendedActions: analysisResult.recommendedActions || []
          }
        };
        
        const updatedEmployees = employees.map(emp => 
          emp.id === employee.id ? updatedEmployee : emp
        );
        
        setEmployees(updatedEmployees);
        
        if (statusFilter === 'all' || statusFilter === updatedEmployee.ragStatus) {
          setFilteredEmployees(prevFiltered => 
            prevFiltered.map(emp => emp.id === employee.id ? updatedEmployee : emp)
          );
        } else {
          setFilteredEmployees(prevFiltered => 
            prevFiltered.filter(emp => emp.id !== employee.id)
          );
        }
        
        toast({
          title: 'Analysis Complete',
          description: `${employee.name}'s status updated to ${analysisResult.status.toUpperCase()}`,
          variant: 'default',
        });
      } else {
        throw new Error('Failed to analyze employee data');
      }
    } catch (error) {
      console.error('Error analyzing employee:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Failed to analyze employee data. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setEmployeesBeingAnalyzed(prev => ({ ...prev, [employee.id]: false }));
    }
  };

  const analyzeAllEmployees = async () => {
    if (!isAgentSystemInitialized) {
      toast({
        title: 'Agent System Not Available',
        description: 'The AI analysis system is not currently available.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsAnalyzing(true);
      toast({
        title: 'Analysis Started',
        description: 'Analyzing all employees. This may take a moment...',
        variant: 'default',
      });
      
      const batchSize = 5;
      const totalEmployees = employees.length;
      let processedCount = 0;
      let updatedCount = 0;
      
      let updatedEmployees = [...employees];
      
      for (let i = 0; i < totalEmployees; i += batchSize) {
        const batch = employees.slice(i, i + batchSize);
        
        const batchResults = await Promise.all(batch.map(async (employee) => {
          try {
            const analysisResult = await determineRAGStatus(employee);
            
            if (analysisResult && analysisResult.status) {
              const updatedEmployee = {
                ...employee,
                ragStatus: analysisResult.status,
                ragDetails: {
                  status: analysisResult.status,
                  justification: analysisResult.justification || "Status determined by AI analysis",
                  lastUpdated: new Date().toISOString(),
                  updatedBy: 'agent-system',
                  recommendedActions: analysisResult.recommendedActions || []
                }
              };
              
              return { 
                success: true, 
                employee: updatedEmployee,
                id: employee.id
              };
            }
            
            return { success: false, id: employee.id };
          } catch (error) {
            console.error(`Error analyzing employee ${employee.id}:`, error);
            return { success: false, id: employee.id };
          } finally {
            processedCount++;
          }
        }));
        
        batchResults.forEach(result => {
          if (result.success && result.employee) {
            updatedCount++;
            const index = updatedEmployees.findIndex(e => e.id === result.id);
            if (index !== -1) {
              updatedEmployees[index] = result.employee;
            }
          }
        });
        
        setEmployees(updatedEmployees);
        
        if (statusFilter !== 'all') {
          setFilteredEmployees(updatedEmployees.filter(emp => emp.ragStatus === statusFilter));
        } else {
          setFilteredEmployees(updatedEmployees);
        }
      }
      
      toast({
        title: 'Analysis Complete',
        description: `Analyzed ${processedCount} employees. Updated ${updatedCount} status ratings.`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error in batch analysis:', error);
      toast({
        title: 'Analysis Error',
        description: 'An error occurred during batch analysis.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  React.useEffect(() => {
    if (employees.length > 0) {
      applyFilters(employees, statusFilter, departmentFilter, employmentStatusFilter);
    }
  }, [statusFilter, departmentFilter, employmentStatusFilter, employees]);

  React.useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  const renderEmployeeList = () => {
    return (
      <div className="overflow-hidden bg-white shadow sm:rounded-md mt-4">
        <div className="flex flex-col space-y-4 p-4 bg-gray-50">
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 text-sm rounded ${statusFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
              onClick={() => setStatusFilter('all')}
            >
              All RAG
            </button>
            <button
              className={`px-3 py-1 text-sm rounded ${statusFilter === 'green' ? 'bg-green-500 text-white' : 'bg-green-100'}`}
              onClick={() => setStatusFilter('green')}
            >
              Green
            </button>
            <button
              className={`px-3 py-1 text-sm rounded ${statusFilter === 'amber' ? 'bg-amber-500 text-white' : 'bg-amber-100'}`}
              onClick={() => setStatusFilter('amber')}
            >
              Amber
            </button>
            <button
              className={`px-3 py-1 text-sm rounded ${statusFilter === 'red' ? 'bg-red-500 text-white' : 'bg-red-100'}`}
              onClick={() => setStatusFilter('red')}
            >
              Red
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="w-64">
              <Select
                value={departmentFilter}
                onValueChange={(value) => setDepartmentFilter(value)}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Department" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-64">
              <Select
                value={employmentStatusFilter}
                onValueChange={(value) => setEmploymentStatusFilter(value)}
              >
                <SelectTrigger className="w-full">
                  <div className="flex items-center">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isAgentSystemInitialized && (
            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={analyzeAllEmployees}
                      disabled={isAnalyzing || isAgentProcessing}
                      className="flex items-center gap-1"
                    >
                      <SparklesIcon className="h-4 w-4" />
                      {isAnalyzing ? 'Analyzing...' : 'Analyze All'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Use AI to analyze and update all employee RAG statuses</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
        
        <ul className="divide-y divide-gray-200">
          {filteredEmployees.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No employees found with the selected filters.
            </li>
          ) : (
            filteredEmployees.map(employee => (
              <li key={employee.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{employee.name}</h3>
                  <div className="text-sm text-gray-500">
                    {renderDepartmentPosition(employee).display}
                  </div>
                  <div className="mt-2 flex items-center space-x-3">
                    <RAGStatusBadge 
                      status={employee.ragStatus} 
                      size="md" 
                      animate={employeesBeingAnalyzed[employee.id]}
                    />
                    {statusHistories[employee.id] && statusHistories[employee.id].length > 0 && (
                      <RAGStatusHistory 
                        history={statusHistories[employee.id]} 
                        maxEntries={5}
                        size="sm"
                      />
                    )}
                    <Badge className={
                      employee.status === 'active' ? 'bg-green-100 text-green-800' :
                      employee.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      employee.status === 'onboarding' ? 'bg-blue-100 text-blue-800' :
                      employee.status === 'terminated' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {employee.status?.charAt(0).toUpperCase() + employee.status?.slice(1) || 'Unknown'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      Last activity: {employee.lastActivity ? new Date(employee.lastActivity).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isAgentSystemInitialized && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => analyzeEmployee(employee)}
                            disabled={employeesBeingAnalyzed[employee.id] || isAgentProcessing}
                            className="flex items-center gap-1"
                          >
                            <SparklesIcon className="h-4 w-4" />
                            {employeesBeingAnalyzed[employee.id] ? 'Analyzing...' : 'Analyze'}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Use AI to analyze this employee's RAG status</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => analyzeEmployee(employee)}>
                        <Activity className="mr-2 h-4 w-4" />
                        <span>Analyze</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to={`/hr-dashboard/employees/${employee.id}/profile`}>
                          <User className="mr-2 h-4 w-4" />
                          <span>View Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onIntervene(employee)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>Intervene</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onViewDetails(employee)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    );
  };

  const renderDepartmentPosition = (employee: any) => {
    const departmentName = employee.department && employee.department !== "Unknown Department" 
      ? employee.department 
      : (employee.hr_departments?.name && employee.hr_departments.name !== "Unknown Department"
        ? employee.hr_departments.name
        : "Not Assigned");
    
    const positionTitle = employee.position && employee.position !== "Unknown Position"
      ? employee.position
      : (employee.hr_positions?.title && employee.hr_positions.title !== "Unknown Position" 
        ? employee.hr_positions.title
        : "Not Assigned");
    
    return {
      display: `${departmentName} · ${positionTitle}`,
      rawData: {
        dept: employee.department || "Unknown Department", 
        pos: employee.position || "Unknown Position",
        hr_dept: employee.hr_departments?.name || "Unknown Department",
        hr_pos: employee.hr_positions?.title || "Unknown Position"
      },
      departmentName,
      positionTitle
    };
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Employee Management</h2>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={fetchEmployees}
        >
          Refresh Data
        </button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-6">Loading employees...</div>
      ) : (
        renderEmployeeList()
      )}
    </div>
  );
};

export default EmployeeManagement;
