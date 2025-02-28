import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Employee } from '@/types/hr.types';

// Error handling helper
const handleError = (error: any, customMessage: string = 'An error occurred') => {
  console.error(`${customMessage}:`, error);
  toast({
    title: 'Error',
    description: customMessage,
    variant: 'destructive',
  });
  return null;
};

// HR Employee service with specialized functions for employee operations
const hrEmployeeService = {
  /**
   * Get all employees with their department and position information
   */
  async getAllEmployees() {
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select(`
          *,
          department:hr_departments(id, name),
          position:hr_positions(id, title)
        `)
        .order('name');
        
      if (error) throw error;
      
      // Format the employee data to match our frontend Employee type
      const employees: Employee[] = data.map(emp => ({
        id: emp.id,
        name: emp.name,
        email: emp.email,
        department: emp.department?.name || 'Unassigned',
        position: emp.position?.title,
        status: emp.status,
        lastActivity: emp.last_activity ? new Date(emp.last_activity).toLocaleDateString() : 'Never',
        // We'll fetch these in a separate query for better performance
        courses: 0,
        coursesCompleted: 0,
        progress: 0
      }));
      
      // For each employee, get their course enrollment data
      for (const employee of employees) {
        const { data: enrollments, error: enrollError } = await supabase
          .from('hr_course_enrollments')
          .select('*')
          .eq('employee_id', employee.id);
          
        if (!enrollError && enrollments) {
          employee.courses = enrollments.length;
          employee.coursesCompleted = enrollments.filter(e => e.status === 'completed').length;
          employee.progress = employee.courses > 0 
            ? Math.round((employee.coursesCompleted / employee.courses) * 100) 
            : 0;
        }
      }
      
      return employees;
    } catch (error) {
      return handleError(error, 'Failed to fetch employees');
    }
  },
  
  /**
   * Get an employee by ID with all related information
   */
  async getEmployeeById(id: string) {
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select(`
          *,
          department:hr_departments(id, name),
          position:hr_positions(id, title)
        `)
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (!data) return null;
      
      // Get course enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from('hr_course_enrollments')
        .select(`
          *,
          course:hr_courses(id, title, description)
        `)
        .eq('employee_id', id);
        
      if (enrollError) throw enrollError;
      
      // Get activity history
      const { data: activities, error: activityError } = await supabase
        .from('hr_employee_activities')
        .select(`
          *,
          course:hr_courses(id, title),
          learning_path:hr_learning_paths(id, title)
        `)
        .eq('employee_id', id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (activityError) throw activityError;
      
      return {
        ...data,
        enrollments: enrollments || [],
        activities: activities || [],
        courses: enrollments ? enrollments.length : 0,
        coursesCompleted: enrollments ? enrollments.filter(e => e.status === 'completed').length : 0,
      };
    } catch (error) {
      return handleError(error, `Failed to fetch employee with ID ${id}`);
    }
  },
  
  /**
   * Create a new employee
   */
  async createEmployee(employeeData: Partial<Employee>) {
    try {
      // Validate required fields
      if (!employeeData.name || !employeeData.email) {
        throw new Error('Name and email are required');
      }
      
      // Format data for insertion
      const newEmployee = {
        name: employeeData.name,
        email: employeeData.email,
        department_id: employeeData.departmentId,
        position_id: employeeData.positionId,
        status: employeeData.status || 'active',
        hire_date: employeeData.hireDate ? new Date(employeeData.hireDate) : new Date(),
      };
      
      const { data, error } = await supabase
        .from('hr_employees')
        .insert(newEmployee)
        .select()
        .single();
        
      if (error) throw error;
      
      // Add activity for new employee
      await supabase
        .from('hr_employee_activities')
        .insert({
          employee_id: data.id,
          activity_type: 'alert',
          description: 'New employee onboarded',
        });
        
      toast({
        title: 'Success',
        description: `Employee ${data.name} created successfully`,
      });
      
      return data;
    } catch (error) {
      return handleError(error, 'Failed to create employee');
    }
  },
  
  /**
   * Update an existing employee
   */
  async updateEmployee(id: string, employeeData: Partial<Employee>) {
    try {
      // Format data for update
      const updateData = {
        name: employeeData.name,
        email: employeeData.email,
        department_id: employeeData.departmentId,
        position_id: employeeData.positionId,
        status: employeeData.status,
        last_activity: employeeData.lastActivityDate ? new Date(employeeData.lastActivityDate) : undefined,
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );
      
      const { data, error } = await supabase
        .from('hr_employees')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Employee ${data.name} updated successfully`,
      });
      
      return data;
    } catch (error) {
      return handleError(error, 'Failed to update employee');
    }
  },
  
  /**
   * Delete an employee
   */
  async deleteEmployee(id: string) {
    try {
      // Get employee name first for the success message
      const { data: employee } = await supabase
        .from('hr_employees')
        .select('name')
        .eq('id', id)
        .single();
      
      // Delete the employee
      const { error } = await supabase
        .from('hr_employees')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Employee ${employee?.name || ''} deleted successfully`,
      });
      
      return true;
    } catch (error) {
      return handleError(error, 'Failed to delete employee');
    }
  },
  
  /**
   * Search employees by name, email, or department
   */
  async searchEmployees(query: string) {
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select(`
          *,
          department:hr_departments(id, name),
          position:hr_positions(id, title)
        `)
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('name');
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      return handleError(error, 'Failed to search employees');
    }
  },
  
  /**
   * Get employees by department
   */
  async getEmployeesByDepartment(departmentId: string) {
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select(`
          *,
          position:hr_positions(id, title)
        `)
        .eq('department_id', departmentId)
        .order('name');
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      return handleError(error, 'Failed to fetch employees by department');
    }
  },
  
  /**
   * Get employee metrics
   */
  async getEmployeeMetrics() {
    try {
      // Get total employees
      const { data: employeeCount, error: countError } = await supabase
        .from('hr_employees')
        .select('id', { count: 'exact', head: true });
        
      if (countError) throw countError;
      
      // Get employees by status
      const { data: statusData, error: statusError } = await supabase
        .from('hr_employees')
        .select('status')
        .not('status', 'is', null);
        
      if (statusError) throw statusError;
      
      // Calculate metrics
      const totalEmployees = employeeCount?.count || 0;
      const statusCounts = statusData?.reduce((acc, emp) => {
        acc[emp.status] = (acc[emp.status] || 0) + 1;
        return acc;
      }, {});
      
      // Get new employees this month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const { data: newEmployees, error: newError } = await supabase
        .from('hr_employees')
        .select('id')
        .gte('created_at', firstDayOfMonth.toISOString())
        .select('id', { count: 'exact', head: true });
        
      if (newError) throw newError;
      
      return {
        totalEmployees,
        activeEmployees: statusCounts?.active || 0,
        inactiveEmployees: statusCounts?.inactive || 0,
        onboardingEmployees: statusCounts?.onboarding || 0,
        offboardingEmployees: statusCounts?.offboarding || 0,
        newEmployeesThisMonth: newEmployees?.count || 0,
      };
    } catch (error) {
      return handleError(error, 'Failed to fetch employee metrics');
    }
  }
};

export default hrEmployeeService; 