
import { supabase } from '@/lib/supabase';

export const hrDepartmentService = {
  /**
   * Get all departments
   * @returns {Promise<{data: Array, error: Object}>}
   */
  async getAllDepartments() {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .select('*')
        .order('name');

      return { data, error };
    } catch (error) {
      console.error('Error in getAllDepartments:', error);
      return { data: null, error };
    }
  },

  /**
   * Get all positions
   * @returns {Promise<{data: Array, error: Object}>}
   */
  async getAllPositions() {
    try {
      const { data, error } = await supabase
        .from('hr_positions')
        .select('*')
        .order('title');

      return { data, error };
    } catch (error) {
      console.error('Error in getAllPositions:', error);
      return { data: null, error };
    }
  },

  /**
   * Get department by ID
   * @param {string} id - Department ID
   * @returns {Promise<{data: Object, error: Object}>}
   */
  async getDepartmentById(id) {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error in getDepartmentById:', error);
      return { data: null, error };
    }
  },

  /**
   * Create a new department
   * @param {string} name - Department name
   * @returns {Promise<{data: Object, error: Object}>}
   */
  async createDepartment(name) {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .insert([{ name }])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error in createDepartment:', error);
      return { data: null, error };
    }
  },

  /**
   * Update a department
   * @param {string} id - Department ID
   * @param {string} name - New department name
   * @returns {Promise<{data: Object, error: Object}>}
   */
  async updateDepartment(id, name) {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error in updateDepartment:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a department
   * @param {string} id - Department ID
   * @returns {Promise<{error: Object}>}
   */
  async deleteDepartment(id) {
    try {
      const { error } = await supabase
        .from('hr_departments')
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      console.error('Error in deleteDepartment:', error);
      return { error };
    }
  },

  /**
   * Get department metrics (count of employees, etc.)
   * @returns {Promise<{data: Array, error: Object}>}
   */
  async getDepartmentMetrics() {
    try {
      const { data, error } = await supabase
        .rpc('get_department_metrics');

      return { data, error };
    } catch (error) {
      console.error('Error in getDepartmentMetrics:', error);
      return { data: null, error };
    }
  },

  /**
   * Get positions for a department
   * @param {string} departmentId - Department ID
   * @returns {Promise<{data: Array, error: Object}>}
   */
  async getDepartmentPositions(departmentId) {
    try {
      const { data, error } = await supabase
        .from('hr_positions')
        .select('*')
        .eq('department_id', departmentId)
        .order('title');

      return { data, error };
    } catch (error) {
      console.error('Error in getDepartmentPositions:', error);
      return { data: null, error };
    }
  }
};

export default hrDepartmentService;
