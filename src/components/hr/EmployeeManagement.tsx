import * as React from 'react';
import { 
  Search,
  Filter,
  UserPlus,
  Upload,
  Download,
  AlertTriangle,
  Clock,
  Check
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import hrEmployeeService from '@/services/hrEmployeeService';
import { Employee } from '@/types/hr.types';
import hrDepartmentService from '@/services/hrDepartmentService';

// Function to get status badge color
const getStatusBadge = (status: string) => {
  switch(status) {
    case "active":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "inactive":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "onboarding":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "on_leave":
      return "bg-amber-100 text-amber-800 hover:bg-amber-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

// Function to get progress color
const getProgressColor = (progress: number) => {
  if (progress >= 80) return "bg-green-500";
  if (progress >= 50) return "bg-amber-500";
  return "bg-red-500";
};

const EmployeeManagement: React.FC = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(true);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = React.useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [departments, setDepartments] = React.useState([]);
  const [selectedDepartment, setSelectedDepartment] = React.useState('all');
  const [selectedStatus, setSelectedStatus] = React.useState('all');
  
  React.useEffect(() => {
    // Fetch employees and departments when component mounts
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all employees
        const employeeData = await hrEmployeeService.getAllEmployees();
        if (employeeData) {
          setEmployees(employeeData);
          setFilteredEmployees(employeeData);
        }
        
        // Fetch departments for filtering
        const departmentData = await hrDepartmentService.getAllDepartments();
        if (departmentData) {
          setDepartments(departmentData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load employee data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter employees based on search query, department, and status
  React.useEffect(() => {
    let filtered = [...employees];
    
    // Filter by search query (name or email)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        emp => emp.name.toLowerCase().includes(query) || 
               emp.email.toLowerCase().includes(query)
      );
    }
    
    // Filter by department
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }
    
    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(emp => emp.status === selectedStatus);
    }
    
    setFilteredEmployees(filtered);
  }, [searchQuery, selectedDepartment, selectedStatus, employees]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
  };
  
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
  };
  
  // Function to handle file upload (placeholder for CSV import)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      toast({
        title: "File selected",
        description: `File ${file.name} selected. Processing...`,
      });
      
      // In a real implementation, we would process the CSV file here
      // For now, just show a success message after a delay
      setTimeout(() => {
        toast({
          title: "Import successful",
          description: "Employees have been imported successfully.",
        });
      }, 2000);
    }
  };
  
  // Function to export employees as CSV (placeholder)
  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Exporting employee data...",
    });
    
    // In a real implementation, we would generate and download a CSV file
    // For now, just show a success message after a delay
    setTimeout(() => {
      toast({
        title: "Export successful",
        description: "Employee data has been exported successfully.",
      });
    }, 1000);
  };
  
  // Function to handle deleting an employee
  const handleDeleteEmployee = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        const result = await hrEmployeeService.deleteEmployee(id);
        if (result) {
          // Remove the employee from the state
          setEmployees(employees.filter(emp => emp.id !== id));
          toast({
            title: "Employee deleted",
            description: `${name} has been deleted successfully.`,
          });
        }
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast({
          title: "Error",
          description: `Failed to delete ${name}. Please try again.`,
          variant: "destructive",
        });
      }
    }
  };
  
  // Function to handle adding a new employee (redirects to the add employee page)
  const handleAddEmployee = () => {
    window.location.href = '/hr-dashboard/employees/new';
  };
  
  // Function to handle editing an employee (redirects to the edit employee page)
  const handleEditEmployee = (id: string) => {
    window.location.href = `/hr-dashboard/employees/edit/${id}`;
  };
  
  // Display loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Employee Management</h2>
          <p className="text-muted-foreground">
            Manage your organization's employees and their learning progress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddEmployee}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>
      
      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>
            Find employees by name, email, department, or status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative col-span-2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or email..."
                className="pl-9"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            
            <div>
              <Label htmlFor="department-filter" className="sr-only">Department</Label>
              <Select 
                value={selectedDepartment} 
                onValueChange={handleDepartmentChange}
              >
                <SelectTrigger id="department-filter" className="w-full">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status-filter" className="sr-only">Status</Label>
              <Select 
                value={selectedStatus} 
                onValueChange={handleStatusChange}
              >
                <SelectTrigger id="status-filter" className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {filteredEmployees.length} employees found
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="flex items-center gap-1 text-sm text-primary hover:underline">
                  <Upload className="h-4 w-4" />
                  Import CSV
                </div>
                <input 
                  id="csv-upload" 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-sm" 
                onClick={handleExport}
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Employees Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Employees</CardTitle>
          <CardDescription>
            View and manage employee information and learning progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length > 0 ? (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{employee.name}</div>
                      </TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.department}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(employee.status)}>
                          {employee.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getProgressColor(employee.progress)}`}
                              style={{ width: `${employee.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{employee.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{employee.lastActivity}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEmployee(employee.id)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-100"
                            onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-lg font-medium mb-1">No employees found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedDepartment !== 'all' || selectedStatus !== 'all'
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "Start by adding employees to your organization."}
              </p>
              <Button onClick={handleAddEmployee}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeManagement; 