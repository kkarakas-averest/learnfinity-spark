import React from "@/lib/react-helpers";
import { toast } from "@/components/ui/use-toast";
import { hrEmployeeService } from '@/lib/services/hrEmployeeService';
import { Badge } from "@/components/ui/badge";
import { Employee, RAGStatus } from "@/types/hr.types";
// Import the agent system hook
import { useAgentSystem } from '@/hooks/useAgentSystem';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Activity, Edit, MessageSquare, User, MoreHorizontal } from "lucide-react";
import { RAGStatusBadge } from './RAGStatusBadge';
import RAGStatusHistory, { StatusHistoryEntry } from './RAGStatusHistory';
import { ragStatusService } from '@/services/rag-status.service';

interface EmployeeManagementProps {
  onViewDetails: (employee: Employee) => void;
  onIntervene: (employee: Employee) => void;
}

// Complete component with RAG status filtering
const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ onViewDetails, onIntervene }) => {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = React.useState<Employee[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [statusFilter, setStatusFilter] = React.useState<RAGStatus | 'all'>('all');
  // State for agent analysis
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [employeesBeingAnalyzed, setEmployeesBeingAnalyzed] = React.useState<Record<string, boolean>>({});
  // State for status history
  const [statusHistories, setStatusHistories] = React.useState<Record<string, StatusHistoryEntry[]>>({});
  
  // Get the agent system hooks
  const { 
    isInitialized: isAgentSystemInitialized,
    isProcessing: isAgentProcessing,
    determineRAGStatus
  } = useAgentSystem();

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      // Get employees from the HR service
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
      
      // Extended debugging for employee data
      console.log("Total employees received:", result.employees.length);
      
      // Log the first and a few other employees for comparison
      console.log("First employee data:", JSON.stringify(result.employees[0], null, 2));
      
      // Check for Kubilay Karakas specifically
      const kubilayEmployee = result.employees.find(emp => emp.name.includes('Kubilay'));
      if (kubilayEmployee) {
        console.log("Kubilay's employee data:", JSON.stringify(kubilayEmployee, null, 2));
      }
      
      // Log raw department and position properties for the first few employees
      console.log("First 3 employees department/position properties:");
      result.employees.slice(0, 3).forEach((emp, index) => {
        console.log(`Employee ${index + 1} - ${emp.name}:`);
        console.log(`  department: ${emp.department} (type: ${typeof emp.department})`);
        console.log(`  hr_departments: ${JSON.stringify(emp.hr_departments)}`);
        console.log(`  position: ${emp.position} (type: ${typeof emp.position})`);
        console.log(`  hr_positions: ${JSON.stringify(emp.hr_positions)}`);
      });
      
      // Additional transformation to ensure department and position are properly extracted
      const transformedEmployees = result.employees.map(emp => {
        // Log transformation process for debugging employees with issues
        const departmentRaw = emp.department;
        const positionRaw = emp.position;
        const hrDeptName = emp.hr_departments?.name;
        const hrPosTitle = emp.hr_positions?.title;
        
        // More detailed debug logging
        console.log(`Transforming employee ${emp.name} (${emp.id})`, {
          original: {
            department: {
              raw: departmentRaw,
              type: typeof departmentRaw,
              exists: !!departmentRaw,
              isEmpty: departmentRaw === ''
            },
            position: {
              raw: positionRaw,
              type: typeof positionRaw,
              exists: !!positionRaw,
              isEmpty: positionRaw === ''
            },
            hr_departments: emp.hr_departments,
            hr_positions: emp.hr_positions
          }
        });
        
        // Explicitly extract department and position with better logging
        const finalDepartment = typeof departmentRaw === 'string' && departmentRaw ? 
                               departmentRaw : (hrDeptName || 'Unknown Department');
                               
        const finalPosition = typeof positionRaw === 'string' && positionRaw ? 
                             positionRaw : (hrPosTitle || 'Unknown Position');
        
        // Log any suspicious transformations
        if (finalDepartment === 'Unknown Department' || finalPosition === 'Unknown Position') {
          console.log(`Transformation issue for ${emp.name}:`, {
            departmentRaw,
            hrDeptName,
            positionRaw, 
            hrPosTitle,
            finalDepartment,
            finalPosition
          });
        }
        
        // Ensure required properties are set with debugging information 
        const improvedEmployee = {
          ...emp,
          department: finalDepartment,
          position: finalPosition,
          // Add extra debug fields to help diagnose issues
          _debug: {
            hasValidDepartment: finalDepartment !== 'Unknown Department',
            hasValidPosition: finalPosition !== 'Unknown Position',
            originalDepartmentType: typeof departmentRaw,
            originalPositionType: typeof positionRaw,
            source: emp.id.includes('custom') ? 'override' : 'standard'
          },
          // Ensure ragStatus is explicitly present and properly mapped 
          ragStatus: emp.ragStatus || emp.rag_status || 'green'
        };
        
        return improvedEmployee;
      });
      
      console.log("Transformation complete. First employee transformed:", 
        JSON.stringify(transformedEmployees[0], null, 2));
      
      setEmployees(transformedEmployees);
      setFilteredEmployees(transformedEmployees);
      
      // Fetch status histories for all employees
      const histories: Record<string, StatusHistoryEntry[]> = {};
      
      for (const employee of transformedEmployees) {
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

  // Function to analyze a specific employee using the agent system
  const analyzeEmployee = async (employee: Employee) => {
    if (!isAgentSystemInitialized) {
      toast({
        title: 'Agent System Not Available',
        description: 'The AI analysis system is not currently available.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Mark this employee as being analyzed
      setEmployeesBeingAnalyzed(prev => ({ ...prev, [employee.id]: true }));
      
      // Use the agent system to determine RAG status
      const analysisResult = await determineRAGStatus(employee);
      
      if (analysisResult && analysisResult.status) {
        // Update the employee with the new RAG status and details
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
        
        // Update the employee in the list
        const updatedEmployees = employees.map(emp => 
          emp.id === employee.id ? updatedEmployee : emp
        );
        
        setEmployees(updatedEmployees);
        
        // Update filtered employees too if needed
        if (statusFilter === 'all' || statusFilter === updatedEmployee.ragStatus) {
          setFilteredEmployees(prevFiltered => 
            prevFiltered.map(emp => emp.id === employee.id ? updatedEmployee : emp)
          );
        } else {
          // Remove from filtered list if it no longer matches the filter
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
      // Mark this employee as no longer being analyzed
      setEmployeesBeingAnalyzed(prev => ({ ...prev, [employee.id]: false }));
    }
  };
  
  // Function to analyze all employees using the agent system
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
      
      // Process employees in batches to avoid overwhelming the system
      const batchSize = 5;
      const totalEmployees = employees.length;
      let processedCount = 0;
      let updatedCount = 0;
      
      // Create a copy of the employees array to avoid direct mutations
      let updatedEmployees = [...employees];
      
      // Create batches of employees
      for (let i = 0; i < totalEmployees; i += batchSize) {
        const batch = employees.slice(i, i + batchSize);
        
        // Process each employee in the batch in parallel
        const batchResults = await Promise.all(batch.map(async (employee) => {
          try {
            const analysisResult = await determineRAGStatus(employee);
            
            if (analysisResult && analysisResult.status) {
              // Create updated employee object
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
              
              // Return the updated employee and success status
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
        
        // Update our employees array with the successful results
        batchResults.forEach(result => {
          if (result.success && result.employee) {
            updatedCount++;
            const index = updatedEmployees.findIndex(e => e.id === result.id);
            if (index !== -1) {
              updatedEmployees[index] = result.employee;
            }
          }
        });
        
        // Update the state every batch to show progress
        setEmployees(updatedEmployees);
        
        // Apply the filter to the updated employees
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

  // Filter employees when status filter changes
  React.useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredEmployees(employees);
    } else {
      setFilteredEmployees(employees.filter(employee => employee.ragStatus === statusFilter));
    }
  }, [statusFilter, employees]);

  // Fetch employees on mount
  React.useEffect(() => {
    fetchEmployees();
  }, []);

  // Add this JSX where appropriate in your component's render method
  // For example, after the filter buttons:

  const renderEmployeeList = () => {
    // ... existing employee list rendering code ...
    
    return (
      <div className="overflow-hidden bg-white shadow sm:rounded-md mt-4">
        <div className="flex justify-between items-center p-4 bg-gray-50">
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 text-sm rounded ${statusFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200'}`}
              onClick={() => setStatusFilter('all')}
            >
              All
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
          
          {/* Add Agent Analysis buttons */}
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
              No employees found with the selected status.
            </li>
          ) : (
            filteredEmployees.map(employee => (
              <li key={employee.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{employee.name}</h3>
                  <div className="text-sm text-gray-500">
                    {/* Use the display value from renderDepartmentPosition */}
                    {renderDepartmentPosition(employee).display}
                  </div>
                  <div className="text-xs text-gray-400 italic">
                    Raw: {JSON.stringify(renderDepartmentPosition(employee).rawData)}
                  </div>
                  <div className="text-xs text-blue-400">
                    Object types: dept({typeof employee.department}), pos({typeof employee.position})
                  </div>
                  <div className="text-xs text-red-400">
                    Source: {employee.id.includes('custom') ? 'Override' : 'Standard mock'}
                  </div>
                  {/* Enhanced debugging section */}
                  <div className="text-xs text-purple-400 bg-gray-100 p-1 mt-1 rounded">
                    ID: {employee.id}<br/>
                    Valid Data: {employee._debug?.hasValidDepartment ? '✅' : '❌'} dept, 
                                {employee._debug?.hasValidPosition ? '✅' : '❌'} pos<br/>
                    HR Objects: {!!employee.hr_departments ? '✅' : '❌'} dept, 
                               {!!employee.hr_positions ? '✅' : '❌'} pos
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
                    <span className="text-xs text-gray-500">
                      Last activity: {new Date(employee.lastActivity).toLocaleDateString()}
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
    // Extract department and position with fallbacks to default values
    const departmentName = employee.department && employee.department !== "Unknown Department" 
      ? employee.department 
      : (employee.hr_departments?.name && employee.hr_departments.name !== "Unknown Department"
        ? employee.hr_departments.name
        : "Not Assigned"); // Change 'Unknown Department' to 'Not Assigned'

    const positionTitle = employee.position && employee.position !== "Unknown Position"
      ? employee.position
      : (employee.hr_positions?.title && employee.hr_positions.title !== "Unknown Position" 
        ? employee.hr_positions.title
        : "Not Assigned"); // Change 'Unknown Position' to 'Not Assigned'

    // Return just the display values, not the entire component
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
