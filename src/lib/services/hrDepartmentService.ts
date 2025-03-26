
import { supabase } from '@/lib/supabase-client';
import { Department } from '@/types/hr.types';

/**
 * HR Department Service
 * Handles operations related to HR departments
 */
export const hrDepartmentService = {
  /**
   * Get all departments
   * @returns Promise with departments data or error
   */
  async getDepartments(): Promise<{ data?: Department[], error?: any }> {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .select('*')
        .order('name');
        
      if (error) {
        console.error('Error fetching departments:', error);
        return { error };
      }
      
      return { 
        data: data.map(dept => ({
          id: dept.id,
          name: dept.name,
          description: dept.description || '',
          headCount: 0, // This would be calculated in a real implementation
          manager: dept.manager_id || undefined
        }))
      };
    } catch (error) {
      console.error('Exception fetching departments:', error);
      return { error };
    }
  },
  
  /**
   * Get a department by ID
   * @param id Department ID
   * @returns Promise with department data or error
   */
  async getDepartmentById(id: string): Promise<{ data?: Department, error?: any }> {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        console.error(`Error fetching department ${id}:`, error);
        return { error };
      }
      
      return { 
        data: {
          id: data.id,
          name: data.name,
          description: data.description || '',
          headCount: 0, // This would be calculated in a real implementation
          manager: data.manager_id || undefined
        }
      };
    } catch (error) {
      console.error(`Exception fetching department ${id}:`, error);
      return { error };
    }
  },
  
  /**
   * Create a new department
   * @param department Department data to create
   * @returns Promise with the created department or error
   */
  async createDepartment(department: Omit<Department, 'id' | 'headCount'>): Promise<{ data?: Department, error?: any }> {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .insert({
          name: department.name,
          description: department.description,
          manager_id: department.manager
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating department:', error);
        return { error };
      }
      
      return { 
        data: {
          id: data.id,
          name: data.name,
          description: data.description || '',
          headCount: 0,
          manager: data.manager_id || undefined
        }
      };
    } catch (error) {
      console.error('Exception creating department:', error);
      return { error };
    }
  },
  
  /**
   * Update a department
   * @param id Department ID to update
   * @param department Department data to update
   * @returns Promise with the updated department or error
   */
  async updateDepartment(id: string, department: Partial<Department>): Promise<{ data?: Department, error?: any }> {
    try {
      const updateData: any = {};
      
      if (department.name) updateData.name = department.name;
      if (department.description !== undefined) updateData.description = department.description;
      if (department.manager !== undefined) updateData.manager_id = department.manager;
      
      const { data, error } = await supabase
        .from('hr_departments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
        
      if (error) {
        console.error(`Error updating department ${id}:`, error);
        return { error };
      }
      
      return { 
        data: {
          id: data.id,
          name: data.name,
          description: data.description || '',
          headCount: department.headCount || 0,
          manager: data.manager_id || undefined
        }
      };
    } catch (error) {
      console.error(`Exception updating department ${id}:`, error);
      return { error };
    }
  },
  
  /**
   * Delete a department
   * @param id Department ID to delete
   * @returns Promise with success status or error
   */
  async deleteDepartment(id: string): Promise<{ success: boolean, error?: any }> {
    try {
      const { error } = await supabase
        .from('hr_departments')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error(`Error deleting department ${id}:`, error);
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Exception deleting department ${id}:`, error);
      return { success: false, error };
    }
  }
};
