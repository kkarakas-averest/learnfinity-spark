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
      console.log('Attempting to create employee with data:', JSON.stringify(employee, null, 2));
      
      // Validate schema before sending to the database
      const requiredFields = ['name', 'email', 'company_id'];
      const missingFields = requiredFields.filter(field => !employee[field]);
      
      if (missingFields.length > 0) {
        const error = new Error(`Missing required fields: ${missingFields.join(', ')}`);
        console.error('Validation error:', error.message);
        return { data: null, error };
      }
      
      // Ensure company_id is a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(employee.company_id)) {
        const error = new Error(`Invalid company_id format: ${employee.company_id}. Must be a valid UUID.`);
        console.error('Validation error:', error.message);
        return { data: null, error };
      }

      // Clean the employee object to remove undefined values
      const cleanEmployee = Object.fromEntries(
        Object.entries(employee).filter(([_, v]) => v !== undefined)
      );
      
      console.log('Sending cleaned employee data to database:', cleanEmployee);
      
      // Step 1: Just try to insert the data with no options
      const { error: insertError } = await supabase
        .from(TABLE_NAME)
        .insert(cleanEmployee);

      if (insertError) {
        console.error('Detailed error creating employee:', {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details,
          hint: insertError.hint,
          statusCode: insertError.status || insertError.statusCode,
          fullError: JSON.stringify(insertError)
        });
        return { data: null, error: insertError };
      }

      console.log('Employee created successfully, fetching details...');
      
      // Step 2: If insert succeeded, fetch the employee data separately
      const { data: createdEmployee, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('email', employee.email)
        .maybeSingle();
      
      if (fetchError) {
        console.warn('Employee likely created but could not fetch details:', fetchError);
        // Return a minimal record with just the email so the app can continue
        return { 
          data: { email: employee.email }, 
          error: null 
        };
      }
      
      return { 
        data: createdEmployee || { email: employee.email }, 
        error: null 
      };
    } catch (error) {
      console.error('Exception in createEmployee:', error);
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
      console.log('Full employee object:', JSON.stringify(employee, null, 2));
      
      // Validate required fields before proceeding
      if (!employee.name || !employee.name.trim()) {
        throw new Error('Employee name is required');
      }
      
      if (!employee.email || !employee.email.trim()) {
        throw new Error('Employee email is required');
      }
      
      // Ensure we have a company ID - prioritize snake_case (backend) over camelCase (frontend)
      const companyId = employee.company_id || employee.companyId || DEFAULT_COMPANY_ID;
      if (!companyId) {
        throw new Error('Company ID is required for employee creation');
      }
      
      // Check if all HR tables exist
      const { exists, missingTables } = await this.checkHRTablesExist();
      if (!exists) {
        const errorMsg = `Cannot create employee because required tables are missing: ${missingTables.join(', ')}. Please run the database initialization script.`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }
      
      // First create the employee record - convert all keys to snake_case for database
      const employeeData = {
        name: employee.name,
        email: employee.email,
        department_id: employee.department_id || employee.departmentId,
        position_id: employee.position_id || employee.positionId,
        status: employee.status,
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
      
      // Immediately sign in the user to bypass email confirmation
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: employee.email,
        password: password
      });

      if (signInError) {
        console.warn('Created user but could not sign in:', signInError);
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
          console.log('Attempting to enroll employee in courses:', employee.courseIds);
          
          // First check if the course IDs are valid UUIDs
          const invalidCourseIds = employee.courseIds.filter(id => {
            // Check if it's a UUID or a string like 'course-1'
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return !uuidRegex.test(id) && !id.startsWith('course-');
          });
          
          if (invalidCourseIds.length > 0) {
            console.warn('Some course IDs have invalid format:', invalidCourseIds);
            // Continue with valid IDs only
          }
          
          // Filter out invalid course IDs
          const validCourseIds = employee.courseIds.filter(id => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return uuidRegex.test(id) || id.startsWith('course-');
          });
          
          if (validCourseIds.length === 0) {
            console.warn('No valid course IDs to enroll employee in');
            return { 
              data: createdEmployee, 
              error: null, 
              userAccount: {
                email: employee.email,
                password,
                id: authData.user.id
              }
            };
          }
          
          const enrollments = validCourseIds.map(courseId => ({
            employee_id: createdEmployee.id,
            course_id: courseId,
            status: 'enrolled',
            progress: 0,
            enrollment_date: new Date().toISOString()
          }));
          
          // Try to insert enrollments one by one instead of all at once
          // This way, if one fails, the others can still succeed
          let enrollmentErrors = [];
          
          for (const enrollment of enrollments) {
          const { error: enrollmentError } = await supabase
            .from('hr_course_enrollments')
              .insert(enrollment);
            
          if (enrollmentError) {
              console.warn(`Failed to enroll employee in course ${enrollment.course_id}:`, enrollmentError);
              enrollmentErrors.push({
                course_id: enrollment.course_id,
                error: enrollmentError
              });
            } else {
              // Create activity record for successful enrollment
              await supabase
                .from('hr_employee_activities')
                .insert({
                  employee_id: createdEmployee.id,
                  activity_type: 'enrollment',
                  description: `Enrolled in course ${enrollment.course_id}`,
                  course_id: enrollment.course_id,
                  timestamp: new Date().toISOString()
                });
            }
          }
          
          if (enrollmentErrors.length > 0) {
            console.warn(`${enrollmentErrors.length} course enrollments failed:`, enrollmentErrors);
          }
          
        } catch (enrollError) {
          console.warn('Exception when enrolling employee in courses:', enrollError);
          // Don't fail the entire employee creation just because course enrollment failed
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
  },

  /**
   * Test minimal API functionality for troubleshooting
   * @returns {Promise<{success: boolean, error: Object, responseText: string}>}
   */
  async testMinimalApiRequest() {
    try {
      console.log('==== Testing minimal API request ====');
      
      // 1. First try direct fetch to check API connectivity
      const apiUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co/rest/v1/hr_employees';
      const apiKey = supabase.supabaseKey;
      
      console.log('Testing direct fetch to:', apiUrl);
      console.log('Using API key length:', apiKey?.length || 0);
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        const responseText = await response.text();
        console.log('Direct API test response status:', response.status);
        console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));
        console.log('Response text (truncated):', responseText.substring(0, 100) + '...');
        
        // 2. Try minimal insert with just required fields
        const minimalEmployee = {
          name: 'Test Employee ' + new Date().toISOString(),
          email: 'test' + Date.now() + '@example.com',
          company_id: '4fb1a692-3995-40ee-8aa5-292fd8ebf029'
        };
        
        console.log('Testing minimal insert with:', minimalEmployee);
        
        const insertResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(minimalEmployee)
        });
        
        const insertResponseText = await insertResponse.text();
        console.log('Insert API test response status:', insertResponse.status);
        console.log('Insert response headers:', Object.fromEntries([...insertResponse.headers.entries()]));
        console.log('Insert response text:', insertResponseText);
        
        return {
          success: insertResponse.status >= 200 && insertResponse.status < 300,
          error: insertResponse.status >= 400 ? { status: insertResponse.status } : null,
          responseText: insertResponseText
        };
      } catch (fetchError) {
        console.error('Error during direct API test:', fetchError);
        return { success: false, error: fetchError, responseText: null };
      }
    } catch (error) {
      console.error('Exception in testMinimalApiRequest:', error);
      return { success: false, error, responseText: null };
    }
  },

  /**
   * Create an employee from a JSON object with validation
   * @param {Object} employeeJSON - JSON representation of employee data
   * @returns {Promise<{data: Object, error: Object, userAccount: Object, authError: Object}>}
   */
  async createEmployeeFromJSON(employeeJSON) {
    try {
      console.log('Creating employee from JSON:', employeeJSON);
      
      // 1. Define the expected schema
      const requiredFields = ['name', 'email'];
      const optionalFields = [
        'department_id', 'departmentId',
        'position_id', 'positionId',
        'company_id', 'companyId',
        'status', 'phone',
        'hire_date', 'hireDate',
        'profile_image_url', 'profileImageUrl'
      ];
      const allowedFields = [...requiredFields, ...optionalFields];
      
      // 2. Basic validation
      const validationErrors = [];
      
      // Check for required fields
      for (const field of requiredFields) {
        if (!employeeJSON[field]) {
          validationErrors.push(`Missing required field: ${field}`);
        }
      }
      
      // Check for unknown fields
      for (const field in employeeJSON) {
        if (!allowedFields.includes(field) && field !== 'courseIds' && field !== 'resumeFile') {
          validationErrors.push(`Unknown field: ${field}`);
        }
      }
      
      // Validate email format
      if (employeeJSON.email && !employeeJSON.email.includes('@')) {
        validationErrors.push('Invalid email format');
      }
      
      if (validationErrors.length > 0) {
        const error = new Error(`Validation errors: ${validationErrors.join(', ')}`);
        console.error('JSON validation failed:', error.message);
        return { data: null, error, userAccount: null };
      }
      
      // 3. Convert camelCase to snake_case and standardize the data
      const standardizedEmployee = {
        name: employeeJSON.name,
        email: employeeJSON.email,
        department_id: employeeJSON.department_id || employeeJSON.departmentId,
        position_id: employeeJSON.position_id || employeeJSON.positionId,
        company_id: employeeJSON.company_id || employeeJSON.companyId || DEFAULT_COMPANY_ID,
        status: employeeJSON.status || 'active',
        phone: employeeJSON.phone
      };
      
      // Handle dates (convert to ISO string if needed)
      if (employeeJSON.hire_date || employeeJSON.hireDate) {
        const hireDate = employeeJSON.hire_date || employeeJSON.hireDate;
        standardizedEmployee.hire_date = hireDate instanceof Date 
          ? hireDate.toISOString()
          : hireDate;
      }
      
      // Extract course IDs and resume file for separate processing
      const courseIds = employeeJSON.courseIds || [];
      const resumeFile = employeeJSON.resumeFile;
      
      // 4. Create the employee
      const { data: createdEmployee, error } = await this.createEmployee(standardizedEmployee);
      
      if (error) {
        return { data: null, error, userAccount: null };
      }
      
      // 5. Process resume file if provided
      if (resumeFile && createdEmployee?.id) {
        await this.uploadEmployeeResume(createdEmployee.id, resumeFile);
      }
      
      // 6. Enroll in courses if provided
      if (courseIds.length > 0 && createdEmployee?.id) {
        await this.enrollEmployeeInCourses(createdEmployee.id, courseIds);
      }
      
      // 7. Create user account
      // Generate a secure random password for the new account
      const password = generateSecurePassword({
        length: 12,
        includeSpecial: true // Include special characters for better security
      });

      console.log('Creating user account with email:', standardizedEmployee.email);
      
      // First try to sign in with password to check if user exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: standardizedEmployee.email,
        password: 'temp-password-that-will-fail'
      });

      let authData;
      
      if (signInError?.message === 'Invalid login credentials') {
        // User doesn't exist, create new account
        console.log('User does not exist, creating new account...');
        const { data: newAuthData, error: authError } = await supabase.auth.signUp({
          email: standardizedEmployee.email,
          password,
          options: {
            data: {
              name: standardizedEmployee.name,
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
        
        authData = newAuthData;
      } else {
        // User exists, update their password
        console.log('User exists, updating password...');
        const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(
          standardizedEmployee.email,
          {
            redirectTo: `${window.location.origin}/auth/reset-password`
          }
        );

        if (resetError) {
          console.error('Error sending password reset email:', resetError);
          return {
            data: createdEmployee,
            error: resetError,
            userAccount: null
          };
        }

        // Use the existing user's data
        authData = { user: { id: signInData?.user?.id } };
      }

      // Try to insert user into users table
      try {
        // First check if user already exists in users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', standardizedEmployee.email)
          .single();

        if (!existingUser) {
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              name: standardizedEmployee.name,
              email: standardizedEmployee.email,
              password: 'hashed-in-rpc',
              role: 'learner',
            });

          if (insertError) {
            console.warn('Failed to create user profile:', insertError);
          }
        }
      } catch (insertError) {
        console.warn('Exception when creating user profile:', insertError);
      }
      
      // Also create a learner record associated with the user
      try {
        // First check if learner record exists
        const { data: existingLearner } = await supabase
          .from('learners')
          .select('id')
          .eq('id', authData.user.id)
          .single();

        if (!existingLearner) {
          const { error: learnerError } = await supabase
            .from('learners')
            .insert({
              id: authData.user.id,
              company_id: standardizedEmployee.company_id,
              progress_status: {},
              preferences: {},
              certifications: {}
            });
            
          if (learnerError) {
            console.warn('Failed to create learner record:', learnerError);
          }
        }
      } catch (learnerError) {
        console.warn('Exception when creating learner record:', learnerError);
      }

      // Store the credentials temporarily in localStorage for auto-login
      localStorage.setItem('temp_login_email', standardizedEmployee.email);
      localStorage.setItem('temp_login_password', password);
      
      return { 
        data: createdEmployee, 
        error: null, 
        userAccount: {
          email: standardizedEmployee.email,
          password,
          id: authData.user.id
        }
      };
    } catch (error) {
      console.error('Error in createEmployeeFromJSON:', error);
      return { data: null, error, userAccount: null };
    }
  },

  /**
   * Upload an employee resume
   * @param {string} employeeId - Employee ID
   * @param {File} resumeFile - Resume file
   * @returns {Promise<{url: string, error: Object}>}
   */
  async uploadEmployeeResume(employeeId, resumeFile) {
    try {
      if (!resumeFile) {
        return { url: null, error: null };
      }
      
      // Create a safe filename
      const fileExt = resumeFile.name.split('.').pop();
      const fileName = `${Date.now()}-${employeeId}.${fileExt}`;
      const filePath = `resumes/${employeeId}/${fileName}`;
      
      console.log('Attempting to upload resume:', {
        fileName,
        filePath,
        fileSize: resumeFile.size,
        fileType: resumeFile.type
      });

      // First ensure the bucket exists and is accessible
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();

      if (bucketsError) {
        console.error('Error checking storage buckets:', bucketsError);
        return { url: null, error: bucketsError };
      }

      const hrBucket = buckets.find(b => b.name === 'hr-documents');
      if (!hrBucket) {
        console.error('HR documents bucket not found');
        return { url: null, error: new Error('Storage bucket not found') };
      }
      
      // Upload file to Supabase Storage
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('hr-documents')
        .upload(filePath, resumeFile, {
          cacheControl: '3600',
          upsert: true,
          contentType: resumeFile.type
        });
        
      if (uploadError) {
        console.error('Error uploading resume:', uploadError);
        return { url: null, error: uploadError };
      }
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('hr-documents')
        .getPublicUrl(filePath);
        
      const resumeUrl = urlData?.publicUrl;
      
      if (!resumeUrl) {
        console.error('Failed to get public URL for uploaded file');
        return { url: null, error: new Error('Failed to get file URL') };
      }

      console.log('Resume uploaded successfully:', resumeUrl);
      
      // Update employee record with resume URL
      try {
        const { error: updateError } = await this.updateEmployee(employeeId, {
          resume_url: resumeUrl
        });

        if (updateError) {
          console.warn('Failed to update employee with resume URL:', updateError);
        }
      } catch (updateError) {
        console.warn('Exception updating employee with resume URL:', updateError);
      }
      
      return { url: resumeUrl, error: null };
    } catch (error) {
      console.error('Error in uploadEmployeeResume:', error);
      return { url: null, error };
    }
  },

  /**
   * Enroll an employee in courses
   * @param {string} employeeId - Employee ID
   * @param {Array<string>} courseIds - Course IDs
   * @returns {Promise<{success: boolean, error: Object}>}
   */
  async enrollEmployeeInCourses(employeeId, courseIds) {
    try {
      if (!courseIds || courseIds.length === 0) {
        return { success: true, error: null };
      }
      
      console.log('Attempting to enroll employee in courses:', {
        employeeId,
        courseIds
      });

      // First validate the employee ID exists
      const { data: employee, error: employeeError } = await supabase
        .from('hr_employees')
        .select('id')
        .eq('id', employeeId)
        .single();

      if (employeeError || !employee) {
        console.error('Invalid employee ID for enrollment:', employeeError);
        return { success: false, error: new Error('Invalid employee ID') };
      }
      
      // Filter out invalid course IDs and check for existing enrollments
      const validCourseIds = courseIds.filter(id => {
        // Accept both UUID format and 'course-X' format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id) || /^course-\d+$/.test(id);
      });
      
      if (validCourseIds.length === 0) {
        console.warn('No valid course IDs to enroll employee in');
        return { success: false, error: new Error('No valid course IDs') };
      }

      // Check for existing enrollments to avoid duplicates
      const { data: existingEnrollments, error: checkError } = await supabase
        .from('hr_course_enrollments')
        .select('course_id')
        .eq('employee_id', employeeId)
        .in('course_id', validCourseIds);

      if (checkError) {
        console.warn('Error checking existing enrollments:', checkError);
      }

      const existingCourseIds = new Set(existingEnrollments?.map(e => e.course_id) || []);
      const newCourseIds = validCourseIds.filter(id => !existingCourseIds.has(id));
      
      if (newCourseIds.length === 0) {
        console.log('All courses are already enrolled');
        return { success: true, error: null };
      }
      
      // Try to insert enrollments one by one
      let enrollmentErrors = [];
      let successfulEnrollments = [];
      
      for (const courseId of newCourseIds) {
        try {
          const enrollment = {
            employee_id: employeeId,
            course_id: courseId,
            status: 'enrolled',
            progress: 0,
            enrollment_date: new Date().toISOString()
          };

          const { error: enrollmentError } = await supabase
            .from('hr_course_enrollments')
            .insert(enrollment);
            
          if (enrollmentError) {
            console.warn(`Failed to enroll employee in course ${courseId}:`, enrollmentError);
            enrollmentErrors.push({
              course_id: courseId,
              error: enrollmentError
            });
          } else {
            successfulEnrollments.push(courseId);
            
            // Create activity record for successful enrollment
            try {
              await supabase
                .from('hr_employee_activities')
                .insert({
                  employee_id: employeeId,
                  activity_type: 'enrollment',
                  description: `Enrolled in course ${courseId}`,
                  course_id: courseId,
                  timestamp: new Date().toISOString()
                });
            } catch (activityError) {
              console.warn(`Failed to create activity record for course ${courseId}:`, activityError);
            }
          }
        } catch (error) {
          console.warn(`Exception enrolling in course ${courseId}:`, error);
          enrollmentErrors.push({
            course_id: courseId,
            error
          });
        }
      }
      
      if (enrollmentErrors.length > 0) {
        console.warn(`${enrollmentErrors.length} course enrollments failed:`, enrollmentErrors);
        if (successfulEnrollments.length > 0) {
          console.log(`${successfulEnrollments.length} enrollments succeeded:`, successfulEnrollments);
        }
        return { 
          success: successfulEnrollments.length > 0,
          error: new Error(`${enrollmentErrors.length} enrollments failed`),
          successfulEnrollments,
          failedEnrollments: enrollmentErrors.map(e => e.course_id)
        };
      }
      
      return { 
        success: true, 
        error: null,
        successfulEnrollments
      };
    } catch (error) {
      console.error('Error in enrollEmployeeInCourses:', error);
      return { success: false, error };
    }
  }
};

// Create a global function to run the API test directly
if (typeof window !== 'undefined') {
  window.runSupabaseTest = async () => {
    console.log('Direct API test running from global function...');
    try {
      const service = hrEmployeeService;
      const result = await service.testMinimalApiRequest();
      console.log('Direct API test result:', result);
      return result;
    } catch (error) {
      console.error('Error in global test function:', error);
      return { success: false, error };
    }
  };
  console.log('Global function window.runSupabaseTest() is now available for API testing');
}

export default hrEmployeeService; 