import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BulkSkillsAssessment } from '@/components/hr/BulkSkillsAssessment';
import { SkillsMatrix } from '@/components/hr/SkillsMatrix';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { Loader2, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

type Employee = {
  id: string;
  name: string;
  email: string;
  department?: string;
  department_id?: string;
  position?: string;
  position_id?: string;
  [key: string]: any;
};

type Department = {
  id: string;
  name: string;
};

type Position = {
  id: string;
  title: string;
  department_id: string;
};

const SkillsInventoryPage: React.FC = () => {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [positions, setPositions] = React.useState<Position[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedTab, setSelectedTab] = React.useState('gap-assessment');
  
  // Filter states
  const [selectedDepartments, setSelectedDepartments] = React.useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = React.useState<string[]>([]);
  const [showDepartmentFilter, setShowDepartmentFilter] = React.useState(false);
  const [showPositionFilter, setShowPositionFilter] = React.useState(false);
  
  // Filtered employees based on selected departments and positions
  const filteredEmployees = employees.filter((employee: Employee) => {
    if (selectedDepartments.length === 0 && selectedPositions.length === 0) {
      return true;
    }
    
    const departmentMatch = selectedDepartments.length === 0 || 
      (employee.department_id && selectedDepartments.includes(employee.department_id));
      
    const positionMatch = selectedPositions.length === 0 || 
      (employee.position_id && selectedPositions.includes(employee.position_id));
      
    return departmentMatch && positionMatch;
  });

  // Load employees, departments and positions on mount
  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch employees
        const employeesResult = await hrEmployeeService.getEmployees();
        if (employeesResult.success && employeesResult.employees) {
          // Map department and position names to top-level fields
          const mappedEmployees = employeesResult.employees.map(emp => ({
            ...emp,
            department: emp.hr_departments?.name || null,
            position: emp.hr_positions?.title || null,
          }));
          setEmployees(mappedEmployees);
        } else {
          throw new Error(employeesResult.error || 'Failed to fetch employees');
        }
        
        // Fetch departments
        const departmentsResult = await hrEmployeeService.getDepartments();
        if (departmentsResult.success && departmentsResult.departments) {
          setDepartments(departmentsResult.departments);
        }
        
        // Add a small delay to ensure employees are loaded before extracting positions
        setTimeout(() => {
          // Extract unique positions from employees
          if (employeesResult.success && employeesResult.employees) {
            const employeeList = employeesResult.employees;
            const positionsMap = new Map();
            
            employeeList.forEach((emp) => {
              if (emp.position_id && emp.position && !positionsMap.has(emp.position_id)) {
                positionsMap.set(emp.position_id, {
                  id: emp.position_id,
                  title: emp.position,
                  department_id: emp.department_id || ''
                });
              }
            });
            
            setPositions(Array.from(positionsMap.values()));
          }
        }, 300);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'An error occurred while fetching data');
        toast({
          title: 'Error',
          description: 'Failed to load employees data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelectAllEmployees = () => {
    // This function will be called when the "Select All" button is clicked
    const selectAllButton = document.querySelector('button[data-select-all="true"]');
    if (selectAllButton) {
      (selectAllButton as HTMLElement).click();
    }
    
    toast({
      title: 'All employees selected',
      description: `Selected ${filteredEmployees.length} employees for assessment.`
    });
  };

  const handleUnselectAllEmployees = () => {
    // This function will be called when the "Clear Selection" button is clicked
    const clearSelectionButton = document.querySelector('button[data-clear-selection="true"]');
    if (clearSelectionButton) {
      (clearSelectionButton as HTMLElement).click();
    }
    
    toast({
      title: 'Selection cleared',
      description: 'Cleared all employee selections.'
    });
  };

  const handleInitiateAssessment = () => {
    const assessButton = document.querySelector('button[data-assess-skills="true"]');
    if (assessButton) {
      (assessButton as HTMLElement).click();
    } else {
      toast({
        title: 'Assessment Initiated',
        description: 'Starting skills gap assessment for selected employees.',
      });
    }
  };

  const handleToggleDepartmentFilter = (departmentId: string) => {
    setSelectedDepartments((prev: string[]) => 
      prev.includes(departmentId) 
        ? prev.filter((id: string) => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  const handleTogglePositionFilter = (positionId: string) => {
    setSelectedPositions((prev: string[]) => 
      prev.includes(positionId) 
        ? prev.filter((id: string) => id !== positionId)
        : [...prev, positionId]
    );
  };

  const handleClearDepartmentFilters = () => {
    setSelectedDepartments([]);
  };

  const handleClearPositionFilters = () => {
    setSelectedPositions([]);
  };

  const getActiveFilterCount = () => {
    return selectedDepartments.length + selectedPositions.length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Skills Inventory</h1>
          <p className="text-muted-foreground">
            Assess and manage skills across your organization
          </p>
        </div>
      </div>

      <Tabs defaultValue="gap-assessment" value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="gap-assessment">Skills Gap Assessment</TabsTrigger>
          <TabsTrigger value="skill-matrix">Skill Matrix</TabsTrigger>
          <TabsTrigger value="training-needs">Training Needs</TabsTrigger>
        </TabsList>

        <TabsContent value="gap-assessment" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Skills Gap Assessment Tool</CardTitle>
                  <CardDescription>
                    Analyze skills gaps between course requirements and employee skills
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleSelectAllEmployees}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleUnselectAllEmployees}>
                    Clear Selection
                  </Button>
                  <Button size="sm" variant="default" onClick={handleInitiateAssessment}>
                    Start Assessment
                  </Button>
                  
                  {/* Department Filter */}
                  <Popover 
                    open={showDepartmentFilter} 
                    onOpenChange={setShowDepartmentFilter}
                  >
                    <PopoverTrigger asChild>
                      <Button 
                        size="sm" 
                        variant={selectedDepartments.length > 0 ? "default" : "outline"}
                        className="flex items-center gap-1"
                      >
                        By Department
                        {selectedDepartments.length > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {selectedDepartments.length}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <div className="font-medium">Filter by Department</div>
                        <ScrollArea className="h-60">
                          <div className="space-y-2">
                            {departments.map((dept: Department) => (
                              <div key={dept.id} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`dept-${dept.id}`} 
                                  checked={selectedDepartments.includes(dept.id)}
                                  onCheckedChange={() => handleToggleDepartmentFilter(dept.id)}
                                />
                                <label 
                                  htmlFor={`dept-${dept.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {dept.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        {selectedDepartments.length > 0 && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={handleClearDepartmentFilters}
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Position Filter */}
                  <Popover 
                    open={showPositionFilter} 
                    onOpenChange={setShowPositionFilter}
                  >
                    <PopoverTrigger asChild>
                      <Button 
                        size="sm" 
                        variant={selectedPositions.length > 0 ? "default" : "outline"}
                        className="flex items-center gap-1"
                      >
                        By Position
                        {selectedPositions.length > 0 && (
                          <Badge variant="secondary" className="ml-1">
                            {selectedPositions.length}
                          </Badge>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <div className="font-medium">Filter by Position</div>
                        <ScrollArea className="h-60">
                          <div className="space-y-2">
                            {positions.map((pos: Position) => (
                              <div key={pos.id} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`pos-${pos.id}`} 
                                  checked={selectedPositions.includes(pos.id)}
                                  onCheckedChange={() => handleTogglePositionFilter(pos.id)}
                                />
                                <label 
                                  htmlFor={`pos-${pos.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {pos.title}
                                </label>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                        {selectedPositions.length > 0 && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={handleClearPositionFilters}
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  
                  {getActiveFilterCount() > 0 && (
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => {
                        setSelectedDepartments([]);
                        setSelectedPositions([]);
                      }}
                    >
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading employees...</span>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-8">
                  {error}
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium">No Employees Found</h3>
                  <p className="text-muted-foreground">
                    {getActiveFilterCount() > 0 
                      ? 'Try adjusting your filters to see more employees.'
                      : 'No employees available. Add employees to get started.'}
                  </p>
                </div>
              ) : (
                <BulkSkillsAssessment employees={filteredEmployees} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skill-matrix" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Organizational Skill Matrix</CardTitle>
              <CardDescription>
                View and analyze skill distribution across your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SkillsMatrix />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training-needs" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Training Needs Analysis</CardTitle>
              <CardDescription>
                Identify training requirements based on skill gaps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-muted-foreground">
                <p>Training Needs Analysis feature coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SkillsInventoryPage; 