
import React, { useState, useEffect } from '@/lib/react-helpers';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { TableFilterControls } from '@/components/ui/table-filters';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  UserPlus, 
  UserCog, 
  MoreHorizontal, 
  FileText, 
  Edit, 
  Trash2, 
  Filter, 
  LifeBuoy,
  Upload,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { Employee, RAGStatus } from '@/types/hr.types';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { hrDepartmentService } from '@/lib/services/hrDepartmentService';

// RAG status colors
const ragStatusColors = {
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  green: 'bg-green-500',
};

interface EmployeeManagementProps {
  onViewDetails?: (employee: Employee) => void;
  onIntervene?: (employee: Employee) => void;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({
  onViewDetails,
  onIntervene,
}) => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ragFilter, setRagFilter] = useState<string>('all');
  const [departments, setDepartments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const { data, error } = await hrEmployeeService.getEmployees();
        if (error) {
          throw error;
        }
        setEmployees(data || []);
        setFilteredEmployees(data || []);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Failed to load employees. Please try again later.');
        toast.error('Failed to load employees');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const { data, error } = await hrDepartmentService.getDepartments();
        if (error) {
          throw error;
        }
        setDepartments(data || []);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };

    fetchDepartments();
  }, []);

  // Filter employees based on search term, department, and RAG status
  useEffect(() => {
    let filtered = [...employees];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (employee) =>
          employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employee.position?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(
        (employee) => employee.department_id === departmentFilter
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (employee) => employee.status === statusFilter
      );
    }

    // Apply RAG filter
    if (ragFilter !== 'all') {
      filtered = filtered.filter(
        (employee) => employee.ragStatus === ragFilter
      );
    }

    setFilteredEmployees(filtered);
  }, [searchTerm, departmentFilter, statusFilter, ragFilter, employees]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDepartmentChange = (value: string) => {
    setDepartmentFilter(value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleRagChange = (value: string) => {
    setRagFilter(value);
  };

  const handleCreateEmployee = () => {
    navigate(ROUTES.EMPLOYEE_CREATE);
  };

  const handleBulkOnboarding = () => {
    navigate(ROUTES.EMPLOYEE_ONBOARDING);
  };

  const handleViewDetails = (employee: Employee) => {
    if (onViewDetails) {
      onViewDetails(employee);
    } else {
      navigate(ROUTES.EMPLOYEE_DETAILS(employee.id));
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    navigate(ROUTES.EMPLOYEE_EDIT(employee.id));
  };

  const handleIntervene = (employee: Employee) => {
    if (onIntervene) {
      onIntervene(employee);
    } else {
      // TODO: Implement intervention functionality
      toast.info(`Intervention not implemented for ${employee.name}`);
    }
  };
  
  // Find department name by ID
  const getDepartmentName = (departmentId: string | undefined) => {
    if (!departmentId) return 'None';
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : 'Unknown';
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Employee Management</h2>
            <div className="flex space-x-2">
              <Button onClick={handleBulkOnboarding} variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Onboarding
              </Button>
              <Button onClick={handleCreateEmployee} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </div>

          <TableFilterControls>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employees..."
                className="pl-8 w-[300px]"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Select value={departmentFilter} onValueChange={handleDepartmentChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Departments" />
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

              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ragFilter} onValueChange={handleRagChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All RAG Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All RAG Status</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="amber">Amber</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TableFilterControls>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="flex justify-center items-center">
              <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
            </div>
            <p className="mt-2 text-muted-foreground">Loading employees...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No employees found.</p>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your filters or add new employees.
            </p>
            <Button onClick={handleCreateEmployee} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Employee Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          ragStatusColors[employee.ragStatus as RAGStatus] || 'bg-gray-300'
                        }`}
                      ></div>
                    </TableCell>
                    <TableCell className="font-medium">{employee.name}</TableCell>
                    <TableCell>{getDepartmentName(employee.department_id)}</TableCell>
                    <TableCell>{employee.position || '—'}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          employee.status === 'active'
                            ? 'success'
                            : employee.status === 'inactive'
                            ? 'secondary'
                            : employee.status === 'onboarding'
                            ? 'outline'
                            : 'destructive'
                        }
                      >
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(employee)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditEmployee(employee)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleIntervene(employee)}
                            >
                              <LifeBuoy className="mr-2 h-4 w-4" />
                              Create Intervention
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeManagement;
