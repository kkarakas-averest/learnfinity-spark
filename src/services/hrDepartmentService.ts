import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Department } from '@/types/hr.types';

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

// HR Department service with specialized functions for department operations
const hrDepartmentService = {
  /**
   * Get all departments with their related metrics
   */
  async getAllDepartments() {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      // Format the department data to match our frontend Department type
      const departments: Department[] = await Promise.all(data.map(async dept => {
        // Get employee count for this department
        const { count: employeeCount, error: employeeError } = await supabase
          .from('hr_employees')
          .select('*', { count: 'exact', head: true })
          .eq('department_id', dept.id);
          
        if (employeeError) throw employeeError;
        
        // Get course count for this department
        const { count: courseCount, error: courseError } = await supabase
          .from('hr_courses')
          .select('*', { count: 'exact', head: true })
          .eq('department_id', dept.id);
          
        if (courseError) throw courseError;
        
        // Calculate average completion rate
        const { data: employees, error: empDataError } = await supabase
          .from('hr_employees')
          .select(`
            id,
            courses_enrolled:hr_course_enrollments!employee_id(
              course_id,
              status
            )
          `)
          .eq('department_id', dept.id);
          
        if (empDataError) throw empDataError;
        
        let totalCompletionRate = 0;
        let empWithCourses = 0;
        
        employees.forEach(emp => {
          if (emp.courses_enrolled && emp.courses_enrolled.length > 0) {
            const enrolled = emp.courses_enrolled.length;
            const completed = emp.courses_enrolled.filter(c => c.status === 'completed').length;
            const completionRate = enrolled > 0 ? (completed / enrolled) * 100 : 0;
            
            totalCompletionRate += completionRate;
            empWithCourses++;
          }
        });
        
        const averageCompletion = empWithCourses > 0 
          ? Math.round(totalCompletionRate / empWithCourses) 
          : 0;
        
        return {
          id: dept.id,
          name: dept.name,
          employeeCount: employeeCount || 0,
          courseCount: courseCount || 0,
          averageCompletion,
        };
      }));
      
      return departments;
    } catch (error) {
      return handleError(error, 'Failed to fetch departments');
    }
  },
  
  /**
   * Get a department by ID with all related information
   */
  async getDepartmentById(id: string) {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (!data) return null;
      
      // Get employees in this department
      const { data: employees, error: empError } = await supabase
        .from('hr_employees')
        .select(`
          id, name, email, position_id,
          position:hr_positions(id, title)
        `)
        .eq('department_id', id);
        
      if (empError) throw empError;
      
      // Get courses for this department
      const { data: courses, error: courseError } = await supabase
        .from('hr_courses')
        .select('id, title, description, status')
        .eq('department_id', id);
        
      if (courseError) throw courseError;
      
      // Calculate employee metrics
      const activeEmployees = employees?.filter(e => e.status !== 'inactive').length || 0;
      
      return {
        ...data,
        employees: employees || [],
        courses: courses || [],
        employeeCount: employees?.length || 0,
        activeEmployees,
        courseCount: courses?.length || 0,
      };
    } catch (error) {
      return handleError(error, `Failed to fetch department with ID ${id}`);
    }
  },
  
  /**
   * Create a new department
   */
  async createDepartment(name: string) {
    try {
      // Validate required fields
      if (!name) {
        throw new Error('Department name is required');
      }
      
      // Check if department already exists
      const { data: existingDept, error: checkError } = await supabase
        .from('hr_departments')
        .select('id')
        .eq('name', name)
        .maybeSingle();
        
      if (checkError) throw checkError;
      
      if (existingDept) {
        toast({
          title: 'Warning',
          description: `Department "${name}" already exists`,
          variant: 'warning',
        });
        return existingDept;
      }
      
      const { data, error } = await supabase
        .from('hr_departments')
        .insert({ name })
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Department "${name}" created successfully`,
      });
      
      return data;
    } catch (error) {
      return handleError(error, 'Failed to create department');
    }
  },
  
  /**
   * Update an existing department
   */
  async updateDepartment(id: string, name: string) {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .update({ name })
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Department updated successfully`,
      });
      
      return data;
    } catch (error) {
      return handleError(error, 'Failed to update department');
    }
  },
  
  /**
   * Delete a department
   */
  async deleteDepartment(id: string) {
    try {
      // Check if department has employees
      const { count, error: countError } = await supabase
        .from('hr_employees')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', id);
        
      if (countError) throw countError;
      
      if (count > 0) {
        toast({
          title: 'Cannot Delete',
          description: `This department has ${count} employees. Reassign them before deleting.`,
          variant: 'destructive',
        });
        return false;
      }
      
      // Check if department has courses
      const { count: courseCount, error: courseError } = await supabase
        .from('hr_courses')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', id);
        
      if (courseError) throw courseError;
      
      if (courseCount > 0) {
        toast({
          title: 'Cannot Delete',
          description: `This department has ${courseCount} courses. Reassign them before deleting.`,
          variant: 'destructive',
        });
        return false;
      }
      
      // Get department name first for the success message
      const { data: department } = await supabase
        .from('hr_departments')
        .select('name')
        .eq('id', id)
        .single();
      
      // Delete the department
      const { error } = await supabase
        .from('hr_departments')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Department "${department?.name || ''}" deleted successfully`,
      });
      
      return true;
    } catch (error) {
      return handleError(error, 'Failed to delete department');
    }
  },
  
  /**
   * Get department metrics for dashboard
   */
  async getDepartmentMetrics() {
    try {
      // Get all departments
      const { data: departments, error: deptError } = await supabase
        .from('hr_departments')
        .select('id, name');
        
      if (deptError) throw deptError;
      
      const metrics = await Promise.all(departments.map(async department => {
        // Get employee count
        const { count: employeeCount, error: empError } = await supabase
          .from('hr_employees')
          .select('id', { count: 'exact', head: true })
          .eq('department_id', department.id);
          
        if (empError) throw empError;
        
        // Get course count
        const { count: courseCount, error: courseError } = await supabase
          .from('hr_courses')
          .select('id', { count: 'exact', head: true })
          .eq('department_id', department.id);
          
        if (courseError) throw courseError;
        
        return {
          id: department.id,
          name: department.name,
          employeeCount: employeeCount || 0,
          courseCount: courseCount || 0,
        };
      }));
      
      // Add totals
      const totalEmployees = metrics.reduce((sum, dept) => sum + dept.employeeCount, 0);
      const totalCourses = metrics.reduce((sum, dept) => sum + dept.courseCount, 0);
      
      return {
        departments: metrics,
        totalDepartments: departments.length,
        totalEmployees,
        totalCourses,
        averageEmployeesPerDepartment: departments.length > 0 
          ? Math.round(totalEmployees / departments.length) 
          : 0,
      };
    } catch (error) {
      return handleError(error, 'Failed to fetch department metrics');
    }
  },
  
  /**
   * Get positions for a department
   */
  async getDepartmentPositions(departmentId: string) {
    try {
      const { data, error } = await supabase
        .from('hr_positions')
        .select('id, title, department_id')
        .eq('department_id', departmentId);
        
      if (error) throw error;
      
      return data;
    } catch (error) {
      return handleError(error, 'Failed to fetch department positions');
    }
  },
  
  /**
   * Add a new position to a department
   */
  async addPosition(departmentId: string, title: string) {
    try {
      const { data, error } = await supabase
        .from('hr_positions')
        .insert({
          title,
          department_id: departmentId,
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast({
        title: 'Success',
        description: `Position "${title}" added successfully`,
      });
      
      return data;
    } catch (error) {
      return handleError(error, 'Failed to add position');
    }
  }
};

export { hrDepartmentService }; 