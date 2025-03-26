import React, { useState, useEffect } from '@/lib/react-helpers';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { hrEmployeeService } from '@/lib/services/hrEmployeeService';
import { RAGStatusBadge } from '@/components/hr/RAGStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Upload,
  UserPlus,
  FileText,
  Settings
} from 'lucide-react';
import BulkEmployeeImport from '@/components/hr/BulkEmployeeImport';

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  department_id?: string;
  position: string;
  position_id?: string;
  status: string;
  ragStatus: 'red' | 'amber' | 'green';
  progress: number;
  lastActivity: string;
  created_at?: string;
}

interface Department {
  id: string;
  name: string;
}

interface EmployeeResponse {
  success: boolean;
  data?: Employee[];
  error?: {
    message: string;
  };
}

interface EmployeeMetrics {
  active: number;
  onLeave: number;
  atRisk: number;
  newThisMonth: number;
}

interface BulkEmployeeImportProps {
  onComplete?: () => void;
}

const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [metrics, setMetrics] = useState<EmployeeMetrics>({
    active: 0,
    onLeave: 0,
    atRisk: 0,
    newThisMonth: 0
  });
  const [showImportDialog, setShowImportDialog] = useState(false);
  
  useEffect(() => {
    fetchDepartments();
  }, []);
  
  useEffect(() => {
    fetchEmployees();
  }, [departmentFilter, statusFilter]);

  const fetchDepartments = async () => {
    try {
      const result = await hrEmployeeService.getDepartments();
      if (result.success) {
        console.log('Fetched departments:', result.departments);
        setDepartments(result.departments);
      } else {
        console.error('Failed to fetch departments:', result.error);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching employees with filters:', {
        searchTerm,
        departmentId: departmentFilter === 'all' ? null : departmentFilter,
        status: statusFilter === 'all' ? null : statusFilter
      });
      
      const result = await hrEmployeeService.getEmployees({
        searchTerm,
        departmentId: departmentFilter === 'all' ? null : departmentFilter,
        status: statusFilter === 'all' ? null : statusFilter
      });
      
      if (result.success) {
        // Transform the employee data to match our interface
        const transformedEmployees = result.employees.map(emp => {
          // Ensure ragStatus is normalized to one of the valid values
          let normalizedRagStatus = (emp.ragStatus || emp.rag_status || 'green').toLowerCase();
          if (!['red', 'amber', 'green'].includes(normalizedRagStatus)) {
            normalizedRagStatus = 'green'; // Default to green if invalid value
          }
          
          return {
            id: emp.id,
            name: emp.name,
            email: emp.email,
            department: emp.hr_departments?.name || emp.department || 'Unknown Department',
            department_id: emp.hr_departments?.id || emp.department_id,
            position: emp.hr_positions?.title || emp.position || 'Unknown Position',
            position_id: emp.hr_positions?.id || emp.position_id,
            status: emp.status,
            ragStatus: normalizedRagStatus as 'red' | 'amber' | 'green',
            progress: emp.progress || 0,
            lastActivity: emp.last_activity || 'Never',
            created_at: emp.created_at
          };
        });
        
        console.log('Transformed employees:', transformedEmployees.slice(0, 2));
        setEmployees(transformedEmployees);
        calculateMetrics(transformedEmployees);
      } else {
        setEmployees([]);
        setError(result.error || 'Failed to fetch employees');
        console.error('Failed to fetch employees:', result.error);
      }
    } catch (error) {
      setEmployees([]);
      setError('An error occurred while fetching employees');
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (employees: Employee[]) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const metrics = {
      active: employees.filter(e => e.status === 'active').length,
      onLeave: employees.filter(e => e.status === 'on_leave').length,
      atRisk: employees.filter(e => e.ragStatus === 'red').length,
      newThisMonth: employees.filter(e => {
        const createdAt = e.created_at ? new Date(e.created_at) : null;
        return createdAt && createdAt >= firstDayOfMonth;
      }).length
    };
    
    setMetrics(metrics);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleExportCSV = async () => {
    try {
      // Get all employees for export
      const result = await hrEmployeeService.getEmployees({});
      
      if (!result.success || !result.employees) {
        throw new Error('Failed to fetch employees for export');
      }
      
      // Format data for CSV
      const csvData = result.employees.map(emp => ({
        Name: emp.name,
        Email: emp.email,
        Department: emp.hr_departments?.name || '',
        Position: emp.hr_positions?.title || '',
        Status: emp.status || '',
        "Hire Date": emp.hire_date || '',
        "Last Activity": emp.last_activity || ''
      }));
      
      // Convert to CSV string
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
      ].join('\n');
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `employees_export_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting employees:', error);
      alert('Failed to export employees. Please try again.');
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <div className="flex space-x-2">
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Import Employees</DialogTitle>
                <DialogDescription>
                  Import employees from a CSV file. The file should include name, email, department, and position.
                </DialogDescription>
              </DialogHeader>
              <div>
                <BulkEmployeeImport />
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => {
                    setShowImportDialog(false);
                    fetchEmployees();
                  }}>
                    Done
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => navigate(`${ROUTES.HR_DASHBOARD}/employees/new`)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="text-lg font-semibold text-green-700">Active Employees</h3>
              <p className="text-2xl font-bold text-green-800">{metrics.active}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <h3 className="text-lg font-semibold text-amber-700">On Leave</h3>
              <p className="text-2xl font-bold text-amber-800">{metrics.onLeave}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="text-lg font-semibold text-red-700">At Risk</h3>
              <p className="text-2xl font-bold text-red-800">{metrics.atRisk}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-700">New This Month</h3>
              <p className="text-2xl font-bold text-blue-800">{metrics.newThisMonth}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Employee List</CardTitle>
            <Tabs defaultValue="all" className="w-[400px]" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={handleSearch}
                className="max-w-sm"
              />
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Department" />
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No employees found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {employee.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>{employee.position}</TableCell>
                    <TableCell>
                      <RAGStatusBadge status={employee.ragStatus} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${employee.progress}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs">{employee.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{employee.lastActivity}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Link to={`${ROUTES.HR_DASHBOARD}/employees/${employee.id}`} className="flex items-center w-full">
                              <FileText className="mr-2 h-4 w-4" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link to={`${ROUTES.HR_DASHBOARD}/employees/${employee.id}/edit`} className="flex items-center w-full">
                              <Settings className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeesPage;
