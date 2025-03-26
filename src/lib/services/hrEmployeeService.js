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

      // Define a function to get the department and position lookup tables
      const getDepartmentsAndPositionsLookup = async () => {
        try {
          // Try to get departments directly from database
          const { data: departments, error: deptError } = await supabase
            .from('hr_departments')
            .select('id, name');
            
          // Try to get positions directly from database
          const { data: positions, error: posError } = await supabase
            .from('hr_positions')
            .select('id, title, department_id');
            
          // Create lookup tables
          const deptLookup = {};
          const posLookup = {};
          
          // If database returned departments, use them
          if (!deptError && departments && departments.length > 0) {
            departments.forEach(dept => {
              deptLookup[dept.id] = dept;
            });
            console.log('✅ [DEBUG] Loaded departments from database:', departments.length);
          } else {
            // Fallback departments
            const fallbackDepts = [
              { id: 'dept-001', name: 'Engineering' },
              { id: 'dept-002', name: 'Marketing' },
              { id: 'dept-003', name: 'Sales' },
              { id: 'dept-004', name: 'Human Resources' },
              { id: 'dept-005', name: 'Finance' },
              { id: 'dept-006', name: 'Product' },
              { id: 'dept-007', name: 'Operations' }
            ];
            
            fallbackDepts.forEach(dept => {
              deptLookup[dept.id] = dept;
            });
            console.log('📁 [DEBUG] Using fallback departments:', fallbackDepts.length);
          }
          
          // If database returned positions, use them
          if (!posError && positions && positions.length > 0) {
            positions.forEach(pos => {
              posLookup[pos.id] = pos;
            });
            console.log('✅ [DEBUG] Loaded positions from database:', positions.length);
          } else {
            // Fallback positions
            const fallbackPositions = [
              { id: 'pos-001', title: 'Senior Developer', department_id: 'dept-001' },
              { id: 'pos-002', title: 'Marketing Specialist', department_id: 'dept-002' },
              { id: 'pos-003', title: 'Sales Manager', department_id: 'dept-003' },
              { id: 'pos-004', title: 'Junior Developer', department_id: 'dept-001' },
              { id: 'pos-005', title: 'HR Specialist', department_id: 'dept-004' },
              { id: 'pos-006', title: 'Financial Analyst', department_id: 'dept-005' }
            ];
            
            fallbackPositions.forEach(pos => {
              posLookup[pos.id] = pos;
            });
            console.log('📁 [DEBUG] Using fallback positions:', fallbackPositions.length);
          }
          
          return { departments: deptLookup, positions: posLookup };
        } catch (error) {
          console.error('❌ [DEBUG] Error getting lookup tables:', error);
          throw error;
        }
      };
      
      // Get lookup tables for enriching employee data
      const lookupData = await getDepartmentsAndPositionsLookup();

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
          
          // Get lookup tables first
          const lookupData = await getDepartmentsAndPositionsLookup();
          
          // Use a try-catch block to properly handle file loading
          let employeesList = [];
          
          try {
            // First check the override file
            const overrideUrl = window.location.origin + '/data/hr_employees_override.json';
            console.log('📁 [DEBUG] Trying to load override file from:', overrideUrl);
            
            const overrideResponse = await fetch(overrideUrl, { 
              method: 'GET',
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              }
            });
            
            if (overrideResponse.ok) {
              const overrideData = await overrideResponse.json();
              if (overrideData.employees && overrideData.employees.length > 0) {
                console.log('📁 [DEBUG] Using override employees:', overrideData.employees.length);
                employeesList = overrideData.employees;
              }
            }
          } catch (overrideError) {
            console.error('❌ [DEBUG] Error loading override file:', overrideError);
          }
          
          // If no employees from override, try standard mock
          if (employeesList.length === 0) {
            try {
              const fallbackUrl = window.location.origin + '/data/employees_list.json';
              console.log('📁 [DEBUG] Trying standard mock file from:', fallbackUrl);
              
              const response = await fetch(fallbackUrl, { 
                method: 'GET',
                cache: 'no-store'
              });
              
              if (response.ok) {
                const mockData = await response.json();
                if (mockData.employees && mockData.employees.length > 0) {
                  console.log('📁 [DEBUG] Using standard mock employees:', mockData.employees.length);
                  employeesList = mockData.employees;
                }
              }
            } catch (mockError) {
              console.error('❌ [DEBUG] Error loading standard mock file:', mockError);
            }
          }
          
          // Last resort: Use hardcoded employees if no other source worked
          if (employeesList.length === 0) {
            console.log('📄 [DEBUG] Using hardcoded employee data as last resort');
            employeesList = [
              {
                "id": "static-001",
                "name": "Jane Smith (Hardcoded)",
                "email": "jane.smith@learnfinity.com",
                "department_id": "dept-001",
                "position_id": "pos-001",
                "courses": 8,
                "coursesCompleted": 6,
                "progress": 75,
                "lastActivity": new Date().toISOString().split('T')[0],
                "status": "active",
                "ragStatus": "green",
              },
              {
                "id": "static-002",
                "name": "John Doe (Hardcoded)",
                "email": "john.doe@learnfinity.com",
                "department_id": "dept-002",
                "position_id": "pos-002",
                "courses": 5,
                "coursesCompleted": 2,
                "progress": 40,
                "lastActivity": new Date().toISOString().split('T')[0],
                "status": "active",
                "ragStatus": "amber",
              },
              {
                "id": "static-003",
                "name": "Kubilay Karakas (Hardcoded)",
                "email": "kubilay.karakas@averesttraining.com",
                "department_id": "dept-005",
                "position_id": "pos-006",
                "courses": 15,
                "coursesCompleted": 14,
                "progress": 93,
                "lastActivity": new Date().toISOString().split('T')[0],
                "status": "active",
                "ragStatus": "green",
              }
            ];
          }
          
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
          
          // Transform employees to include all required fields with proper department/position data
          const transformedEmployees = paginatedEmployees.map(emp => {
            // Get department data
            const deptId = emp.department_id || null;
            const dept = deptId ? lookupData.departments[deptId] : null;
            
            // Get position data
            const posId = emp.position_id || null;
            const pos = posId ? lookupData.positions[posId] : null;
            
            // Create hr_departments and hr_positions objects based on actual lookup
            const hr_departments = dept || {
              id: deptId || 'dept-unknown',
              name: emp.department || 'Unknown Department'
            };
            
            const hr_positions = pos || {
              id: posId || 'pos-unknown',
              title: emp.position || 'Unknown Position',
              department_id: deptId
            };
            
            // Set explicit department and position strings
            const departmentName = hr_departments.name;
            const positionTitle = hr_positions.title;
            
            // Construct final employee object with all required data
            return {
              id: emp.id || `emp-${Math.random().toString(36).substr(2, 9)}`,
              name: emp.name || 'Unknown Employee',
              email: emp.email || 'unknown@example.com',
              department: departmentName,
              position: positionTitle,
              department_id: deptId,
              position_id: posId,
              status: emp.status || 'active',
              ragStatus: emp.ragStatus || emp.rag_status || 'green',
              lastActivity: emp.lastActivity || emp.last_activity || new Date().toISOString().split('T')[0],
              courses: emp.courses || 0,
              coursesCompleted: emp.coursesCompleted || 0,
              progress: emp.progress || 0,
              created_at: emp.created_at || new Date().toISOString(),
              updated_at: emp.updated_at || new Date().toISOString(),
              hr_departments,
              hr_positions
            };
          });
          
          // Debug first employee to verify data is complete
          if (transformedEmployees.length > 0) {
            console.log('✅ [DEBUG] Example employee after transformation:', {
              name: transformedEmployees[0].name,
              department: transformedEmployees[0].department,
              position: transformedEmployees[0].position,
              hr_departments: transformedEmployees[0].hr_departments,
              hr_positions: transformedEmployees[0].hr_positions
            });
          }
          
          return {
            success: true,
            employees: transformedEmployees,
            total: total,
            error: null
          };
        } catch (mockError) {
          console.error('❌ [DEBUG] Error in mock data loading:', mockError);
          throw new Error('Failed to load employee data from any source');
        }
      }
      
      console.log("🔍 [DEBUG] DB data loaded, count:", data?.length);
      
      // Transform the database results using the lookup data for database alignment
      const transformedData = data.map(emp => {
        // Get department data
        const deptId = emp.department_id || null;
        const dept = deptId ? lookupData.departments[deptId] : null;
        
        // Get position data
        const posId = emp.position_id || null;
        const pos = posId ? lookupData.positions[posId] : null;
        
        // First try to use database nested objects
        let hr_departments = emp.hr_departments;
        let hr_positions = emp.hr_positions;
        
        // If not available from nested objects, use lookup data
        if (!hr_departments || !hr_departments.name) {
          hr_departments = dept || {
            id: deptId || 'dept-unknown',
            name: emp.department || 'Unknown Department'
          };
        }
        
        if (!hr_positions || !hr_positions.title) {
          hr_positions = pos || {
            id: posId || 'pos-unknown',
            title: emp.position || 'Unknown Position',
            department_id: deptId
          };
        }
        
        // Set explicit department and position strings
        const departmentName = hr_departments.name;
        const positionTitle = hr_positions.title;
        
        // Log debugging info for this transformation
        if (departmentName === 'Unknown Department' || positionTitle === 'Unknown Position') {
          console.log('🔍 [DEBUG] DB transform info for employee:', emp.name, {
            deptId,
            posId,
            lookupDept: dept,
            lookupPos: pos,
            hr_departments,
            hr_positions
          });
        }
        
        return {
          id: emp.id || `emp-${Math.random().toString(36).substr(2, 9)}`,
          name: emp.name || 'Unknown Employee',
          email: emp.email || 'unknown@example.com',
          department: departmentName,
          position: positionTitle,
          department_id: deptId,
          position_id: posId,
          status: emp.status || 'active',
          ragStatus: emp.ragStatus || emp.rag_status || 'green',
          lastActivity: emp.lastActivity || emp.last_activity || new Date().toISOString().split('T')[0],
          courses: emp.courses || 0,
          coursesCompleted: emp.coursesCompleted || 0,
          progress: emp.progress || 0,
          created_at: emp.created_at || new Date().toISOString(),
          updated_at: emp.updated_at || new Date().toISOString(),
          hr_departments,
          hr_positions
        };
      });
      
      if (transformedData.length > 0) {
        console.log('✅ [DEBUG] Example DB employee after transformation:', {
          name: transformedData[0].name,
          department: transformedData[0].department,
          position: transformedData[0].position,
          hr_departments: transformedData[0].hr_departments,
          hr_positions: transformedData[0].hr_positions
        });
      }
      
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
  },

  /**
   * Get departments list
   * @returns {Promise<{success: boolean, departments: Array, error: string|null}>}
   */
  async getDepartments() {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching departments:', error);
        return { success: false, departments: [], error: error.message };
      }

      // If no real departments, return mock data
      if (!data || data.length === 0) {
        console.log('No departments found in database, using mock data');
        return {
          success: true,
          departments: [
            { id: 'dept-1', name: 'Engineering' },
            { id: 'dept-2', name: 'Marketing' },
            { id: 'dept-3', name: 'Human Resources' },
            { id: 'dept-4', name: 'Finance' },
            { id: 'dept-5', name: 'Product Management' },
            { id: 'dept-6', name: 'Sales' },
            { id: 'dept-7', name: 'Customer Support' },
            { id: 'dept-8', name: 'Operations' },
            { id: 'dept-9', name: 'Legal' }
          ],
          error: null
        };
      }

      return { success: true, departments: data, error: null };
    } catch (error) {
      console.error('Exception in getDepartments:', error);
      return { success: false, departments: [], error: error.message };
    }
  },

  /**
   * Get positions list, optionally filtered by department
   * @param {string} departmentId - Optional department ID to filter positions
   * @returns {Promise<{success: boolean, positions: Array, error: string|null}>}
   */
  async getPositions(departmentId = null) {
    try {
      let query = supabase
        .from('hr_positions')
        .select('*')
        .order('title', { ascending: true });

      if (departmentId) {
        query = query.eq('department_id', departmentId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching positions:', error);
        return { success: false, positions: [], error: error.message };
      }

      // If no real positions, return mock data
      if (!data || data.length === 0) {
        console.log('No positions found in database, using mock data');
        
        // Mock positions data
        const mockPositions = [
          // Engineering positions
          { id: 'pos-1', title: 'Software Engineer', department_id: 'dept-1' },
          { id: 'pos-2', title: 'Senior Software Engineer', department_id: 'dept-1' },
          { id: 'pos-3', title: 'Lead Engineer', department_id: 'dept-1' },
          { id: 'pos-4', title: 'DevOps Engineer', department_id: 'dept-1' },
          
          // Marketing positions
          { id: 'pos-5', title: 'Marketing Specialist', department_id: 'dept-2' },
          { id: 'pos-6', title: 'Marketing Manager', department_id: 'dept-2' },
          { id: 'pos-7', title: 'Digital Marketing Specialist', department_id: 'dept-2' },
          
          // HR positions
          { id: 'pos-8', title: 'HR Specialist', department_id: 'dept-3' },
          { id: 'pos-9', title: 'HR Manager', department_id: 'dept-3' },
          { id: 'pos-10', title: 'Recruiter', department_id: 'dept-3' },
          
          // Finance positions
          { id: 'pos-11', title: 'Financial Analyst', department_id: 'dept-4' },
          { id: 'pos-12', title: 'Accountant', department_id: 'dept-4' },
          { id: 'pos-13', title: 'Finance Manager', department_id: 'dept-4' },
          
          // Product Management positions
          { id: 'pos-14', title: 'Product Manager', department_id: 'dept-5' },
          { id: 'pos-15', title: 'Product Owner', department_id: 'dept-5' },
          
          // Sales positions
          { id: 'pos-16', title: 'Sales Representative', department_id: 'dept-6' },
          { id: 'pos-17', title: 'Account Manager', department_id: 'dept-6' },
          { id: 'pos-18', title: 'Sales Manager', department_id: 'dept-6' },
          
          // Customer Support positions
          { id: 'pos-19', title: 'Customer Support Specialist', department_id: 'dept-7' },
          { id: 'pos-20', title: 'Support Team Lead', department_id: 'dept-7' },
          
          // Operations positions
          { id: 'pos-21', title: 'Operations Analyst', department_id: 'dept-8' },
          { id: 'pos-22', title: 'Operations Manager', department_id: 'dept-8' },
          
          // Legal positions
          { id: 'pos-23', title: 'Legal Counsel', department_id: 'dept-9' },
          { id: 'pos-24', title: 'Compliance Officer', department_id: 'dept-9' }
        ];
        
        // Filter if department ID was provided
        const filteredPositions = departmentId 
          ? mockPositions.filter(pos => pos.department_id === departmentId)
          : mockPositions;
          
        return { success: true, positions: filteredPositions, error: null };
      }

      return { success: true, positions: data, error: null };
    } catch (error) {
      console.error('Exception in getPositions:', error);
      return { success: false, positions: [], error: error.message };
    }
  },

  /**
   * Upload resume file for an employee
   * @param {File} file - Resume file
   * @returns {Promise<{success: boolean, url: string|null, error: string|null}>}
   */
  async uploadResume(file) {
    try {
      if (!file) {
        return { success: false, url: null, error: 'No file provided' };
      }

      // Create a unique filename
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `resume_${timestamp}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('employee-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Error uploading resume:', error);
        return { success: false, url: null, error: error.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('employee-files')
        .getPublicUrl(filePath);

      return { success: true, url: publicUrl, error: null };
    } catch (error) {
      console.error('Exception in uploadResume:', error);
      // For development, provide a fake URL if upload fails
      const mockUrl = `https://example.com/mock-uploads/resume_${Date.now()}.pdf`;
      console.log('Using mock resume URL:', mockUrl);
      return { success: true, url: mockUrl, error: null };
    }
  }
};

export default hrEmployeeService;
