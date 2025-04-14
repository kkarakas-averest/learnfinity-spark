import { supabase } from '@/lib/supabase';
import { SupabaseResponse, SupabaseUser } from '@/types/service-responses';
import { verifyHRTables } from '@/utils/hrDatabaseUtils';

// Define interfaces
interface Employee {
  id: string;
  name: string;
  email: string;
  department_id: string;
  position_id?: string;
  status: string;
  phone?: string;
  resume_url?: string;
  profile_image_url?: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
  department?: string;
  position?: string;
  hr_departments?: {
    id: string;
    name: string;
  };
  hr_positions?: {
    id: string;
    title: string;
  };
  rag_status?: string;
  ragStatus?: string;
  progress?: number;
  last_activity?: string;
  lastActivity?: string;
  hire_date?: string;
  user_id?: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

// Define response types
interface EmployeeResponse {
  success: boolean;
  data?: Employee;
  error?: string;
  id?: string;
}

interface SkillResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface CourseResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Define update type
type EmployeeUpdate = Partial<Employee>;

// Export types
export type { Employee };
export type { Department };
export type { EmployeeUpdate };
export type { EmployeeResponse };
export type { SkillResponse };
export type { CourseResponse };

// Constants
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
  'hr_learning_path_enrollments',
  'user_notifications'
];

interface GetEmployeesOptions {
  searchTerm?: string;
  departmentId?: string | null;
  status?: string | null;
  page?: number;
  pageSize?: number;
}

/**
 * Define the type for the EmployeeService
 */
export interface EmployeeService {
  initialize: () => Promise<{success: boolean, error?: Error}>;
  createMissingTables: (missingTables: string[]) => Promise<{success: boolean, error?: Error}>;
  checkHRTablesExist: () => Promise<{exists: boolean, missingTables: string[]}>;
  createEmployee: (employee: EmployeeUpdate) => Promise<EmployeeResponse>;
  getDepartments: () => Promise<{success: boolean, departments?: Department[], error?: string}>;
  getEmployees: (options?: any) => Promise<{success: boolean, employees?: Employee[], error?: string}>;
  getEmployee: (id: string) => Promise<SupabaseResponse<Employee>>;
  updateEmployee: (id: string, updates: EmployeeUpdate) => Promise<SupabaseResponse<Employee>>;
  deleteEmployee: (id: string) => Promise<SupabaseResponse<null>>;
  updateEmployeeStatus: (id: string, status: string) => Promise<SupabaseResponse<Employee>>;
  updateEmployeePassword: (email: string, newPassword: string) => Promise<SupabaseResponse<{ user: SupabaseUser }>>;
  resetEmployeePassword: (email: string) => Promise<SupabaseResponse<{success: boolean}>>;
  testMinimalApiRequest: () => Promise<{success: boolean, responseText: string, error?: any}>;
  uploadEmployeeResume: (employeeId: string, file: File) => Promise<SupabaseResponse<{ resumeUrl: string }>>;
  createEmployeeFromJSON: (employeeJSON: any) => Promise<{data: any, error: any, userAccount: any}>;
  createEmployeeWithUserAccount: (employee: any) => Promise<{data: any, error: any, userAccount: any}>;
  getEmployeeCourses: (employeeId: string) => Promise<{data: any, error: any}>;
  getEmployeeSkills: (employeeId: string) => Promise<{data: any, error: any}>;
  getEmployeeActivities: (employeeId: string, limit?: number) => Promise<{data: any, error: any}>;
  addEmployeeSkill: (employeeId: string, skill: any) => Promise<SkillResponse>;
  assignCourseToEmployee: (employeeId: string, courseId: string) => Promise<CourseResponse>;
}

// Create the service object
const hrEmployeeService: EmployeeService = {
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
            
          case 'user_notifications':
            sql = `
              CREATE TABLE IF NOT EXISTS user_notifications (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                title VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type VARCHAR(50) NOT NULL,
                priority VARCHAR(20) DEFAULT 'normal',
                is_read BOOLEAN DEFAULT false,
                metadata JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
          } else if (error.code === 'PGRST116') {
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
   * Get all employees with optional filtering
   */
  async getEmployees(options: GetEmployeesOptions = {}) {
    try {
      const {
        searchTerm = '',
        departmentId = null,
        status = null,
        page = 1,
        pageSize = 50
      } = options;

      let query = supabase
        .from('hr_employees')
        .select(`
          *,
          hr_departments (
            id,
            name
          ),
          hr_positions (
            id,
            title
          )
        `);

      // Apply filters
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      // Add pagination
      const from = (page - 1) * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data: employees, error } = await query;

      if (error) {
        console.error('Error fetching employees:', error);
        return {
          success: false,
          error: error.message,
          employees: []
        };
      }

      return {
        success: true,
        employees: employees as Employee[]
      };
    } catch (error) {
      console.error('Error in getEmployees:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        employees: []
      };
    }
  },

  /**
   * Get a single employee by ID
   * @param {string} id - Employee ID
   * @returns {Promise<SupabaseResponse<Employee>>}
   */
  async getEmployee(id: string): Promise<SupabaseResponse<Employee>> {
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

      if (error) {
        return { data: null, error };
      }

      // Map the joined data to the employee object
      const employeeData = {
        ...data,
        department: data.hr_departments?.name || null,
        position: data.hr_positions?.title || null
      };

      return { data: employeeData, error: null };
    } catch (error) {
      console.error('Error in getEmployee:', error);
      return { data: null, error };
    }
  },

  /**
   * Create a new employee
   * @param {EmployeeUpdate} employee - Employee data to create
   * @returns {Promise<{success: boolean, data?: Employee, error?: string, id?: string}>}
   */
  async createEmployee(employee: EmployeeUpdate): Promise<{success: boolean, data?: Employee, error?: string, id?: string}> {
    try {
      // Create a clean employee object with only the fields we want to insert
      const cleanEmployee: Record<string, any> = {
        name: employee.name?.trim(),
        email: employee.email?.trim(),
        status: employee.status || 'active',
        phone: employee.phone || null,
        hire_date: new Date().toISOString(), // Add current date as hire_date
      };
      
      // Only add department_id if it's a valid non-empty value
      if (employee.department_id && typeof employee.department_id === 'string' && employee.department_id.trim() !== '') {
        cleanEmployee.department_id = employee.department_id;
      }
      
      // Only add position_id if it's a valid non-empty value
      if (employee.position_id && typeof employee.position_id === 'string' && employee.position_id.trim() !== '') {
        cleanEmployee.position_id = employee.position_id;
      }

      // Validate required fields
      if (!cleanEmployee.name) {
        return {
          success: false,
          error: 'Name is required'
        };
      }
      
      if (!cleanEmployee.email) {
        return {
          success: false,
          error: 'Email is required'
        };
      }

      // Log what we're actually sending to Supabase
      console.log('Sending employee data to Supabase:', cleanEmployee);

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([cleanEmployee])
        .select(`
          *,
          hr_departments (
            id,
            name
          ),
          hr_positions (
            id,
            title
          )
        `)
        .single();

      if (error) {
        console.error('Supabase error in createEmployee:', error);
        return { 
          success: false, 
          error: error.message 
        };
      }

      if (!data) {
        return { 
          success: false, 
          error: 'No data returned from the database' 
        };
      }

      // Map the joined data to the employee object
      const employeeData: Employee = {
        ...data,
        department: data.hr_departments?.name || null,
        position: data.hr_positions?.title || null,
        id: data.id,
        name: data.name,
        email: data.email,
        department_id: data.department_id || null,
        position_id: data.position_id || null,
        status: data.status,
        phone: data.phone || null,
        resume_url: data.resume_url || null,
        company_id: data.company_id || null,
        created_at: data.created_at,
        updated_at: data.updated_at,
        hr_departments: data.hr_departments || null,
        hr_positions: data.hr_positions || null,
        rag_status: data.rag_status || null,
        ragStatus: data.ragStatus || null,
        progress: data.progress || null,
        last_activity: data.last_activity || null,
        lastActivity: data.lastActivity || null,
        hire_date: data.hire_date || null,
        user_id: data.user_id || null
      };

      return { 
        success: true, 
        data: employeeData, 
        id: employeeData.id 
      };
    } catch (error: any) {
      console.error('Exception in createEmployee:', error);
      return { 
        success: false, 
        error: error?.message || 'Unknown error occurred'
      };
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
   * Update employee profile
   * @param {string} id - Employee ID
   * @param {EmployeeUpdate} updates - Employee data to update
   * @returns {Promise<SupabaseResponse<Employee>>}
   */
  async updateEmployee(id: string, updates: EmployeeUpdate): Promise<SupabaseResponse<Employee>> {
    try {
      // Update the employee record
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Get the user_id to sync with learner dashboard
      const userId = data?.user_id || id;

      // Automatically sync the changes to the learner dashboard
      try {
        const response = await fetch('/api/learner/profile/sync-hr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });
        
        if (!response.ok) {
          console.warn('Note: Unable to sync profile to learner dashboard automatically');
        }
      } catch (syncError) {
        console.error('Error syncing to learner dashboard:', syncError);
        // Don't fail the entire operation if just the sync fails
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in updateEmployee:', error);
      return { data: null, error };
    }
  },

  /**
   * Delete an employee
   * @param {string} id - Employee ID
   * @returns {Promise<SupabaseResponse<null>>}
   */
  async deleteEmployee(id: string): Promise<SupabaseResponse<null>> {
    try {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

      return { data: null, error };
    } catch (error) {
      console.error('Error in deleteEmployee:', error);
      return { data: null, error };
    }
  },

  /**
   * Update employee status
   * @param {string} id - Employee ID
   * @param {string} status - New status value
   * @returns {Promise<SupabaseResponse<Employee>>}
   */
  async updateEmployeeStatus(id: string, status: string): Promise<SupabaseResponse<Employee>> {
    return this.updateEmployee(id, { status });
  },
  
  /**
   * Update employee password
   * @param {string} email - Employee email
   * @param {string} newPassword - New password
   * @returns {Promise<SupabaseResponse<{ user: SupabaseUser }>>}
   */
  async updateEmployeePassword(email: string, newPassword: string): Promise<SupabaseResponse<{ user: SupabaseUser }>> {
    try {
      // For now, use the supabase client directly to update the auth user
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        console.error('Failed to update password:', error);
        return { data: null, error };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error in updateEmployeePassword:', error);
      return { data: null, error };
    }
  },
  
  /**
   * Reset an employee's password by sending a password reset email
   * @param {string} email - Employee email
   * @returns {Promise<SupabaseResponse<{success: boolean}>>}
   */
  async resetEmployeePassword(email: string): Promise<SupabaseResponse<{success: boolean}>> {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      return { data: { success: !!data }, error };
    } catch (error) {
      console.error('Error in resetEmployeePassword:', error);
      return { data: { success: false }, error };
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
   * @param {File} file - Resume file to upload
   * @returns {Promise<SupabaseResponse<{ resumeUrl: string }>>}
   */
  async uploadEmployeeResume(employeeId: string, file: File): Promise<SupabaseResponse<{ resumeUrl: string }>> {
    try {
      // Validate inputs
      if (!employeeId) {
        return { 
          data: null, 
          error: { 
            message: 'Employee ID is required',
            code: 'INVALID_INPUT'
          } 
        };
      }
      
      if (!file) {
        return { 
          data: null, 
          error: { 
            message: 'File is required', 
            code: 'INVALID_INPUT'
          } 
        };
      }
      
      // Generate a unique filename with timestamp and random string
      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 10);
      const safeOriginalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filename = `${timestamp}_${randomString}_${safeOriginalName}`;
      
      const filePath = `resumes/${employeeId}/${filename}`;
      
      // Try to use supabaseAdmin first if available
      const { supabaseAdmin } = await import('@/lib/supabase-client');
      const client = supabaseAdmin || supabase;
      
      // Upload to storage
      const { data: uploadData, error: uploadError } = await client.storage
        .from('employee-files')
        .upload(filePath, file);
      
      if (uploadError) {
        console.error('Error uploading resume:', uploadError);
        return { data: null, error: uploadError };
      }
      
      // Get the public URL
      const { data: publicUrlData } = client.storage
        .from('employee-files')
        .getPublicUrl(filePath);
      
      const resumeUrl = publicUrlData.publicUrl;
      
      // Update the employee record with the resume URL
      const { data: updateData, error: updateError } = await client
        .from('hr_employees')
        .update({ 
          resume_url: resumeUrl,
          cv_file_url: resumeUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', employeeId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating employee with resume URL:', updateError);
        return { data: null, error: updateError };
      }
      
      return { 
        data: { resumeUrl }, 
        error: null 
      };
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
  },

  /**
   * Get all departments
   * @returns {Promise<{success: boolean, departments?: Department[], error?: string}>}
   */
  async getDepartments() {
    try {
      const { data: departments, error } = await supabase
        .from('hr_departments')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching departments:', error);
        return {
          success: false,
          error: error.message,
          departments: []
        };
      }

      return {
        success: true,
        departments: departments as Department[]
      };
    } catch (error) {
      console.error('Error in getDepartments:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        departments: []
      };
    }
  },

  /**
   * Get employee courses
   * @param employeeId - The ID of the employee
   * @returns A promise with the courses data and any error
   */
  async getEmployeeCourses(employeeId: string) {
    try {
      const { data, error } = await supabase
        .from('hr_course_enrollments')
        .select(`
          id,
          course_id,
          enrollment_date,
          completion_date,
          progress,
          courses:course_id (
            id,
            title,
            description
          )
        `)
        .eq('employee_id', employeeId);

      if (error) throw error;

      // Format the data to match our Course interface
      const formattedCourses = data.map(enrollment => ({
        id: enrollment.course_id,
        title: enrollment.courses ? (enrollment.courses as any).title : '',
        description: enrollment.courses ? (enrollment.courses as any).description : '',
        progress: enrollment.progress,
        enrollment_date: enrollment.enrollment_date,
        completion_date: enrollment.completion_date
      }));

      return { data: formattedCourses, error: null };
    } catch (error) {
      console.error('Error fetching employee courses:', error);
      return { data: null, error };
    }
  },

  /**
   * Get skills for an employee
   * @param {string} employeeId - Employee ID
   * @returns {Promise<{data: any, error: any}>}
   */
  async getEmployeeSkills(employeeId: string): Promise<{data: any, error: any}> {
    try {
      // Attempt to query the skills directly, with error handling
      try {
        // Simple query to test if table exists
        const { data, error } = await supabase
          .from('hr_employee_skills')
          .select('*')
          .eq('employee_id', employeeId);

        // If table exists but there's another error
        if (error) {
          if (error.code === '42P01') { // Table does not exist error code
            console.warn('hr_employee_skills table does not exist, returning empty array');
            
            // Try to create a simple version of the table for future use
            try {
              console.log('Attempting to create a simple skills table...');
              const { error: createError } = await supabase
                .from('hr_employee_skills')
                .insert([
                  { 
                    employee_id: employeeId, 
                    skill_name: 'placeholder', 
                    proficiency_level: 'beginner', 
                    is_in_progress: false 
                  }
                ]);
              
              // If creation succeeded, delete the placeholder
              if (!createError) {
                await supabase
                  .from('hr_employee_skills')
                  .delete()
                  .eq('employee_id', employeeId)
                  .eq('skill_name', 'placeholder');
                console.log('Successfully created skills table!');
              }
            } catch (e) {
              console.log('Could not create skills table, will continue with empty array');
            }
            
            return { data: [], error: null };
          }
          
          console.error('Error fetching employee skills:', error);
          return { data: [], error };
        }
        
        // Map the skills to the expected format
        const skills = (data || []).map(skill => ({
          name: skill.skill_name,
          level: skill.proficiency_level || 'beginner',
          inProgress: skill.is_in_progress || false
        }));
        
        return { data: skills, error: null };
      } catch (error) {
        console.error('Error in getEmployeeSkills:', error);
        return { data: [], error: null };
      }
    } catch (error) {
      console.error('Error in getEmployeeSkills outer try-catch:', error);
      return { data: [], error: null };
    }
  },

  /**
   * Get activities for an employee
   * @param {string} employeeId - Employee ID
   * @param {number} limit - Maximum number of activities to return (default: 10)
   * @returns {Promise<{data: any, error: any}>}
   */
  async getEmployeeActivities(employeeId: string, limit: number = 10): Promise<{data: any, error: any}> {
    try {
      // Attempt to query the activities directly
      try {
        const { data, error } = await supabase
          .from('hr_employee_activities')
          .select('*')
          .eq('employee_id', employeeId)
          .order('created_at', { ascending: false })
          .limit(limit);
        
        if (error) {
          if (error.code === '42P01') { // Table does not exist error code
            console.warn('hr_employee_activities table does not exist, returning empty array');
            
            // Try to create a simple version of the table for future use
            try {
              console.log('Attempting to create a simple activities table...');
              const { error: createError } = await supabase
                .from('hr_employee_activities')
                .insert([
                  { 
                    employee_id: employeeId, 
                    activity_type: 'system', 
                    description: 'Profile viewed'
                  }
                ]);
              
              // If creation succeeded, delete the placeholder or keep as first activity
              if (!createError) {
                console.log('Successfully created activities table!');
              }
            } catch (e) {
              console.log('Could not create activities table, will continue with empty array');
            }
            
            return { data: [], error: null };
          }
          
          console.error('Error fetching employee activities:', error);
          return { data: [], error };
        }
        
        // Format the data to have consistent properties
        const activities = (data || []).map(activity => ({
          id: activity.id,
          activity_type: activity.activity_type || 'other',
          description: activity.description || 'Activity recorded',
          timestamp: activity.created_at,
          course_title: activity.metadata?.course_title
        }));
        
        return { data: activities, error: null };
      } catch (error) {
        console.error('Error in getEmployeeActivities:', error);
        return { data: [], error: null };
      }
    } catch (error) {
      console.error('Error in getEmployeeActivities outer try-catch:', error);
      return { data: [], error: null };
    }
  },

  /**
   * Add a skill to an employee
   * @param {string} employeeId - Employee ID
   * @param {Object} skill - Skill data
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async addEmployeeSkill(employeeId: string, skill: any): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      // Validate required fields
      if (!employeeId) {
        return {
          success: false,
          error: 'Employee ID is required'
        };
      }

      if (!skill.name) {
        return {
          success: false,
          error: 'Skill name is required'
        };
      }

      // Prepare the skill data for insertion
      const skillData = {
        employee_id: employeeId,
        skill_name: skill.name,
        category: skill.category || 'Uncategorized',
        proficiency_level: skill.proficiency || 'beginner',
        is_required: skill.isRequired || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Adding skill to employee:', { employeeId, skillData });

      // Insert the skill
      const { data, error } = await supabase
        .from('hr_employee_skills')
        .insert([skillData])
        .select()
        .single();

      if (error) {
        console.error('Error adding employee skill:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Exception in addEmployeeSkill:', error);
      return {
        success: false,
        error: error?.message || 'Unknown error occurred'
      };
    }
  },

  /**
   * Assign a course to an employee
   * @param {string} employeeId - Employee ID
   * @param {string} courseId - Course ID
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async assignCourseToEmployee(employeeId: string, courseId: string): Promise<{success: boolean, data?: any, error?: string}> {
    try {
      // Validate required fields
      if (!employeeId) {
        return {
          success: false,
          error: 'Employee ID is required'
        };
      }

      if (!courseId) {
        return {
          success: false,
          error: 'Course ID is required'
        };
      }

      // Prepare the enrollment data
      const enrollmentData = {
        employee_id: employeeId,
        course_id: courseId,
        enrollment_date: new Date().toISOString(),
        progress: 0,
        status: 'assigned'
      };

      console.log('Assigning course to employee:', { employeeId, courseId, enrollmentData });

      // Try to use supabaseAdmin first if available
      const { supabaseAdmin, supabase } = await import('@/lib/supabase-client');
      const client = supabaseAdmin || supabase;

      // Check if enrollment already exists
      const { data: existingEnrollment, error: checkError } = await client
        .from('hr_course_enrollments')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('course_id', courseId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing enrollment:', checkError);
        return {
          success: false,
          error: checkError.message
        };
      }

      // If enrollment already exists, return success
      if (existingEnrollment) {
        console.log('Enrollment already exists:', existingEnrollment);
        return {
          success: true,
          data: existingEnrollment
        };
      }

      // Insert the enrollment
      const { data, error } = await client
        .from('hr_course_enrollments')
        .insert([enrollmentData])
        .select()
        .single();

      if (error) {
        console.error('Error assigning course to employee:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error: any) {
      console.error('Exception in assignCourseToEmployee:', error);
      return {
        success: false,
        error: error?.message || 'Unknown error occurred'
      };
    }
  }
};

// Export the service
export { hrEmployeeService };
export default hrEmployeeService;

// Initialize database tables when the service is imported
(async () => {
  try {
    console.log("Checking HR tables existence...");
    const result = await verifyHRTables();
    if (result.success) {
      console.log("HR tables initialized successfully:", result.message);
    } else {
      console.error("Failed to initialize HR tables:", result.error);
    }
  } catch (error) {
    console.error("Error initializing HR tables:", error);
  }
})();
