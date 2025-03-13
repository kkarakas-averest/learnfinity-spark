import { supabase } from '@/lib/supabase';
import { generateSecurePassword } from '@/lib/utils';

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
   * Get employees with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number
   * @param {number} options.pageSize - Page size
   * @param {string} options.searchTerm - Search term
   * @param {string} options.departmentId - Filter by department ID
   * @returns {Promise<{success: boolean, employees: Array, error: string}>}
   */
  async getEmployees({ 
    page = 1, 
    pageSize = 50, 
    searchTerm = '', 
    departmentId = null,
    status = null
  } = {}) {
    try {
      // Calculate range for pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Build query
      let query = supabase
        .from('hr_employees')
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
      
      if (error) {
        console.error('Error fetching employees from database:', error);
        
        // Try to load mock data from JSON file
        try {
          console.log('Loading mock employee data from file...');
          const response = await fetch('/data/employees_list.json');
          if (response.ok) {
            const mockData = await response.json();
            
            let filteredEmployees = mockData.employees;
            
            // Apply search filter if provided
            if (searchTerm) {
              filteredEmployees = filteredEmployees.filter(emp => 
                emp.name.toLowerCase().includes(searchTerm.toLowerCase())
              );
            }
            
            // Apply department filter if provided
            if (departmentId) {
              filteredEmployees = filteredEmployees.filter(emp => 
                emp.department_id === departmentId
              );
            }
            
            // Apply status filter if provided
            if (status) {
              filteredEmployees = filteredEmployees.filter(emp => 
                emp.status === status
              );
            }
            
            // Transform the data to ensure position is correctly exposed
            const transformedEmployees = filteredEmployees.map(emp => {
              // Handle data structures where position and department are nested or direct
              const position = emp.hr_positions?.title || emp.position || 'Unknown Position';
              const department = emp.hr_departments?.name || emp.department || 'Unknown Department';
              
              return {
                ...emp,
                position: position,
                department: department,
                // Ensure ragStatus is explicitly present and properly mapped 
                ragStatus: emp.ragStatus || emp.rag_status || 'green'
              };
            });
            
            // Calculate total and paginate
            const total = transformedEmployees.length;
            const paginatedEmployees = transformedEmployees.slice(from, from + pageSize);
            
            return {
              success: true,
              employees: paginatedEmployees,
              total: total,
              error: null
            };
          }
        } catch (mockError) {
          console.error('Error loading mock employee data:', mockError);
        }
        
        throw new Error(error.message);
      }
      
      // Transform the database results to ensure consistent structure
      const transformedData = data.map(emp => {
        // Handle data structures where position and department are nested or direct
        const position = emp.hr_positions?.title || emp.position || 'Unknown Position';
        const department = emp.hr_departments?.name || emp.department || 'Unknown Department';
        
        return {
          ...emp,
          position: position,
          department: department,
          // Ensure ragStatus is explicitly present and properly mapped 
          ragStatus: emp.ragStatus || emp.rag_status || 'green'
        };
      });
      
      return {
        success: true,
        employees: transformedData,
        total: count,
        error: null
      };
    } catch (error) {
      console.error('Error in getEmployees:', error);
      
      return {
        success: false,
        employees: [],
        total: 0,
        error: error.message
      };
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
