import { supabase } from '@/lib/supabase';

export const hrDepartmentService = {
  /**
   * Get all departments
   * @returns {Promise<{data: Array, error: Object}>}
   */
  async getDepartments() {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .select('*')
        .order('name');

      return { data, error };
    } catch (error) {
      console.error('Error in getDepartments:', error);
      return { data: null, error };
    }
  },

  /**
   * Get a department by ID
   * @param {string} id - Department ID
   * @returns {Promise<{data: Object, error: Object}>}
   */
  async getDepartment(id) {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error in getDepartment:', error);
      return { data: null, error };
    }
  },

  /**
   * Create a new department
   * @param {Object} department - Department data
   * @returns {Promise<{data: Object, error: Object}>}
   */
  async createDepartment(department) {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .insert([department])
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
   * @param {Object} updates - Fields to update
   * @returns {Promise<{data: Object, error: Object}>}
   */
  async updateDepartment(id, updates) {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .update(updates)
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
   * Get all positions
   * @returns {Promise<{data: Array, error: Object}>}
   */
  async getPositions() {
    try {
      const { data, error } = await supabase
        .from('hr_positions')
        .select(`
          *,
          hr_departments!inner(id, name)
        `)
        .order('title');

      return { data, error };
    } catch (error) {
      console.error('Error in getPositions:', error);
      return { data: null, error };
    }
  },

  /**
   * Get positions by department ID
   * @param {string} departmentId - Department ID
   * @returns {Promise<{data: Array, error: Object}>}
   */
  async getPositionsByDepartment(departmentId) {
    try {
      const { data, error } = await supabase
        .from('hr_positions')
        .select('*')
        .eq('department_id', departmentId)
        .order('title');

      return { data, error };
    } catch (error) {
      console.error('Error in getPositionsByDepartment:', error);
      return { data: null, error };
    }
  },

  /**
   * Get a position by ID
   * @param {string} id - Position ID
   * @returns {Promise<{data: Object, error: Object}>}
   */
  async getPosition(id) {
    try {
      const { data, error } = await supabase
        .from('hr_positions')
        .select(`
          *,
          hr_departments!inner(id, name)
        `)
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error in getPosition:', error);
      return { data: null, error };
    }
  },

  /**
   * Create a new position
   * @param {Object} position - Position data
   * @returns {Promise<{data: Object, error: Object}>}
   */
  async createPosition(position) {
    try {
      const { data, error } = await supabase
        .from('hr_positions')
        .insert([position])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error in createPosition:', error);
      return { data: null, error };
    }
  },

  /**
   * Update a position
   * @param {string} id - Position ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{data: Object, error: Object}>}
   */
  async updatePosition(id, updates) {
    try {
      const { data, error } = await supabase
        .from('hr_positions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error in updatePosition:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete a position
   * @param {string} id - Position ID
   * @returns {Promise<{error: Object}>}
   */
  async deletePosition(id) {
    try {
      const { error } = await supabase
        .from('hr_positions')
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      console.error('Error in deletePosition:', error);
      return { error };
    }
  }
};

export default hrDepartmentService; 