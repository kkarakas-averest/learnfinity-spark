import React, { useState, useEffect } from '@/lib/react-helpers';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES, buildRoute } from '@/lib/routes';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { useHRAuth } from '@/state';
import RAGStatusBadge from '@/components/hr/RAGStatusBadge';
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
  Settings,
  AlertTriangle,
  Info
} from 'lucide-react';
import BulkEmployeeImport from '@/components/hr/BulkEmployeeImport';
import { supabase } from '@/lib/supabase';
import { 
  fetchEmployeesDirectWithKey, 
  checkSupabaseConnection,
  fetchEmployeesWithAuthSession
} from '@/services/direct-employee-service';
import { toast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Keep all existing interfaces and type definitions
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

interface GetEmployeesOptions {
  searchTerm?: string;
  departmentId?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
  companyId?: string;
  useRLS?: boolean;
}

interface EmployeeApiResponse {
  success: boolean;
  employees?: Employee[];
  error?: string;
  note?: string;
  userProfile?: any;
}

interface DisplayEmployee extends Omit<Employee, 'ragStatus'> {
  ragStatus: 'red' | 'amber' | 'green';
  lastActivity: string;
  department?: string;
  position?: string;
  progress?: number;
  created_at?: string;
}

interface CSVData {
  Name: string;
  Email: string;
  Department: string;
  Position: string;
  Status: string;
  "Hire Date": string;
  "Last Activity": string;
  [key: string]: string;
}

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

const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const hrAuthContext = useHRAuth();
  const { hrUser, isLoading: authLoading } = hrAuthContext;
  const [employees, setEmployees] = useState<DisplayEmployee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
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
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const [showAuthWarning, setShowAuthWarning] = useState(false);
  
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

    // Check authentication status initially
    checkAuthStatus();
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
        setShowAuthWarning(true);
      }
    }
  }, [authLoading, hasFetchedEmployees, hrUser]);

  const checkAuthStatus = async () => {
    const connectionInfo = await checkSupabaseConnection();
    setDebugInfo((prev: Record<string, any>) => ({ ...prev, authStatus: connectionInfo }));
    
    if (!connectionInfo.authenticated) {
      setShowAuthWarning(true);
    }
    
    return connectionInfo;
  };

  const fetchDepartments = async () => {
    try {
      const result = await hrEmployeeService.getDepartments();
      if (result.success) {
        console.log('Fetched departments:', result.departments);
        setDepartments(result.departments);
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, departments: result.departments }));
      } else {
        console.error('Failed to fetch departments:', result.error);
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, departmentError: result.error }));
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDebugInfo((prev: Record<string, any>) => ({ ...prev, departmentError: error }));
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
      
      // First try the standard service
      // @ts-ignore - getEmployees does accept options in the implementation
      const result = await hrEmployeeService.getEmployees(options) as EmployeeApiResponse;
      
      // Store debug info
      setDebugInfo((prev: Record<string, any>) => ({ ...prev, standardFetch: result }));
      
      // If standard fetch fails or returns empty, try the direct auth method
      if (!result.success || !result.employees || result.employees.length === 0) {
        console.log('Standard fetch failed or returned empty. Trying direct auth method...');
        const directResult = await fetchEmployeesWithAuthSession();
        setDebugInfo((prev: Record<string, any>) => ({ ...prev, directAuthFetch: directResult }));
        
        // If direct auth method succeeds, use those results
        if (directResult.success && directResult.employees && directResult.employees.length > 0) {
          processEmployees(directResult);
          return;
        } else {
          // Both methods failed, show error from standard method
          setEmployees([]);
          setError(result.error || 'Failed to fetch employees');
          console.error('Failed to fetch employees:', result.error);
        }
      } else {
        // Standard fetch succeeded
        processEmployees(result);
      }
    } catch (error) {
      setEmployees([]);
      setError('An error occurred while fetching employees');
      console.error('Error fetching employees:', error);
      setDebugInfo((prev: Record<string, any>) => ({ ...prev, fetchError: error }));
    } finally {
      setLoading(false);
    }
  };
  
  // Common processing function for employee data
  const processEmployees = (result: EmployeeApiResponse) => {
    if (result.note) {
      console.log('Employee fetch note:', result.note);
    }
    
    console.log('Raw employee data received:', result.employees?.slice(0, 2));
    
    const transformedEmployees: DisplayEmployee[] = (result.employees || []).map((emp) => {
      let normalizedRagStatus = ((emp.ragStatus || emp.rag_status || 'green') + '').toLowerCase();
      if (!['red', 'amber', 'green'].includes(normalizedRagStatus)) {
        normalizedRagStatus = 'green';
      }
      
      return {
        ...emp,
        ragStatus: normalizedRagStatus as 'red' | 'amber' | 'green',
        lastActivity: emp.last_activity || emp.lastActivity || 'Never',
        department: emp.department || (emp.hr_departments ? emp.hr_departments.name : ''),
        position: emp.position || (emp.hr_positions ? emp.hr_positions.title : '')
      };
    });
    
    console.log('Transformed employees:', transformedEmployees.slice(0, 2));
    setEmployees(transformedEmployees);
    calculateMetrics(transformedEmployees);
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
      toast({
        title: "Export Failed",
        description: "Failed to export employees. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Debug function to test fetch with service role key
  const fetchWithServiceKey = async () => {
    if (!serviceKey) {
      toast({
        title: "Error",
        description: "Please enter a service role key",
        variant: "destructive"
      });
      return;
    }
    
    const result = await fetchEmployeesDirectWithKey(serviceKey);
    
    // Store debug info
    setDebugInfo((prev: Record<string, any>) => ({ ...prev, serviceKeyFetch: result }));
    
    if (result.success && result.employees && result.employees.length > 0) {
      const transformedEmployees = result.employees.map((emp: any) => {
        return {
          ...emp,
          ragStatus: (emp.rag_status || 'green').toLowerCase() as 'red' | 'amber' | 'green',
          lastActivity: emp.last_activity || 'Never',
          progress: emp.progress || 0,
          department: emp.hr_departments ? emp.hr_departments.name : '',
          position: emp.hr_positions ? emp.hr_positions.title : ''
        };
      });
      setEmployees(transformedEmployees);
      setLoading(false);
      calculateMetrics(transformedEmployees);
      setShowServiceKeyDialog(false);
      
      toast({
        title: "Success",
        description: `Fetched ${transformedEmployees.length} employees using service role key`,
        variant: "default"
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to fetch employees",
        variant: "destructive"
      });
    }
  };

  // Debug function to run auth check
  const runAuthCheck = async () => {
    const result = await checkAuthStatus();
    
    if (result.authenticated) {
      toast({
        title: "Authentication Status",
        description: `Authenticated as ${result.email}`,
        variant: "default"
      });
    } else {
      toast({
        title: "Authentication Status",
        description: "Not authenticated",
        variant: "destructive"
      });
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

      {showAuthWarning && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div>
            <h3 className="font-medium text-amber-800">Authentication Warning</h3>
            <p className="text-amber-700 text-sm">
              You appear to be not properly authenticated or your session may have expired. 
              This could affect your ability to view or manage employees.
            </p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" onClick={() => navigate(ROUTES.HR_LOGIN)}>
            Re-login
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowAuthWarning(false)}>
            Dismiss
          </Button>
        </div>
      )}

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
            <Button variant="outline" onClick={fetchEmployees}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Loading employees...</span>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-2">No employees found</div>
              <div className="text-sm text-gray-400">
                {debugInfo?.authStatus?.authenticated 
                  ? "You're authenticated, but no employees match your criteria." 
                  : "You may need to authenticate to view employees."}
              </div>
              {!debugInfo?.authStatus?.authenticated && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => navigate(ROUTES.HR_LOGIN)}
                >
                  Go to Login
                </Button>
              )}
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
                    <TableCell>{employee.department || 'Not assigned'}</TableCell>
                    <TableCell>{employee.position || 'Not assigned'}</TableCell>
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
            <Button onClick={fetchWithServiceKey}>
              Fetch Employees
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Debug Info Dialog */}
      <Dialog open={showDebugDialog} onOpenChange={setShowDebugDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Debug Information</DialogTitle>
            <DialogDescription>
              This information can help diagnose authentication and data fetching issues.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Authentication Status:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                {debugInfo?.authStatus
                  ? JSON.stringify(debugInfo.authStatus, null, 2) 
                  : 'No authentication check performed yet'}
              </pre>
              <Button size="sm" onClick={runAuthCheck}>
                Run Auth Check
              </Button>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Standard Fetch Result:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                {debugInfo?.standardFetch 
                  ? JSON.stringify(debugInfo.standardFetch, null, 2)
                  : 'No fetch performed yet'}
              </pre>
              <Button size="sm" onClick={fetchEmployees}>
                Try Standard Fetch
              </Button>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Direct Auth Fetch Result:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                {debugInfo?.directAuthFetch 
                  ? JSON.stringify(debugInfo.directAuthFetch, null, 2)
                  : 'No direct fetch performed yet'}
              </pre>
              <Button size="sm" onClick={async () => {
                const result = await fetchEmployeesWithAuthSession();
                setDebugInfo((prev: Record<string, any>) => ({ ...prev, directAuthFetch: result }));
              }}>
                Try Direct Auth Fetch
              </Button>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Service Key Fetch Result:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                {debugInfo?.serviceKeyFetch 
                  ? JSON.stringify(debugInfo.serviceKeyFetch, null, 2)
                  : 'No service key fetch performed yet'}
              </pre>
              <Button size="sm" onClick={() => setShowServiceKeyDialog(true)}>
                Try Service Key Fetch
              </Button>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Departments:</h3>
              <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto max-h-40">
                {debugInfo?.departments 
                  ? JSON.stringify(debugInfo.departments, null, 2)
                  : 'No departments fetched yet'}
              </pre>
              <Button size="sm" onClick={fetchDepartments}>
                Refresh Departments
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Authentication Warning Dialog */}
      <AlertDialog open={showAuthWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Authentication Issue Detected</AlertDialogTitle>
            <AlertDialogDescription>
              It appears you are not properly authenticated or your session may have expired. 
              This will prevent you from viewing and managing employees. 
              Would you like to go to the login page to authenticate?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowAuthWarning(false)}>
              Dismiss
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate(ROUTES.HR_LOGIN)}>
              Go to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EmployeesPage;
