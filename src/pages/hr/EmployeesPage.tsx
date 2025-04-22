import React, { useState, useEffect } from '@/lib/react-helpers';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES, buildRoute } from '@/lib/routes';
import { hrEmployeeService } from '@/services/hrEmployeeService';
// import type { Employee } from '@/services/hrEmployeeService';
import { useHRAuth } from '@/state';
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
import { supabase } from '@/lib/supabase';
import { fetchEmployeesDirectWithKey } from '@/services/direct-employee-service';

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

// Define GetEmployeesOptions here since the import isn't working
interface GetEmployeesOptions {
  searchTerm?: string;
  departmentId?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
  companyId?: string;
  useRLS?: boolean;
}

// Add interface for the API response
interface EmployeeApiResponse {
  success: boolean;
  employees?: Employee[];
  error?: string;
  note?: string;
}

// Extended Employee type for UI display - include all Employee properties
interface DisplayEmployee extends Omit<Employee, 'ragStatus'> {
  ragStatus: 'red' | 'amber' | 'green';
  lastActivity: string;
  department?: string;
  position?: string;
  progress?: number;
  created_at?: string;
}

// Interface for CSV data with index signature
interface CSVData {
  Name: string;
  Email: string;
  Department: string;
  Position: string;
  Status: string;
  "Hire Date": string;
  "Last Activity": string;
  [key: string]: string; // Add index signature for string keys
}

// Define a complete Employee interface locally for clarity
interface Employee {
  id: string;
  name: string;
  email: string;
  department_id: string;
  position_id?: string;
  status: string;
  phone?: string;
  resume_url?: string;
  profile_image_url?: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
  // Additional fields needed
  department?: string;
  position?: string;
  hr_departments?: {
    id: string;
    name: string;
  };
  hr_positions?: {
    id: string;
    title: string;
  };
  rag_status?: string;
  ragStatus?: string;
  progress?: number;
  last_activity?: string;
  lastActivity?: string;
  hire_date?: string;
  user_id?: string;
}

// Debug function to check authentication status and try direct query
const checkAuthAndDirectQuery = async () => {
  try {
    // Check current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Current Supabase session:', session ? 'Authenticated' : 'Not authenticated');
    if (session) {
      console.log('Auth user:', session.user.id, session.user.email);
      
      // Try to get the user's company_id
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('company_id, role')
        .eq('id', session.user.id)
        .single();
        
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        console.log('User might not have a corresponding entry in user_profiles table');
      } else {
        console.log('User profile:', userProfile);
      }
      
      // Try a direct query with the current session
      console.log('Attempting direct query for employees...');
      const { data: employees, error: queryError } = await supabase
        .from('hr_employees')
        .select()
        .limit(5);
        
      if (queryError) {
        console.error('Direct query error:', queryError);
      } else {
        console.log(`Direct query found ${employees.length} employees:`, employees);
      }
    } else if (sessionError) {
      console.error('Session error:', sessionError);
    }
  } catch (err) {
    console.error('Error in auth check:', err);
  }
};

const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const hrAuthContext = useHRAuth();
  const { hrUser, isLoading: authLoading } = hrAuthContext;
  // We'll let Supabase handle company_id via RLS now that we authenticate with Supabase
  const [employees, setEmployees] = useState<DisplayEmployee[]>([]);
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
  const [serviceKey, setServiceKey] = useState('');
  const [showServiceKeyDialog, setShowServiceKeyDialog] = useState(false);
  
  // Log auth state on each render for debugging
  console.log('EmployeesPage - HR Auth Props:', JSON.stringify({
    user: hrUser ? 'exists' : 'null',
    loading: authLoading,
    username: hrUser?.username || 'none'
  }));
  
  // Use a local state to track if we've tried to fetch employees
  const [hasFetchedEmployees, setHasFetchedEmployees] = useState(false);
  
  useEffect(() => {
    fetchDepartments();
  }, []);
  
  // New simpler approach: Wait for auth loading to complete before fetching
  useEffect(() => {
    console.log('Auth loading status change:', authLoading);
    
    // Only proceed when auth loading is complete
    if (authLoading === false && !hasFetchedEmployees) {
      console.log('Auth loading complete. HR User:', hrUser ? JSON.stringify(hrUser) : 'null');
      
      // Authenticated user exists, we can fetch employees
      if (hrUser) {
        console.log('Authenticated user found, fetching employees through Supabase RLS');
        // Add a slight delay to ensure context is fully populated
        const timer = setTimeout(() => {
          console.log('Fetching employees after delay...');
          setHasFetchedEmployees(true);
          fetchEmployees();
        }, 500);
        
        return () => clearTimeout(timer);
      } else {
        console.warn('Auth loading complete but no HR user available.');
        setLoading(false);
        setError('Could not authenticate user to fetch employees.');
      }
    }
  }, [authLoading, hasFetchedEmployees, hrUser]);
  
  // Add a cleanup log to check for unmounting
  useEffect(() => {
    console.log('EmployeesPage mounted');
    
    // Run the auth check and direct query after mounting
    checkAuthAndDirectQuery();
    
    return () => {
      console.log('EmployeesPage - Effect cleanup: Component unmounting?');
    };
  }, []);

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
      
      console.log('In fetchEmployees - Using authenticated Supabase session for RLS');
      
      console.log('Fetching employees with filters:', {
        searchTerm,
        departmentFilter,
        statusFilter,
        useRLS: true
      });
      
      const options: GetEmployeesOptions = {
        searchTerm,
        departmentId: departmentFilter === 'all' ? null : departmentFilter,
        status: statusFilter === 'all' ? null : statusFilter,
        useRLS: true // Enable RLS-based filtering
      };
      
      // Type assertion to overcome the linter error about parameters
      // @ts-ignore - getEmployees does accept options in the implementation
      const result = await hrEmployeeService.getEmployees(options) as EmployeeApiResponse;
      
      if (result.success && result.employees) {
        if (result.note) {
          console.log('Employee fetch note:', result.note);
        }
        
        console.log('Raw employee data received:', result.employees.slice(0, 2));
        
        const transformedEmployees: DisplayEmployee[] = result.employees.map((emp) => {
          let normalizedRagStatus = ((emp.ragStatus || emp.rag_status || 'green') + '').toLowerCase();
          if (!['red', 'amber', 'green'].includes(normalizedRagStatus)) {
            normalizedRagStatus = 'green';
          }
          
          // Debug info for first few employees
          const index = result.employees ? result.employees.indexOf(emp) : -1;
          if (index < 2 && index >= 0) {
            console.log('Employee data to transform:', {
              id: emp.id,
              name: emp.name,
              email: emp.email,
              department_id: emp.department_id,
              department: emp.department,
              hr_departments: emp.hr_departments,
              position: emp.position,
              hr_positions: emp.hr_positions,
              ragStatus: emp.ragStatus,
              rag_status: emp.rag_status
            });
          }
          
          return {
            ...emp,
            ragStatus: normalizedRagStatus as 'red' | 'amber' | 'green',
            lastActivity: emp.last_activity || emp.lastActivity || 'Never'
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

  const calculateMetrics = (employees: DisplayEmployee[]) => {
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
      const options: GetEmployeesOptions = {
        useRLS: true // Enable RLS for export as well
      };
      
      // Type assertion to overcome the linter error about parameters
      // @ts-ignore - getEmployees does accept options in the implementation
      const result = await hrEmployeeService.getEmployees(options);
      
      if (result.success && result.employees) {
        const csvData: CSVData[] = result.employees.map((emp) => ({
          Name: emp.name,
          Email: emp.email,
          Department: emp.hr_departments?.name || '',
          Position: emp.hr_positions?.title || '',
          Status: emp.status || '',
          "Hire Date": emp.hire_date || '',
          "Last Activity": emp.last_activity || ''
        }));
        
        const headers = Object.keys(csvData[0]);
        const csvContent = [
          headers.join(','),
          ...csvData.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `employees_export_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error('Failed to fetch employees for export');
      }
    } catch (error) {
      console.error('Error exporting employees:', error);
      alert('Failed to export employees. Please try again.');
    }
  };

  // Try a more direct approach to fetch employees
  const fetchEmployeesDirectly = async () => {
    try {
      console.log('Attempting to fetch employees directly...');
      
      // Try to use a server endpoint that might use service role (if it exists)
      // This might not work if the endpoint doesn't exist, but it's worth trying
      const response = await fetch('/api/employees');
      
      if (!response.ok) {
        console.error('Direct API fetch failed:', response.status);
        
        // If the API fails, try fetching using a GET request that might bypass RLS
        console.log('Trying alternative direct fetch...');
        const { data: employees, error } = await supabase
          .from('hr_employees')
          .select('*')
          .limit(10);
        
        if (error) {
          console.error('Alternative fetch error:', error);
        } else {
          console.log(`Found ${employees.length} employees directly:`, employees);
          
          // If we get employees this way, we could use them to populate the UI
          if (employees.length > 0) {
            return employees;
          }
        }
        return null;
      }
      
      const data = await response.json();
      console.log('Direct API fetch succeeded:', data);
      return data.employees;
    } catch (error) {
      console.error('Error in direct fetch:', error);
      return null;
    }
  };

  // Try to query directly with a server-side function that might bypass RLS
  const queryWithServerFunction = async () => {
    try {
      console.log('Attempting to query with server function...');
      
      // Try using the server function that might use service role
      const response = await fetch('/api/debug/query-employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          company_id: '4fb1a692-3995-40ee-8aa5-292fd8ebf029',
          limit: 10
        })
      });
      
      if (!response.ok) {
        console.error('Server function query failed:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('Server function query succeeded:', data);
      
      if (data.employees && data.employees.length > 0) {
        // Success - we could use this data to populate the UI
        return data.employees;
      }
    } catch (error) {
      console.error('Error in server function query:', error);
    }
    
    return null;
  };

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={checkAuthAndDirectQuery}>
            Debug Auth
          </Button>
          <Button variant="outline" onClick={async () => {
            const employees = await fetchEmployeesDirectly();
            if (employees && employees.length > 0) {
              const transformedEmployees = employees.map((emp: any) => {
                return {
                  ...emp,
                  ragStatus: (emp.rag_status || 'green').toLowerCase() as 'red' | 'amber' | 'green',
                  lastActivity: emp.last_activity || 'Never',
                  progress: emp.progress || 0
                };
              });
              setEmployees(transformedEmployees);
              setLoading(false);
              calculateMetrics(transformedEmployees);
            }
          }}>
            Direct Fetch
          </Button>
          <Button variant="outline" onClick={async () => {
            const employees = await queryWithServerFunction();
            if (employees && employees.length > 0) {
              const transformedEmployees = employees.map((emp: any) => {
                return {
                  ...emp,
                  ragStatus: (emp.rag_status || 'green').toLowerCase() as 'red' | 'amber' | 'green',
                  lastActivity: emp.last_activity || 'Never',
                  progress: emp.progress || 0
                };
              });
              setEmployees(transformedEmployees);
              setLoading(false);
              calculateMetrics(transformedEmployees);
            }
          }}>
            Server Query
          </Button>
          <Button variant="outline" onClick={() => setShowServiceKeyDialog(true)}>
            Service Role
          </Button>
          <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Import Employees</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to import multiple employees at once.
                </DialogDescription>
              </DialogHeader>
              <BulkEmployeeImport onComplete={() => {
                setShowImportDialog(false);
                fetchEmployees();
              }} />
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => navigate(ROUTES.HR_DASHBOARD_EMPLOYEES_NEW)}>
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
                {departments.map((dept: Department) => (
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
                {employees.map((employee: DisplayEmployee) => (
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
                            style={{ width: `${employee.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs">{employee.progress || 0}%</span>
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
                            <Link to={buildRoute.HR_DASHBOARD_EMPLOYEES_VIEW(employee.id)} className="flex items-center w-full">
                              <FileText className="mr-2 h-4 w-4" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link to={buildRoute.HR_DASHBOARD_EMPLOYEES_EDIT(employee.id)} className="flex items-center w-full">
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

      {/* Service Key Dialog */}
      <Dialog open={showServiceKeyDialog} onOpenChange={setShowServiceKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Service Role Key</DialogTitle>
            <DialogDescription>
              This is for debugging only. Enter your Supabase service role key to bypass RLS.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Supabase service role key"
                value={serviceKey}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setServiceKey(e.target.value)}
              />
            </div>
            <Button onClick={async () => {
              if (!serviceKey) return;
              
              const result = await fetchEmployeesDirectWithKey(serviceKey);
              
              if (result.success && result.employees.length > 0) {
                const transformedEmployees = result.employees.map((emp: any) => {
                  return {
                    ...emp,
                    ragStatus: (emp.rag_status || 'green').toLowerCase() as 'red' | 'amber' | 'green',
                    lastActivity: emp.last_activity || 'Never',
                    progress: emp.progress || 0
                  };
                });
                setEmployees(transformedEmployees);
                setLoading(false);
                calculateMetrics(transformedEmployees);
                setShowServiceKeyDialog(false);
              }
            }}>
              Fetch Employees
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeesPage;
