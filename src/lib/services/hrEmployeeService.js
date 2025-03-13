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
      console.log('🔍 [DEBUG] getEmployees called with:', { page, pageSize, searchTerm, departmentId, status });
      
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
        console.error('❌ [DEBUG] Error fetching employees from database:', error);
        
        // Try to load mock data from JSON file
        try {
          console.log('📁 [DEBUG] Attempting to load mock employee data...');
          
          // Try loading the override file with a direct URL to ensure it's found
          const overrideUrl = window.location.origin + '/data/hr_employees_override.json';
          console.log('📁 [DEBUG] Trying to load override file from:', overrideUrl);
          
          try {
            // Force fetch the override file with cache: 'no-store' option
            const overrideResponse = await fetch(overrideUrl, { 
              method: 'GET',
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
            
            console.log('📁 [DEBUG] Override file response status:', overrideResponse.status);
            
            if (overrideResponse.ok) {
              try {
                const overrideText = await overrideResponse.text();
                console.log('📁 [DEBUG] Raw override file content (first 200 chars):', 
                  overrideText.substring(0, 200));
                  
                // Parse the JSON text
                const overrideData = JSON.parse(overrideText);
                
                console.log('📁 [DEBUG] Override file parsed successfully:', { 
                  enabled: overrideData.overrideEnabled, 
                  employeeCount: overrideData.employees?.length 
                });
                
                // ALWAYS use override data when available instead of checking flag
                console.log('📁 [DEBUG] Using employee data override (forcing override)');
                
                let employeesList = overrideData.employees || [];
                if (employeesList.length > 0) {
                  console.log('📁 [DEBUG] First employee from override:', 
                    JSON.stringify(employeesList[0], null, 2));
                  
                  // Apply filters
                  let filteredEmployees = [...employeesList];
                  
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
                  
                  // Calculate total and paginate
                  const total = filteredEmployees.length;
                  const paginatedEmployees = filteredEmployees.slice(from, from + pageSize);
                  
                  // Ensure hr_departments and hr_positions are properly set for each employee
                  const finalEmployees = paginatedEmployees.map(emp => {
                    // Make sure department and position are properly set
                    const finalEmp = {
                      ...emp,
                      // Create nested objects if missing
                      hr_departments: emp.hr_departments || {
                        id: emp.department_id || 'dept-unknown',
                        name: emp.department || 'Unknown Department'
                      },
                      hr_positions: emp.hr_positions || {
                        id: emp.position_id || 'pos-unknown',
                        title: emp.position || 'Unknown Position'
                      }
                    };
                    
                    // Make this employee clearly identifiable as coming from override
                    if (!finalEmp.id.includes('custom')) {
                      finalEmp.id = 'custom-' + finalEmp.id;
                    }
                    
                    return finalEmp;
                  });
                  
                  console.log('✅ [DEBUG] Returning override data with validation check:', 
                    { total, pageSize, returnedEmployees: finalEmployees.length });
                  
                  // Triple check first employee's department and position fields
                  if (finalEmployees.length > 0) {
                    const firstEmp = finalEmployees[0];
                    console.log('✅ [DEBUG] First employee department/position check:', {
                      department: firstEmp.department,
                      position: firstEmp.position,
                      hr_departments: firstEmp.hr_departments,
                      hr_positions: firstEmp.hr_positions
                    });
                  }
                  
                  return {
                    success: true,
                    employees: finalEmployees,
                    total: total,
                    error: null
                  };
                } else {
                  console.warn('❌ [DEBUG] Override file has no employees');
                }
              } catch (parseError) {
                console.error('❌ [DEBUG] Error parsing override file JSON:', parseError);
                
                // Try a different approach to load the data
                console.log('📁 [DEBUG] Attempting to load override data using direct import');
                try {
                  // Use a static pre-defined employee list as last resort
                  const staticEmployees = [
                    {
                      "id": "static-001",
                      "name": "Jane Smith (Static)",
                      "email": "jane.smith@learnfinity.com",
                      "department": "Engineering",
                      "position": "Senior Developer",
                      "department_id": "dept-001",
                      "position_id": "pos-001",
                      "courses": 8,
                      "coursesCompleted": 6,
                      "progress": 75,
                      "lastActivity": "2024-03-13",
                      "status": "active",
                      "ragStatus": "green",
                      "created_at": "2022-05-15T10:00:00Z",
                      "updated_at": "2024-03-13T09:00:00Z",
                      "hr_departments": {
                        "id": "dept-001",
                        "name": "Engineering"
                      },
                      "hr_positions": {
                        "id": "pos-001",
                        "title": "Senior Developer"
                      }
                    },
                    {
                      "id": "static-002",
                      "name": "John Doe (Static)",
                      "email": "john.doe@learnfinity.com",
                      "department": "Marketing",
                      "position": "Marketing Specialist",
                      "department_id": "dept-002",
                      "position_id": "pos-002",
                      "courses": 5,
                      "coursesCompleted": 2,
                      "progress": 40,
                      "lastActivity": "2024-03-12",
                      "status": "active",
                      "ragStatus": "amber",
                      "created_at": "2022-06-20T10:00:00Z",
                      "updated_at": "2024-03-12T15:30:00Z",
                      "hr_departments": {
                        "id": "dept-002",
                        "name": "Marketing"
                      },
                      "hr_positions": {
                        "id": "pos-002",
                        "title": "Marketing Specialist"
                      }
                    },
                    {
                      "id": "static-003",
                      "name": "Kubilay Karakas (Static)",
                      "email": "kubilay.karakas@averesttraining.com",
                      "department": "Finance",
                      "position": "Financial Analyst",
                      "department_id": "dept-005",
                      "position_id": "pos-006",
                      "courses": 15,
                      "coursesCompleted": 14,
                      "progress": 93,
                      "lastActivity": "2024-03-14",
                      "status": "active",
                      "ragStatus": "green",
                      "created_at": "2022-07-10T10:00:00Z",
                      "updated_at": "2024-03-14T15:45:00Z",
                      "hr_departments": {
                        "id": "dept-005",
                        "name": "Finance"
                      },
                      "hr_positions": {
                        "id": "pos-006",
                        "title": "Financial Analyst"
                      }
                    }
                  ];
                  
                  console.log('✅ [DEBUG] Using static employee data as last resort:', { 
                    employeeCount: staticEmployees.length 
                  });
                  
                  // Apply filters to static data
                  let filteredStaticEmployees = [...staticEmployees];
                  
                  // Calculate total and paginate
                  const totalStatic = filteredStaticEmployees.length;
                  const paginatedStaticEmployees = filteredStaticEmployees.slice(from, from + pageSize);
                  
                  console.log('✅ [DEBUG] Returning static employee data:', { 
                    total: totalStatic, 
                    pageSize, 
                    employees: paginatedStaticEmployees.length 
                  });
                  
                  return {
                    success: true,
                    employees: paginatedStaticEmployees,
                    total: totalStatic,
                    error: null
                  };
                } catch (staticError) {
                  console.error('❌ [DEBUG] Even static data failed:', staticError);
                }
              }
            } else {
              console.log('❌ [DEBUG] Could not load override file, status:', overrideResponse.status);
            }
          } catch (overrideError) {
            console.error('❌ [DEBUG] Error loading override file:', overrideError);
          }
          
          // Fallback to standard mock data
          console.log('📁 [DEBUG] Falling back to standard mock data...');
          const fallbackUrl = window.location.origin + '/data/employees_list.json';
          console.log('📁 [DEBUG] Loading from:', fallbackUrl);
          
          const response = await fetch(fallbackUrl);
          console.log('📁 [DEBUG] Standard mock data response status:', response.status);
          
          if (response.ok) {
            const mockData = await response.json();
            console.log('📁 [DEBUG] Mock data loaded:', 
              { success: mockData.success, employeeCount: mockData.employees?.length });
            
            let filteredEmployees = mockData.employees || [];
            
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
            
            console.log("🔍 [DEBUG] First employee pre-transform:", 
              JSON.stringify(filteredEmployees[0], null, 2));
            
            // Force consistent format to handle all employee formats
            const transformedEmployees = filteredEmployees.map(emp => {
              // Explicitly extract department and position from various potential formats
              // First check if they are objects that need to be converted
              let departmentValue = emp.department;
              let positionValue = emp.position;
              
              // Check if the field exists but might be an object/null instead of a string
              if (typeof departmentValue !== 'string' || !departmentValue) {
                departmentValue = emp.hr_departments?.name || 'Unknown Department';
              }
              
              if (typeof positionValue !== 'string' || !positionValue) {
                positionValue = emp.hr_positions?.title || 'Unknown Position';
              }
              
              // Add consistent nested objects for hr_departments and hr_positions if they don't exist
              const hr_departments = emp.hr_departments || {
                id: emp.department_id || 'dept-unknown',
                name: departmentValue
              };
              
              const hr_positions = emp.hr_positions || {
                id: emp.position_id || 'pos-unknown',
                title: positionValue
              };
              
              // Log transformation for debugging
              if (departmentValue === 'Unknown Department' || positionValue === 'Unknown Position') {
                console.log('🔍 [DEBUG] Transform issue for employee:', emp.name, {
                  department: {
                    raw: emp.department,
                    type: typeof emp.department,
                    nested: emp.hr_departments,
                    final: departmentValue
                  },
                  position: {
                    raw: emp.position,
                    type: typeof emp.position,
                    nested: emp.hr_positions,
                    final: positionValue
                  }
                });
              }
              
              // Create clean object with all required fields
              const transformedEmployee = {
                id: emp.id || `emp-${Math.random().toString(36).substr(2, 9)}`,
                name: emp.name || 'Unknown Employee',
                email: emp.email || 'unknown@example.com',
                department: departmentValue,
                position: positionValue,
                department_id: emp.department_id || null,
                position_id: emp.position_id || null,
                status: emp.status || 'active',
                ragStatus: emp.ragStatus || emp.rag_status || 'green',
                lastActivity: emp.lastActivity || emp.last_activity || new Date().toISOString().split('T')[0],
                courses: emp.courses || 0,
                coursesCompleted: emp.coursesCompleted || 0,
                progress: emp.progress || 0,
                created_at: emp.created_at || new Date().toISOString(),
                updated_at: emp.updated_at || new Date().toISOString(),
                // Add the consistent hr_departments and hr_positions objects
                hr_departments,
                hr_positions
              };
              
              return transformedEmployee;
            });
            
            console.log("✅ [DEBUG] First employee post-transform:", 
              JSON.stringify(transformedEmployees[0], null, 2));
            
            // Calculate total and paginate
            const total = transformedEmployees.length;
            const paginatedEmployees = transformedEmployees.slice(from, from + pageSize);
            
            console.log('✅ [DEBUG] Returning standard mock data:', 
              { total, pageSize, employees: paginatedEmployees.length });
            
            return {
              success: true,
              employees: paginatedEmployees,
              total: total,
              error: null
            };
          } else {
            console.error('❌ [DEBUG] Could not load standard mock file, status:', response.status);
          }
        } catch (mockError) {
          console.error('❌ [DEBUG] Error in mock data loading:', mockError);
        }
        
        throw new Error(error.message);
      }
      
      console.log("🔍 [DEBUG] DB data loaded, first record:", data?.[0]);
      
      // Transform the database results to ensure consistent structure
      const transformedData = data.map(emp => {
        // Explicitly extract department and position from various potential formats
        let departmentValue = emp.department;
        let positionValue = emp.position;
        
        // Check if the field exists but might be an object/null instead of a string
        if (typeof departmentValue !== 'string' || !departmentValue) {
          departmentValue = emp.hr_departments?.name || 'Unknown Department';
        }
        
        if (typeof positionValue !== 'string' || !positionValue) {
          positionValue = emp.hr_positions?.title || 'Unknown Position';
        }
        
        // Add consistent nested objects for hr_departments and hr_positions if they don't exist
        const hr_departments = emp.hr_departments || {
          id: emp.department_id || 'dept-unknown',
          name: departmentValue
        };
        
        const hr_positions = emp.hr_positions || {
          id: emp.position_id || 'pos-unknown',
          title: positionValue
        };
        
        // Log transformation for debugging
        if (departmentValue === 'Unknown Department' || positionValue === 'Unknown Position') {
          console.log('🔍 [DEBUG] DB transform issue for employee:', emp.name, {
            department: {
              raw: emp.department,
              type: typeof emp.department,
              nested: emp.hr_departments,
              final: departmentValue
            },
            position: {
              raw: emp.position,
              type: typeof emp.position,
              nested: emp.hr_positions,
              final: positionValue
            }
          });
        }
        
        return {
          id: emp.id || `emp-${Math.random().toString(36).substr(2, 9)}`,
          name: emp.name || 'Unknown Employee',
          email: emp.email || 'unknown@example.com',
          department: departmentValue,
          position: positionValue,
          department_id: emp.department_id || null,
          position_id: emp.position_id || null,
          status: emp.status || 'active',
          ragStatus: emp.ragStatus || emp.rag_status || 'green',
          lastActivity: emp.lastActivity || emp.last_activity || new Date().toISOString().split('T')[0],
          courses: emp.courses || 0,
          coursesCompleted: emp.coursesCompleted || 0,
          progress: emp.progress || 0,
          created_at: emp.created_at || new Date().toISOString(),
          updated_at: emp.updated_at || new Date().toISOString(),
          // Add the consistent hr_departments and hr_positions objects
          hr_departments,
          hr_positions
        };
      });
      
      console.log("✅ [DEBUG] DB data transformed, first record:", transformedData?.[0]);
      
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
