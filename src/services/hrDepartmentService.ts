import { supabase } from '@/lib/supabase';
import { Department } from '@/types/hr.types';
import { SupabaseResponse, SupabaseError } from '@/types/service-responses';
import { v4 as uuidv4 } from 'uuid';

// Department data type for database operations
export interface DepartmentData {
  id?: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Position data type for database operations
export interface PositionData {
  id?: string;
  title: string;
  department_id?: string;
  level?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Department metrics type
export interface DepartmentMetrics {
  totalDepartments: number;
  totalPositions: number;
  departmentsWithEmployees: number;
  topDepartments: { id: string; name: string; count: number }[];
}

export const hrDepartmentService = {
  /**
   * Get all departments
   * @returns {Promise<SupabaseResponse<DepartmentData[]>>}
   */
  async getAllDepartments(): Promise<SupabaseResponse<DepartmentData[]>> {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .select('*')
        .order('name');

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Error in getAllDepartments:', error);
      return { 
        data: null, 
        error: { message: error.message || 'Failed to fetch departments' } 
      };
    }
  },

  /**
   * Get all positions
   * @returns {Promise<SupabaseResponse<PositionData[]>>}
   */
  async getAllPositions(): Promise<SupabaseResponse<PositionData[]>> {
    try {
      const { data, error } = await supabase
        .from('hr_positions')
        .select('*')
        .order('title');

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Error in getAllPositions:', error);
      return { 
        data: null, 
        error: { message: error.message || 'Failed to fetch positions' } 
      };
    }
  },

  /**
   * Get department by ID
   * @param {string} id - Department ID
   * @returns {Promise<SupabaseResponse<DepartmentData>>}
   */
  async getDepartmentById(id: string): Promise<SupabaseResponse<DepartmentData>> {
    try {
      if (!id) {
        return {
          data: null,
          error: { message: 'Department ID is required' }
        };
      }

      const { data, error } = await supabase
        .from('hr_departments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Error in getDepartmentById:', error);
      return { 
        data: null, 
        error: { message: error.message || `Failed to fetch department with ID ${id}` } 
      };
    }
  },

  /**
   * Create a new department
   * @param {string} name - Department name
   * @returns {Promise<SupabaseResponse<DepartmentData>>}
   */
  async createDepartment(name: string): Promise<SupabaseResponse<DepartmentData>> {
    try {
      if (!name || name.trim() === '') {
        return {
          data: null,
          error: { message: 'Department name is required' }
        };
      }

      const newDepartment: DepartmentData = {
        id: uuidv4(),
        name: name.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('hr_departments')
        .insert(newDepartment)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Error in createDepartment:', error);
      return { 
        data: null, 
        error: { message: error.message || 'Failed to create department' } 
      };
    }
  },

  /**
   * Update a department
   * @param {string} id - Department ID
   * @param {string} name - New department name
   * @returns {Promise<SupabaseResponse<DepartmentData>>}
   */
  async updateDepartment(id: string, name: string): Promise<SupabaseResponse<DepartmentData>> {
    try {
      if (!id) {
        return {
          data: null,
          error: { message: 'Department ID is required' }
        };
      }

      if (!name || name.trim() === '') {
        return {
          data: null,
          error: { message: 'Department name is required' }
        };
      }

      const updates = {
        name: name.trim(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('hr_departments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Error in updateDepartment:', error);
      return { 
        data: null, 
        error: { message: error.message || 'Failed to update department' } 
      };
    }
  },

  /**
   * Delete a department
   * @param {string} id - Department ID
   * @returns {Promise<SupabaseResponse<null>>}
   */
  async deleteDepartment(id: string): Promise<SupabaseResponse<null>> {
    try {
      if (!id) {
        return {
          data: null,
          error: { message: 'Department ID is required' }
        };
      }

      // Check if department exists
      const { data: existingDept, error: checkError } = await supabase
        .from('hr_departments')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError) {
        return { data: null, error: checkError };
      }

      if (!existingDept) {
        return {
          data: null,
          error: { message: 'Department not found' }
        };
      }

      // Delete the department
      const { error } = await supabase
        .from('hr_departments')
        .delete()
        .eq('id', id);

      if (error) {
        return { data: null, error };
      }

      return { data: null, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Error in deleteDepartment:', error);
      return { 
        data: null, 
        error: { message: error.message || 'Failed to delete department' } 
      };
    }
  },

  /**
   * Get department metrics
   * @returns {Promise<SupabaseResponse<DepartmentMetrics>>}
   */
  async getDepartmentMetrics(): Promise<SupabaseResponse<DepartmentMetrics>> {
    try {
      // Get all departments
      const { data: departments, error: deptError } = await supabase
        .from('hr_departments')
        .select('id, name');

      if (deptError) {
        return { data: null, error: deptError };
      }

      // Get position count
      const { data: positions, error: posError } = await supabase
        .from('hr_positions')
        .select('id');

      if (posError) {
        return { data: null, error: posError };
      }

      // Get departments with employees
      const { data: deptWithEmployees, error: empError } = await supabase
        .from('hr_employees')
        .select('department_id')
        .not('department_id', 'is', null);

      if (empError) {
        return { data: null, error: empError };
      }

      // Calculate unique departments with employees
      const uniqueDeptWithEmployees = new Set(
        deptWithEmployees.map(e => e.department_id)
      );

      // Count employees per department
      const departmentCounts = {};
      for (const employee of deptWithEmployees) {
        if (employee.department_id) {
          departmentCounts[employee.department_id] = 
            (departmentCounts[employee.department_id] || 0) + 1;
        }
      }

      // Get top departments
      const topDepartments = departments
        .map(dept => ({
          id: dept.id,
          name: dept.name,
          count: departmentCounts[dept.id] || 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        data: {
          totalDepartments: departments.length,
          totalPositions: positions.length,
          departmentsWithEmployees: uniqueDeptWithEmployees.size,
          topDepartments
        },
        error: null
      };
    } catch (err) {
      const error = err as Error;
      console.error('Error in getDepartmentMetrics:', error);
      return { 
        data: null, 
        error: { message: error.message || 'Failed to fetch department metrics' } 
      };
    }
  },

  /**
   * Get positions for a specific department
   * @param {string} departmentId - Department ID
   * @returns {Promise<SupabaseResponse<PositionData[]>>}
   */
  async getDepartmentPositions(departmentId: string): Promise<SupabaseResponse<PositionData[]>> {
    try {
      if (!departmentId) {
        return {
          data: null,
          error: { message: 'Department ID is required' }
        };
      }

      const { data, error } = await supabase
        .from('hr_positions')
        .select('*')
        .eq('department_id', departmentId)
        .order('title');

      if (error) {
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      const error = err as Error;
      console.error('Error in getDepartmentPositions:', error);
      return { 
        data: null, 
        error: { message: error.message || 'Failed to fetch department positions' } 
      };
    }
  }
};

export default hrDepartmentService;
