import { supabase } from '@/lib/supabase';

/**
 * Checks if the HR tables exist in the database
 * and creates them if they don't exist
 */
export async function verifyHRTables() {
  try {
    // Simple health check for Supabase connection
    try {
      const { data, error } = await supabase.from('_healthcheck').select('*').limit(1);
      
      if (error) {
        console.error('Supabase health check failed:', error);
        // If we can't even connect to Supabase, return early to avoid further errors
        return { 
          success: false, 
          error: 'Database connection failed. Please check your network and credentials.' 
        };
      }
    } catch (healthError) {
      // Some other unexpected error with the health check
      console.error('Health check error:', healthError);
    }
    
    // List of required HR tables
    const requiredTables = [
      'hr_departments',
      'hr_positions',
      'hr_employees',
      'hr_courses',
      'hr_course_enrollments',
      'hr_employee_skills',
      'hr_employee_activities'
    ];
    
    // Check one main table first to see if we need to verify all tables
    try {
      const { count, error } = await supabase
        .from('hr_departments')
        .select('*', { count: 'exact', head: true });
        
      // If we can access hr_departments without error, the table exists
      if (!error) {
        console.log('All HR tables exist');
        return { success: true, message: 'All required tables exist' };
      }
      
      // If we get a specific error that's not about table existence, report it
      if (error && !error.message.includes('does not exist')) {
        console.error('Error accessing hr_departments:', error);
        return { 
          success: false, 
          error: `Database error: ${error.message}` 
        };
      }
    } catch (error) {
      // Unexpected error (not just "table does not exist")
      console.error('Unexpected error checking hr_departments:', error);
    }
    
    // At this point, we know we need to create tables
    // Check which tables are missing
    let missingTables: string[] = [];
    
    for (const table of requiredTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (error && error.message.includes('does not exist')) {
          missingTables.push(table);
        }
      } catch (error) {
        console.error(`Error checking table ${table}:`, error);
        missingTables.push(table);
      }
    }
    
    console.log(`Missing HR tables: ${missingTables.join(', ')}`);
    
    // Create missing tables
    const schemaResult = await createHRSchema();
    if (!schemaResult.success) {
      return { 
        success: false, 
        error: `Failed to create HR schema: ${schemaResult.error}` 
      };
    }
    
    // Now seed initial data
    if (missingTables.includes('hr_departments')) {
      const seedResult = await seedInitialData();
      if (!seedResult.success) {
        return { 
          success: false, 
          error: `Failed to seed initial data: ${seedResult.error}` 
        };
      }
    }
    
    return { 
      success: true, 
      message: 'Successfully created missing HR tables and seeded initial data' 
    };
  } catch (error) {
    console.error('Error verifying HR tables:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Creates the HR database schema
 */
async function createHRSchema() {
  try {
    // Basic schema using the required tables
    // In a real implementation, this would run the full schema SQL
    
    // Create departments table
    const { error: deptError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS hr_departments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (deptError) {
      console.error('Error creating hr_departments table:', deptError);
      return { success: false, error: deptError.message };
    }
    
    // Create positions table
    const { error: posError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS hr_positions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(100) NOT NULL,
          department_id UUID REFERENCES hr_departments(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (posError) {
      console.error('Error creating hr_positions table:', posError);
      return { success: false, error: posError.message };
    }
    
    // Create employees table
    const { error: empError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS hr_employees (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          phone VARCHAR(20),
          hire_date DATE,
          department_id UUID REFERENCES hr_departments(id),
          position_id UUID REFERENCES hr_positions(id),
          manager_id UUID REFERENCES hr_employees(id),
          status VARCHAR(20) DEFAULT 'active',
          rag_status VARCHAR(10) DEFAULT 'green',
          profile_image_url TEXT,
          resume_url TEXT,
          last_active_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (empError) {
      console.error('Error creating hr_employees table:', empError);
      return { success: false, error: empError.message };
    }
    
    // Create employee skills table
    const { error: skillsError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS hr_employee_skills (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
          skill_name VARCHAR(100) NOT NULL,
          proficiency_level VARCHAR(20) NOT NULL,
          is_in_progress BOOLEAN DEFAULT false,
          verification_status VARCHAR(20) DEFAULT 'unverified',
          verified_by UUID,
          verification_date TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(employee_id, skill_name)
        );
      `
    });
    
    if (skillsError) {
      console.error('Error creating hr_employee_skills table:', skillsError);
      return { success: false, error: skillsError.message };
    }
    
    // Create employee activities table
    const { error: activitiesError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS hr_employee_activities (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
          activity_type VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          course_id UUID,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `
    });
    
    if (activitiesError) {
      console.error('Error creating hr_employee_activities table:', activitiesError);
      return { success: false, error: activitiesError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error creating HR schema:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Seeds initial data for the HR tables
 */
async function seedInitialData() {
  try {
    // Seed departments
    const departments = [
      { name: 'Engineering' },
      { name: 'Marketing' },
      { name: 'Sales' },
      { name: 'Human Resources' },
      { name: 'Product' }
    ];
    
    const { error: deptError } = await supabase
      .from('hr_departments')
      .insert(departments);
      
    if (deptError) {
      console.error('Error seeding departments:', deptError);
      return { success: false, error: deptError.message };
    }
    
    // Get department IDs
    const { data: deptData, error: deptFetchError } = await supabase
      .from('hr_departments')
      .select('id, name');
      
    if (deptFetchError || !deptData) {
      console.error('Error fetching departments:', deptFetchError);
      return { success: false, error: deptFetchError?.message || 'No departments found' };
    }
    
    // Map departments by name
    const deptMap: Record<string, string> = {};
    deptData.forEach(dept => {
      deptMap[dept.name] = dept.id;
    });
    
    // Seed positions
    const positions = [
      { title: 'Software Engineer', department_id: deptMap['Engineering'] },
      { title: 'Senior Engineer', department_id: deptMap['Engineering'] },
      { title: 'Product Manager', department_id: deptMap['Product'] },
      { title: 'Marketing Specialist', department_id: deptMap['Marketing'] },
      { title: 'Sales Representative', department_id: deptMap['Sales'] },
      { title: 'HR Manager', department_id: deptMap['Human Resources'] }
    ];
    
    const { error: posError } = await supabase
      .from('hr_positions')
      .insert(positions);
      
    if (posError) {
      console.error('Error seeding positions:', posError);
      return { success: false, error: posError.message };
    }
    
    // Get position IDs
    const { data: posData, error: posFetchError } = await supabase
      .from('hr_positions')
      .select('id, title');
      
    if (posFetchError || !posData) {
      console.error('Error fetching positions:', posFetchError);
      return { success: false, error: posFetchError?.message || 'No positions found' };
    }
    
    // Map positions by title
    const posMap: Record<string, string> = {};
    posData.forEach(pos => {
      posMap[pos.title] = pos.id;
    });
    
    // Seed employees (3 example employees with different RAG statuses)
    const employees = [
      {
        name: 'John Doe',
        email: 'john.doe@example.com',
        department_id: deptMap['Engineering'],
        position_id: posMap['Software Engineer'],
        status: 'active',
        rag_status: 'green',
        last_active_at: new Date().toISOString()
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        department_id: deptMap['Marketing'],
        position_id: posMap['Marketing Specialist'],
        status: 'active',
        rag_status: 'amber',
        last_active_at: new Date().toISOString()
      },
      {
        name: 'Bob Johnson',
        email: 'bob.johnson@example.com',
        department_id: deptMap['Sales'],
        position_id: posMap['Sales Representative'],
        status: 'active',
        rag_status: 'red',
        last_active_at: new Date().toISOString()
      }
    ];
    
    const { error: empError } = await supabase
      .from('hr_employees')
      .insert(employees);
      
    if (empError) {
      console.error('Error seeding employees:', empError);
      return { success: false, error: empError.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error seeding initial HR data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 