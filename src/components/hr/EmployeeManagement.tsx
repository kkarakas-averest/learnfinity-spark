import React from 'react';
import { useState, useEffect } from '@/lib/react-helpers';
import { Link, useNavigate } from 'react-router-dom';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { hrEmployeeService } from '@/services/hrEmployeeService';
import { 
  ChevronsUpDown, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  LifeBuoy 
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;  
  email: string;
  title?: string;
  department?: string;
  department_id?: string;
  position?: string;
  position_id?: string;
  status?: string;
  profileImageUrl?: string;
  ragStatus?: string;
  ragStatusLastUpdated?: Date;
  progress?: number;
  lastActivity?: string;
  created_at?: string;
}

interface EmployeeManagementProps {
  onViewDetails?: (employee: Employee) => void;
  onIntervene?: (employee: Employee) => void;
}

const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ 
  onViewDetails, 
  onIntervene 
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<'name' | 'email' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const navigate = useNavigate();
  
  useEffect(() => {
    loadEmployees();
  }, []);
  
  const loadEmployees = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await hrEmployeeService.getEmployees();
      
      if (result.success && result.employees) {
        // Transform data to match our component interface
        const transformedEmployees = result.employees.map(emp => ({
          id: emp.id,
          name: emp.name || 'No Name',
          email: emp.email || '',
          title: emp.position || emp.hr_positions?.title || '',
          department: emp.department || emp.hr_departments?.name || '',
          department_id: emp.department_id || emp.hr_departments?.id,
          position_id: emp.position_id || emp.hr_positions?.id,
          status: emp.status || 'active',
          ragStatus: (emp.rag_status || emp.ragStatus || 'green').toLowerCase(),
          progress: emp.progress || 0,
          lastActivity: emp.last_activity || emp.lastActivity || 'Never'
        }));
        setEmployees(transformedEmployees);
      } else {
        setError(result.error?.message || 'Failed to load employees');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSort = (column: 'name' | 'email') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  const sortedEmployees = React.useMemo(() => {
    if (!sortColumn) return employees;
    
    return [...employees].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
  }, [employees, sortColumn, sortDirection]);
  
  const filteredEmployees = sortedEmployees.filter(employee => {
    const searchStr = searchQuery.toLowerCase();
    return (
      employee.name.toLowerCase().includes(searchStr) ||
      employee.email.toLowerCase().includes(searchStr)
    );
  });
  
  const handleAddEmployee = () => {
    navigate('/hr-dashboard/employees/new');
  };
  
  const handleExportCSV = async () => {
    try {
      setLoading(true);
      // Get all employees for export
      const result = await hrEmployeeService.getEmployees();
      
      if (!result.success || !result.employees) {
        throw new Error('Failed to fetch employees for export');
      }
      
      // Format data for CSV
      const csvData = result.employees.map(emp => ({
        Name: emp.name,
        Email: emp.email,
        Department: emp.department || emp.hr_departments?.name || '',
        Position: emp.position || emp.hr_positions?.title || '',
        Status: emp.status || '',
        HireDate: emp.hire_date || '',
        LastActivity: emp.last_activity || ''
      }));
      
      // Convert to CSV string
      const headers = Object.keys(csvData[0]);
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
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
      
      setLoading(false);
    } catch (error: any) {
      console.error('Error exporting employees:', error);
      setError('Failed to export employees: ' + (error.message || 'Unknown error'));
      setLoading(false);
    }
  };
  
  if (loading) {
    return <Card><CardContent>Loading employees...</CardContent></Card>;
  }
  
  if (error) {
    return <Card><CardContent>Error: {error}</CardContent></Card>;
  }
  
  return (
    <div>
      <Card>
        <CardContent>
          <div className="mb-4 flex items-center justify-between py-4">
            <div>
              <Input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="max-w-sm"
              />
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleExportCSV} disabled={loading}>
                Export CSV
              </Button>
              <Button onClick={handleAddEmployee}>Add Employee</Button>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort('name')} className="cursor-pointer">
                  Name
                  {sortColumn === 'name' && (
                    <ChevronsUpDown className={`ml-2 h-4 w-4 ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map(employee => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.name}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.title}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/hr-dashboard/employee/${employee.id}`}>View Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/hr-dashboard/employee/${employee.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <LifeBuoy className="mr-2 h-4 w-4" />
                          Help
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeManagement;
