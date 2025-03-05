import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MoreHorizontal, Trash2, Edit, ArrowDown, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { hrDepartmentService } from '@/services/hrDepartmentService';

// Define interfaces for type safety
interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  hireDate: string;
}

interface Department {
  id: string;
  name: string;
}

const EmployeeManagement: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = React.useState<string>('all');
  const [sortField, setSortField] = React.useState<keyof Employee>('name');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  // Fetch employees and departments on component mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch employees
        const employeesResponse = await hrEmployeeService.getAllEmployees();
        if (employeesResponse && employeesResponse.success && employeesResponse.employees) {
          setEmployees(employeesResponse.employees);
        }
        
        // Fetch departments - corrected method name from getDepartments to getAllDepartments
        const departmentsResponse = await hrDepartmentService.getAllDepartments();
        if (departmentsResponse && departmentsResponse.success && departmentsResponse.departments) {
          setDepartments(departmentsResponse.departments);
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
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

  // Filter employees based on search query and selected department
  const filteredEmployees = React.useMemo(() => {
    return employees.filter(employee => {
      const matchesSearch = 
        employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.position.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDepartment = 
        selectedDepartment === 'all' || 
        employee.department === selectedDepartment;
      
      return matchesSearch && matchesDepartment;
    });
  }, [employees, searchQuery, selectedDepartment]);

  // Sort employees based on sort field and direction
  const sortedEmployees = React.useMemo(() => {
    return [...filteredEmployees].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredEmployees, sortField, sortDirection]);

  // Handle sort column click
  const handleSort = (field: keyof Employee) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle employee deletion
  const handleDeleteEmployee = async (id: string) => {
    try {
      const result = await hrEmployeeService.deleteEmployee(id);
      
      if (result && result.success) {
        setEmployees(employees.filter(emp => emp.id !== id));
        toast({
          title: "Success",
          description: "Employee has been deleted successfully.",
        });
      } else {
        throw new Error(result?.error || 'Failed to delete employee');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-red-100 text-red-800';
      case 'On Leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Employee Management</h2>
        <Button onClick={() => navigate('/hr-dashboard/employees/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger>
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by department" />
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
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Employees</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Name
                        {sortField === 'name' && (
                          sortDirection === 'asc' ? 
                            <ArrowUp className="ml-1 h-4 w-4" /> : 
                            <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center">
                        Email
                        {sortField === 'email' && (
                          sortDirection === 'asc' ? 
                            <ArrowUp className="ml-1 h-4 w-4" /> : 
                            <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('department')}
                    >
                      <div className="flex items-center">
                        Department
                        {sortField === 'department' && (
                          sortDirection === 'asc' ? 
                            <ArrowUp className="ml-1 h-4 w-4" /> : 
                            <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('position')}
                    >
                      <div className="flex items-center">
                        Position
                        {sortField === 'position' && (
                          sortDirection === 'asc' ? 
                            <ArrowUp className="ml-1 h-4 w-4" /> : 
                            <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {sortField === 'status' && (
                          sortDirection === 'asc' ? 
                            <ArrowUp className="ml-1 h-4 w-4" /> : 
                            <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => handleSort('hireDate')}
                    >
                      <div className="flex items-center">
                        Hire Date
                        {sortField === 'hireDate' && (
                          sortDirection === 'asc' ? 
                            <ArrowUp className="ml-1 h-4 w-4" /> : 
                            <ArrowDown className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEmployees.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No employees found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedEmployees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.name}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>
                          {departments.find(d => d.id === employee.department)?.name || employee.department}
                        </TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(employee.status)}>
                            {employee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{employee.hireDate}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => navigate(`/hr-dashboard/employees/${employee.id}`)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDeleteEmployee(employee.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeManagement;
