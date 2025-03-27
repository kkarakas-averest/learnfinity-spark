import React from '@/lib/react-helpers';
import { useState, useEffect } from '@/lib/react-helpers';
import { hrEmployeeService } from '@/services/hrEmployeeService';
import EmployeeProfileSummary from './EmployeeProfileSummary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Filter, Search, Users } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  department_id?: string;
  position?: string;
  profile_image_url?: string;
  current_rag_status?: 'green' | 'amber' | 'red';
  hr_departments?: {
    id: string;
    name: string;
  };
}

interface Department {
  id: string;
  name: string;
}

interface EmployeeProfileGridProps {
  title?: string;
  maxItems?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  className?: string;
}

/**
 * Displays multiple employee profiles in a grid layout with optional filtering
 */
const EmployeeProfileGrid: React.FC<EmployeeProfileGridProps> = ({
  title = 'Employees',
  maxItems = 12,
  showFilters = true,
  showSearch = true,
  className = ''
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load employees
        const employeesResponse = await hrEmployeeService.getEmployees();
        if (employeesResponse.success && employeesResponse.employees) {
          const employeesList = employeesResponse.employees.map(emp => ({
            ...emp,
            department: emp.hr_departments?.name || 'No Department'
          }));
          setEmployees(employeesList);
          setFilteredEmployees(employeesList.slice(0, maxItems));
        }
        
        // Load departments
        const departmentsResponse = await hrEmployeeService.getDepartments();
        if (departmentsResponse.success && departmentsResponse.departments) {
          setDepartments(departmentsResponse.departments);
        }
      } catch (err) {
        console.error('Error loading employee data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [maxItems]);
  
  // Filter employees when filters change
  useEffect(() => {
    let result = [...employees];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        emp => 
          emp.name.toLowerCase().includes(search) ||
          emp.email.toLowerCase().includes(search) ||
          (emp.department && emp.department.toLowerCase().includes(search))
      );
    }
    
    // Apply department filter
    if (selectedDepartment !== 'all') {
      result = result.filter(emp => emp.department_id === selectedDepartment);
    }
    
    // Apply status filter
    if (selectedStatus !== 'all') {
      result = result.filter(emp => emp.current_rag_status === selectedStatus);
    }
    
    // Limit the number of results
    setFilteredEmployees(result.slice(0, maxItems));
  }, [employees, searchTerm, selectedDepartment, selectedStatus, maxItems]);
  
  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center">
          <Users className="h-5 w-5 mr-2 text-primary" />
          <h2 className="text-xl font-semibold">{title}</h2>
          <span className="ml-2 text-sm text-gray-500">({filteredEmployees.length})</span>
        </div>
        
        {/* Search and Filters */}
        {(showSearch || showFilters) && (
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {showSearch && (
              <div className="relative flex-1 sm:flex-initial sm:w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search employees..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            
            {showFilters && (
              <div className="flex gap-2">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-40">
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
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="amber">Amber</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Employees Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredEmployees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((employee) => (
            <EmployeeProfileSummary
              key={employee.id}
              employee={employee}
              showContact={true}
              showDepartment={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-md bg-gray-50">
          <Filter className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No employees found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedDepartment !== 'all' || selectedStatus !== 'all'
              ? 'Try adjusting your filters or search term'
              : 'No employees have been added yet'}
          </p>
          {searchTerm || selectedDepartment !== 'all' || selectedStatus !== 'all' ? (
            <Button 
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedDepartment('all');
                setSelectedStatus('all');
              }}
            >
              Clear Filters
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default EmployeeProfileGrid; 