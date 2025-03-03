import { supabase } from '@/lib/supabase';

// Define Employee interface directly in this file instead of importing it
export interface Employee {
  id: string;
  name: string;
  email: string;
  department_id: string;
  position_id?: string;
  status: string;
  phone?: string;
  resume_url?: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Import from env variables or use a fallback with a valid UUID
const DEFAULT_COMPANY_ID = import.meta.env.VITE_DEFAULT_COMPANY_ID || '4fb1a692-3995-40ee-8aa5-292fd8ebf029';
const TABLE_NAME = 'hr_employees';

// List of all HR tables that should exist
const HR_TABLES = [
  'hr_departments',
  'hr_positions', 
  'hr_employees',
  'hr_courses',
  'hr_course_enrollments',
  'hr_employee_activities',
  'hr_learning_paths',
  'hr_learning_path_courses',
  'hr_learning_path_enrollments'
];

export const hrEmployeeService = {
  /**
   * Initialize the HR system
   * @returns {Promise<{success: boolean, error?: Error}>}
   */
  async initialize() {
    try {
      console.log('Initializing HR system...');
      
      // First check if Supabase is configured
      if (!supabase || typeof supabase.from !== 'function') {
        throw new Error('Supabase client is not properly initialized');
      }
      
      // Check tables existence
      const { exists, missingTables } = await this.checkHRTablesExist();
      
      if (!exists) {
        console.log('Some HR tables are missing:', missingTables);
        // Try to create missing tables
        const createResult = await this.createMissingTables(missingTables);
        if (!createResult.success) {
          throw new Error(`Failed to create missing tables: ${createResult.error}`);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to initialize HR system:', error);
      return { success: false, error };
    }
  },
  
  /**
   * Create missing HR tables
   * @param {string[]} missingTables
   * @returns {Promise<{success: boolean, error?: Error}>}
   */
  async createMissingTables(missingTables) {
    try {
      console.log('Creating missing HR tables:', missingTables);
      
      for (const table of missingTables) {
        let sql = '';
        switch (table) {
          case 'hr_departments':
            sql = `
              CREATE TABLE IF NOT EXISTS hr_departments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              );
            `;
            break;
            
          case 'hr_positions':
            sql = `
              CREATE TABLE IF NOT EXISTS hr_positions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                title VARCHAR(100) NOT NULL,
                department_id UUID REFERENCES hr_departments(id),
                description TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              );
            `;
            break;
            
          case 'hr_employees':
            sql = `
              CREATE TABLE IF NOT EXISTS hr_employees (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                department_id UUID REFERENCES hr_departments(id),
                position_id UUID REFERENCES hr_positions(id),
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              );
            `;
            break;
            
          default:
            console.warn(`No SQL definition for table: ${table}`);
            continue;
        }
        
        if (sql) {
          const { error } = await supabase.rpc('execute_sql', { sql });
          if (error) {
            throw new Error(`Failed to create table ${table}: ${error.message}`);
          }
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Failed to create missing tables:', error);
      return { success: false, error };
    }
  },

  /**
   * Check if all required HR tables exist in the database
   * @returns {Promise<{exists: boolean, missingTables: string[]}>}
   */
  async checkHRTablesExist() {
    console.log('Checking if HR tables exist...');
    const missingTables = [];
    
    // Primary tables that we absolutely need for employee creation
    const primaryTables = ['hr_departments', 'hr_positions', 'hr_employees'];
    
    // First check just the essential tables
    for (const table of primaryTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
          
        if (error && error.code === '42P01') {
          console.warn(`Table ${table} does not exist`);
          missingTables.push(table);
        }
      } catch (error) {
        console.error(`Error checking table ${table}:`, error);
        missingTables.push(table);
      }
    }
    
    // If we can't access primary tables, don't bother checking secondary ones
    if (missingTables.length > 0) {
      console.log(`Primary HR tables check: Missing tables:`, missingTables);
      return { exists: false, missingTables };
    }
    
    // Check remaining tables but don't block employee creation if they're missing
    const secondaryTables = [
      'hr_courses', 
      'hr_course_enrollments',
      'hr_employee_activities',
      'hr_learning_paths',
      'hr_learning_path_courses',
      'hr_learning_path_enrollments'
    ];
    
    const missingSampleTables = [];
    for (const table of secondaryTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
          
        if (error) {
          if (error.code === '42P01') {
            console.warn(`Table ${table} does not exist`);
            missingSampleTables.push(table);
          } else if (error.status === 400) {
            console.warn(`API error checking table ${table}:`, error.message);
            // Don't consider 400 errors as missing tables for essential functionality
          }
        }
      } catch (error) {
        console.warn(`Exception checking table ${table}:`, error);
        // Don't block creation for exceptions on secondary tables
      }
    }
    
    if (missingSampleTables.length > 0) {
      console.log('Some secondary HR tables are missing, but proceeding with employee creation:', missingSampleTables);
    }
    
    const allExist = missingTables.length === 0;
    console.log(`HR tables essential check: ${allExist ? 'All exist' : 'Some missing'}`);
    if (!allExist) {
      console.log('Missing tables:', missingTables);
    }
    
    return { exists: allExist, missingTables };
  },

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
      
      // Create a temporary password for the new account
      // In a real production app, this would be a secure random password
      const tempPassword = `Welcome123!${Math.floor(Math.random() * 1000)}`;
      
      // Create a user account with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: employee.email,
        password: tempPassword,
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
        
        // If creating the user fails, delete the employee record to maintain consistency
        if (employeeData?.id) {
          await this.deleteEmployee(employeeData.id);
        }
        
        return { 
          data: null, 
          error: authError, 
          userAccount: null 
        };
      }
      
      // Store temporary credentials in local storage for potential auto-login
      localStorage.setItem('temp_login_email', employee.email);
      localStorage.setItem('temp_login_password', tempPassword);
      
      return { 
        data: employeeData, 
        error: null, 
        userAccount: {
          email: employee.email,
          id: authData.user.id,
          tempPassword // Include the temporary password in the response
        }
      };
    } catch (error) {
      console.error('Exception in createEmployeeWithUserAccount:', error);
      return { 
        data: null, 
        error, 
        userAccount: null 
      };
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
  },
  
  /**
   * Update employee password
   * @param {string} email - Employee email
   * @param {string} newPassword - New password
   * @returns {Promise<{success: boolean, error?: Object}>}
   */
  async updateEmployeePassword(email, newPassword) {
    try {
      // Check if this is a valid email format
      if (!email || !email.includes('@')) {
        return { 
          success: false, 
          error: { message: 'Invalid email format' } 
        };
      }
      
      // Check if the password meets minimum requirements
      if (!newPassword || newPassword.length < 8) {
        return { 
          success: false, 
          error: { message: 'Password must be at least 8 characters long' } 
        };
      }
      
      // We cannot update a user's password directly from the client side
      // Instead, we'll send a password reset email to the employee
      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      
      if (error) {
        console.error('Error sending password reset email:', error);
        return { 
          success: false, 
          error,
          message: 'Could not send password reset email.'
        };
      }
      
      return { 
        success: true,
        message: 'A password reset email has been sent to the employee.'
      };
    } catch (err) {
      console.error('Exception during password reset:', err);
      return { 
        success: false, 
        error: err,
        message: 'An unexpected error occurred when resetting the password.'
      };
    }
  },
  
  /**
   * Reset employee password to a new random one
   * @param {string} email - Employee email
   * @returns {Promise<{success: boolean, newPassword?: string, error?: Object}>}
   */
  async resetEmployeePassword(email) {
    try {
      // Generate a secure random password
      const newPassword = 'hashed-in-rpc'; // The actual password is handled by Supabase Auth
      
      // Update the password
      const { success, error } = await this.updateEmployeePassword(email, newPassword);
      
      if (!success) {
        return { success: false, error };
      }
      
      return { 
        success: true, 
        newPassword 
      };
    } catch (error) {
      console.error('Error resetting password:', error);
      return { 
        success: false, 
        error 
      };
    }
  },
  
  /**
   * Test API request for diagnostics
   * @returns {Promise<{success: boolean, responseText: string, error?: Object}>}
   */
  async testMinimalApiRequest() {
    try {
      // First check if Supabase is configured
      if (!supabase || typeof supabase.from !== 'function') {
        throw new Error('Supabase client is not properly initialized');
      }
      
      // Make a minimal request to the Supabase API
      const { data, error, status } = await supabase
        .from('hr_departments')
        .select('id, name')
        .limit(1);
      
      if (error) {
        console.error('API test failed:', error);
        return { 
          success: false, 
          responseText: `API test failed with status ${status}: ${error.message}`, 
          error 
        };
      }
      
      // If the request was successful, return the data
      console.log('API test successful:', data);
      return { 
        success: true, 
        responseText: `API test successful with status ${status}. Data: ${JSON.stringify(data)}` 
      };
    } catch (error) {
      console.error('Exception during API test:', error);
      return { 
        success: false, 
        responseText: `Exception during API test: ${error.message}`, 
        error 
      };
    }
  },
  
  /**
   * Upload employee resume
   * @param {string} employeeId - Employee ID
   * @param {File} file - Resume file
   * @returns {Promise<{data: Object, error: Object}>}
   */
  async uploadEmployeeResume(employeeId, file) {
    try {
      if (!file) {
        return { data: null, error: { message: 'No file provided' } };
      }
      
      // Upload to storage
      const filename = `${employeeId}_${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('employee-resumes')
        .upload(filename, file);
      
      if (uploadError) {
        console.error('Resume upload error:', uploadError);
        return { data: null, error: uploadError };
      }
      
      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('employee-resumes')
        .getPublicUrl(filename);
      
      // Update the employee record with the new resume URL
      const { data, error } = await this.updateEmployee(employeeId, { resume_url: publicUrl });
      
      return { data, error };
    } catch (error) {
      console.error('Error in uploadEmployeeResume:', error);
      return { data: null, error };
    }
  },
  
  /**
   * Create employee from JSON
   * @param {Object} employeeJSON - Employee data in JSON format
   * @returns {Promise<{data: Object, error: Object, userAccount: Object}>}
   */
  async createEmployeeFromJSON(employeeJSON) {
    try {
      // Destructure the employee data from the JSON object
      const {
        name,
        email,
        departmentId,
        positionId,
        status,
        companyId = DEFAULT_COMPANY_ID, // Use default if not provided
        resumeFile,
        courseIds = []
      } = employeeJSON;
      
      // Validate required fields
      if (!name || !email || !departmentId) {
        throw new Error('Name, email, and departmentId are required');
      }
      
      // Prepare the employee object for insertion
      const employee = {
        name,
        email,
        department_id: departmentId,
        position_id: positionId || null,
        status: status || 'active',
        company_id: companyId,
      };
      
      // First create the employee record
      const { data: employeeData, error: employeeError } = await this.createEmployee(employee);
      
      if (employeeError) {
        console.error('Error creating employee:', employeeError);
        return { data: null, error: employeeError, userAccount: null };
      }
      
      // Create a user account with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: 'hashed-in-rpc', // The actual password is handled by Supabase Auth
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name,
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
            name,
            email,
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
            company_id: companyId,
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
      
      // If there's a resume file, upload it
      if (resumeFile) {
        const { error: resumeError } = await this.uploadEmployeeResume(employeeData.id, resumeFile);
        if (resumeError) {
          console.error('Error uploading resume:', resumeError);
          // Consider whether to return an error or just log it
        }
      }
      
      // Enroll in courses
      if (courseIds && courseIds.length > 0) {
        try {
          // Map course IDs to enrollment records
          const enrollments = courseIds.map(courseId => ({
            employee_id: employeeData.id,
            course_id: courseId,
            enrollment_date: new Date().toISOString(),
            status: 'enrolled'
          }));
          
          // Insert multiple enrollments
          const { error: enrollError } = await supabase
            .from('hr_course_enrollments')
            .insert(enrollments);
          
          if (enrollError) {
            console.error('Error enrolling in courses:', enrollError);
            // Consider whether to return an error or just log it
          }
        } catch (enrollError) {
          console.warn('Exception when enrolling in courses:', enrollError);
        }
      }
      
      return { 
        data: employeeData, 
        error: null, 
        userAccount: {
          email,
          id: authData.user.id
        }
      };
    } catch (error) {
      console.error('Error in createEmployeeFromJSON:', error);
      return { data: null, error, userAccount: null };
    }
  }
};

export default hrEmployeeService;
