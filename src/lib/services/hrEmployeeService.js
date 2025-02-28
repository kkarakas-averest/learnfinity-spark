import { supabase } from '@/lib/database/supabaseClient';
import { generateSecurePassword } from '@/lib/utils';

const TABLE_NAME = 'hr_employees';

export const hrEmployeeService = {
  /**
   * Get all employees
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.pageSize - Page size
   * @param {string} options.searchTerm - Search term
   * @param {string} options.departmentId - Filter by department ID
   * @returns {Promise<{data: Array, error: Object, count: number}>}
   */
  async getEmployees({ 
    page = 1, 
    pageSize = 10, 
    searchTerm = '', 
    departmentId = null,
    status = null
  } = {}) {
    try {
      // Calculate range
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Build query
      let query = supabase
        .from(TABLE_NAME)
        .select(`
          *,
          hr_departments(id, name),
          hr_positions(id, title)
        `, { count: 'exact' });

      // Apply search filter if provided
      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }

      // Apply department filter if provided
      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status);
      }

      // Paginate results
      query = query.range(from, to).order('created_at', { ascending: false });

      // Execute query
      const { data, error, count } = await query;

      return { data, error, count };
    } catch (error) {
      console.error('Error in getEmployees:', error);
      return { data: null, error, count: 0 };
    }
  },

  /**
   * Get a single employee by ID
   * @param {string} id - Employee ID
   * @returns {Promise<{data: Object, error: Object}>}
   */
  async getEmployee(id) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          hr_departments(id, name),
          hr_positions(id, title)
        `)
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error in getEmployee:', error);
      return { data: null, error };
    }
  },

  /**
   * Create a new employee
   * @param {Object} employee - Employee data
   * @returns {Promise<{data: Object, error: Object}>}
   */
  async createEmployee(employee) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([employee])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error in createEmployee:', error);
      return { data: null, error };
    }
  },

  /**
   * Create a new employee and also create a user account for them
   * @param {Object} employee - Employee data
   * @returns {Promise<{data: Object, error: Object, userAccount: Object}>}
   */
  async createEmployeeWithUserAccount(employee) {
    try {
      // First create the employee record
      const { data: employeeData, error: employeeError } = await this.createEmployee(employee);
      
      if (employeeError) {
        throw employeeError;
      }
      
      // Generate a secure random password for the new account
      const password = generateSecurePassword({
        length: 10,
        includeSpecial: false // Avoid special chars for simplicity in initial password
      });
      
      // Create a user account with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: employee.email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name: employee.name,
            role: 'learner'
          }
        }
      });
      
      if (authError) {
        console.error('Error creating user account:', authError);
        return { 
          data: employeeData, 
          error: null, 
          userAccount: null,
          authError
        };
      }
      
      // Try to insert user into users table
      try {
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name: employee.name,
            email: employee.email,
            password: 'hashed-in-rpc', // The actual password is handled by Supabase Auth
            role: 'learner',
          });

        if (insertError) {
          console.warn('Failed to create user profile, but auth user was created:', insertError);
        }
      } catch (insertError) {
        console.warn('Exception when creating user profile:', insertError);
      }
      
      // Also create a learner record associated with the user
      try {
        const { error: learnerError } = await supabase
          .from('learners')
          .insert({
            id: authData.user.id,
            company_id: employee.company_id,
            progress_status: {},
            preferences: {},
            certifications: {}
          });
          
        if (learnerError) {
          console.warn('Failed to create learner record:', learnerError);
        }
      } catch (learnerError) {
        console.warn('Exception when creating learner record:', learnerError);
      }
      
      return { 
        data: employeeData, 
        error: null, 
        userAccount: {
          email: employee.email,
          password,
          id: authData.user.id
        }
      };
    } catch (error) {
      console.error('Error in createEmployeeWithUserAccount:', error);
      return { data: null, error, userAccount: null };
    }
  },

  /**
   * Update an existing employee
   * @param {string} id - Employee ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<{data: Object, error: Object}>}
   */
  async updateEmployee(id, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error in updateEmployee:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete an employee
   * @param {string} id - Employee ID
   * @returns {Promise<{error: Object}>}
   */
  async deleteEmployee(id) {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      console.error('Error in deleteEmployee:', error);
      return { error };
    }
  },

  /**
   * Update employee status
   * @param {string} id - Employee ID
   * @param {string} status - New status
   * @returns {Promise<{data: Object, error: Object}>}
   */
  async updateEmployeeStatus(id, status) {
    return this.updateEmployee(id, { status });
  }
};

export default hrEmployeeService; 