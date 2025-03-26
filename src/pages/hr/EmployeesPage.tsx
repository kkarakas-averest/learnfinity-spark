import React, { useState, useEffect } from '@/lib/react-helpers';
import { Link } from 'react-router-dom';
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

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: string;
  ragStatus: 'red' | 'amber' | 'green';
  progress: number;
  lastActivity: string;
}

interface EmployeeResponse {
  success: boolean;
  data?: Employee[];
  error?: {
    message: string;
  };
}

const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchEmployees();
  }, [departmentFilter, statusFilter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await hrEmployeeService.getEmployees({
        searchTerm,
        departmentId: departmentFilter || null,
        status: statusFilter || null
      });
      
      if (result.success) {
        // Transform the employee data to match our interface
        const transformedEmployees = result.employees.map(emp => ({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          department: emp.hr_departments?.name || 'Unknown Department',
          position: emp.hr_positions?.title || 'Unknown Position',
          status: emp.status,
          ragStatus: emp.rag_status || 'green',
          progress: emp.progress || 0,
          lastActivity: emp.last_activity || 'Never'
        }));
        setEmployees(transformedEmployees);
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleBulkAction = (action: string) => {
    // Implement bulk actions
    console.log('Bulk action:', action);
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => handleBulkAction('import')}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={() => handleBulkAction('export')}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
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
              <p className="text-2xl font-bold text-green-800">245</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg">
              <h3 className="text-lg font-semibold text-amber-700">On Leave</h3>
              <p className="text-2xl font-bold text-amber-800">12</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="text-lg font-semibold text-red-700">At Risk</h3>
              <p className="text-2xl font-bold text-red-800">8</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-700">New This Month</h3>
              <p className="text-2xl font-bold text-blue-800">15</p>
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
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
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
                        <span className="ml-2 text-sm">{employee.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{employee.lastActivity}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            Delete
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
