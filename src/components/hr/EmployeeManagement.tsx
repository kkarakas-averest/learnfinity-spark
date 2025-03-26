import React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CaretSortIcon, 
  ChevronDownIcon, 
  DotsHorizontalIcon,
  PlusCircledIcon,
  TrashIcon,
  LifeBuoyIcon
} from '@radix-ui/react-icons';
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
import { TableFilterControls } from '@/components/ui/table-filters';
import { hrEmployeeService } from '@/services/hrEmployeeService';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  department: string;
  profileImageUrl: string;
  ragStatus: string;
  ragStatusLastUpdated: Date;
}

const EmployeeManagement: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<'firstName' | 'lastName' | 'email' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  useEffect(() => {
    loadEmployees();
  }, []);
  
  const loadEmployees = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await hrEmployeeService.getEmployees();
      if (error) {
        setError(error.message || 'Failed to load employees');
      } else {
        setEmployees(data || []);
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
  
  const handleSort = (column: 'firstName' | 'lastName' | 'email') => {
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
      employee.firstName.toLowerCase().includes(searchStr) ||
      employee.lastName.toLowerCase().includes(searchStr) ||
      employee.email.toLowerCase().includes(searchStr)
    );
  });
  
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
          <div className="mb-4">
            <TableFilterControls>
              <Input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <Button><PlusCircledIcon className="mr-2" /> Add Employee</Button>
            </TableFilterControls>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => handleSort('firstName')}>
                  First Name
                  {sortColumn === 'firstName' && (
                    <CaretSortIcon className={sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'} />
                  )}
                </TableHead>
                <TableHead onClick={() => handleSort('lastName')}>
                  Last Name
                  {sortColumn === 'lastName' && (
                    <CaretSortIcon className={sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'} />
                  )}
                </TableHead>
                <TableHead onClick={() => handleSort('email')}>
                  Email
                  {sortColumn === 'email' && (
                    <CaretSortIcon className={sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'} />
                  )}
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map(employee => (
                <TableRow key={employee.id}>
                  <TableCell>{employee.firstName}</TableCell>
                  <TableCell>{employee.lastName}</TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.title}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <DotsHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/hr-dashboard/employees/${employee.id}/profile`}>View Profile</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <LifeBuoyIcon className="mr-2 h-4 w-4" />
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
