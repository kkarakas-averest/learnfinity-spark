import { supabase } from '@/lib/supabase';
import { generateSecurePassword } from '@/lib/utils';

// Import from env variables or use a fallback
const DEFAULT_COMPANY_ID = import.meta.env.VITE_DEFAULT_COMPANY_ID || 'default-company-id';
const TABLE_NAME = 'hr_employees';

export const hrEmployeeService = {
  /**
   * Ensure the resume_url column exists in the hr_employees table
   * This will be called once during initialization
   */
  async ensureResumeUrlColumn() {
    try {
      // Check if the column exists by trying to update a non-existent record with it
      const { error } = await supabase.rpc('add_resume_url_column_if_not_exists');
      
      if (error) {
        console.warn('Unable to check/add resume_url column via RPC, trying alternative approach:', error);
        
        // Alternative approach: Create a dummy query that uses the column
        // If it fails, we'll create the function and try again
        const testQuery = await supabase
          .from(TABLE_NAME)
          .select('resume_url')
          .limit(1);
          
        if (testQuery.error && testQuery.error.message.includes('column "resume_url" does not exist')) {
          console.log('Resume URL column does not exist, creating RPC function...');
          
          // Create the RPC function that adds the column if it doesn't exist
          const createRpcFn = await supabase.rpc('create_add_resume_url_column_function');
          
          if (createRpcFn.error) {
            console.error('Error creating RPC function:', createRpcFn.error);
          } else {
            // Try to add the column again
            await supabase.rpc('add_resume_url_column_if_not_exists');
          }
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error ensuring resume_url column exists:', error);
      return { success: false, error };
    }
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
   * @param {File} employee.resumeFile - Resume file (optional)
   * @param {Array} employee.courseIds - Course IDs to enroll the employee in
   * @returns {Promise<{data: Object, error: Object, userAccount: Object}>}
   */
  async createEmployeeWithUserAccount(employee) {
    try {
      console.log('Creating employee with account, company ID:', employee.companyId || employee.company_id || DEFAULT_COMPANY_ID);
      
      // Validate required fields before proceeding
      if (!employee.name || !employee.name.trim()) {
        throw new Error('Employee name is required');
      }
      
      if (!employee.email || !employee.email.trim()) {
        throw new Error('Employee email is required');
      }
      
      // Ensure we have a company ID
      const companyId = employee.companyId || employee.company_id || DEFAULT_COMPANY_ID;
      if (!companyId) {
        throw new Error('Company ID is required for employee creation');
      }
      
      // Check if hr_employees table exists first
      const { error: tableCheckError } = await supabase
        .from(TABLE_NAME)
        .select('id')
        .limit(1);
        
      if (tableCheckError) {
        console.warn('HR employees table check error:', tableCheckError);
        
        // Instead of trying to create the table dynamically, guide the user
        if (tableCheckError.message.includes('relation "hr_employees" does not exist')) {
          throw new Error('The HR employees table does not exist. Please run the database initialization script from src/lib/database/hr-schema.sql in your Supabase SQL editor.');
        } else {
          throw tableCheckError;
        }
      }
      
      // First create the employee record
      const employeeData = {
        name: employee.name,
        email: employee.email,
        department_id: employee.department_id || employee.departmentId,
        position_id: employee.position_id || employee.positionId,
        status: employee.status,
        notes: employee.notes,
        company_id: companyId
      };
      
      console.log('Creating employee with data:', employeeData);
      const { data: createdEmployee, error: employeeError } = await this.createEmployee(employeeData);
      
      if (employeeError) {
        console.error('Error creating employee:', employeeError);
        throw employeeError;
      }
      
      // Upload resume if provided
      let resumeUrl = null;
      if (employee.resumeFile) {
        try {
          const fileName = `${Date.now()}-${employee.resumeFile.name}`;
          const filePath = `resumes/${createdEmployee.id}/${fileName}`;
          
          // Upload file to Supabase Storage
          const { data: fileData, error: uploadError } = await supabase.storage
            .from('hr-documents')
            .upload(filePath, employee.resumeFile);
            
          if (uploadError) {
            console.error('Error uploading resume:', uploadError);
          } else {
            // Get the public URL
            const { data: urlData } = supabase.storage
              .from('hr-documents')
              .getPublicUrl(filePath);
              
            resumeUrl = urlData?.publicUrl;
            
            // Update employee record with resume URL
            if (resumeUrl) {
              await this.updateEmployee(createdEmployee.id, {
                resume_url: resumeUrl
              });
            }
          }
        } catch (uploadError) {
          console.error('Error in resume upload:', uploadError);
        }
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
          data: createdEmployee, 
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
            company_id: employee.company_id || employee.companyId || DEFAULT_COMPANY_ID,
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
      
      // Enroll employee in selected courses
      if (employee.courseIds && employee.courseIds.length > 0) {
        try {
          const enrollments = employee.courseIds.map(courseId => ({
            employee_id: createdEmployee.id,
            course_id: courseId,
            status: 'enrolled',
            progress: 0,
            enrollment_date: new Date().toISOString()
          }));
          
          const { error: enrollmentError } = await supabase
            .from('hr_course_enrollments')
            .insert(enrollments);
            
          if (enrollmentError) {
            console.warn('Failed to enroll employee in courses:', enrollmentError);
          }
          
          // Create activity records for enrollments
          const activities = employee.courseIds.map(courseId => ({
            employee_id: createdEmployee.id,
            activity_type: 'enrollment',
            description: `Enrolled in course`,
            course_id: courseId,
            timestamp: new Date().toISOString()
          }));
          
          await supabase
            .from('hr_employee_activities')
            .insert(activities);
        } catch (enrollError) {
          console.warn('Exception when enrolling employee in courses:', enrollError);
        }
      }
      
      return { 
        data: createdEmployee, 
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