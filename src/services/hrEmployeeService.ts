import { supabase } from "@/lib/supabase";
import { Employee } from "@/types/hr.types";

export const hrEmployeeService = {
  getEmployees: async () => {
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching employees:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error in getEmployees:", error);
      return { data: null, error: "Failed to fetch employees" };
    }
  },

  getEmployeeById: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error("Error fetching employee by ID:", error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error in getEmployeeById:", error);
      return { data: null, error: "Failed to fetch employee by ID" };
    }
  },

  createEmployeeFromJSON: async (employeeJSON: any) => {
    try {
      // Destructure the employee data from the JSON object
      const {
        name,
        email,
        departmentId,
        positionId,
        status,
        companyId,
        resumeFile,
        courseIds
      } = employeeJSON;
      
      // Validate required fields
      if (!name || !email || !departmentId) {
        throw new Error('Name, email, and departmentId are required fields.');
      }
      
      // Prepare the employee data for insertion
      const employeeData = {
        first_name: name.split(' ')[0],
        last_name: name.split(' ').slice(1).join(' ') || 'N/A',
        email: email,
        department: departmentId,
        position: positionId || null,
        status: status || 'active',
        company_id: companyId || null,
        course_ids: courseIds || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Attempt to create the employee record in Supabase
      const { data: employee, error: employeeError } = await supabase
        .from('hr_employees')
        .insert([employeeData])
        .select()
        .single();
      
      if (employeeError) {
        console.error('Error creating employee:', employeeError);
        return { data: null, error: employeeError };
      }
      
      // If resume file is provided, process it
      if (resumeFile) {
        console.log('Resume file detected, but processing is not implemented.');
      }
      
      // Generate a random password for the new user
      const password = Math.random().toString(36).slice(-8);
      
      // Attempt to create a user account in Supabase Auth
      const { data: userAccount, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            name: name,
            role: 'learner'
          }
        }
      });
      
      if (authError) {
        console.error('Auth error during sign up:', authError);
        return { data: employee, error: null, userAccount: null, authError: authError };
      }
      
      // Return the created employee data and the new user account
      return { data: employee, error: null, userAccount: { email: email, password: password }, authError: null };
    } catch (error) {
      console.error('Error in createEmployeeFromJSON:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to create employee', userAccount: null, authError: null };
    }
  },

  updateEmployeeById: async (id: string, employee: Partial<Employee>) => {
    try {
      const employeeUpdates: any = {};
      
      // Convert departmentId to department if provided
      if (employee.department) {
        employeeUpdates.department = employee.department;
      }
      
      // Convert positionId to position if provided
      if (employee.position) {
        employeeUpdates.position = employee.position;
      }
      
      // Format dates properly if provided
      if (employee.hire_date) {
        employeeUpdates.hire_date = employee.hire_date;
      }
      
      // Add any other fields from the employee object
      for (const [key, value] of Object.entries(employee)) {
        if (!['departmentId', 'positionId', 'hireDate', 'lastActivityDate'].includes(key)) {
          employeeUpdates[key] = value;
        }
      }
      
      // Update the timestamp
      employeeUpdates.updated_at = new Date().toISOString();
      
      // Update in Supabase
      const { data, error } = await supabase
        .from('hr_employees')
        .update(employeeUpdates)
        .eq('id', id)
        .select();
        
      if (error) throw error;
      
      console.log(`Updated employee ${id}:`, data);
      
      return { data: data?.[0], error: null };
    } catch (error) {
      console.error(`Error updating employee ${id}:`, error);
      return { 
        data: null, 
        error: error instanceof Error 
          ? error.message 
          : "Unknown error occurred while updating employee" 
      };
    }
  },

  deleteEmployeeById: async (id: string) => {
    try {
      const { error } = await supabase
        .from('hr_employees')
        .delete()
        .eq('id', id);

      if (error) {
        console.error("Error deleting employee:", error);
        return { success: false, error: error.message };
      }

      console.log(`Deleted employee ${id}`);
      return { success: true, error: null };
    } catch (error) {
      console.error("Error in deleteEmployeeById:", error);
      return { success: false, error: "Failed to delete employee" };
    }
  },
  
  checkHRTablesExist: async () => {
    try {
      const tablesToCheck = ['hr_employees', 'hr_departments', 'hr_positions'];
      const missingTables: string[] = [];
      
      for (const table of tablesToCheck) {
        const { error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
          
        if (error) {
          missingTables.push(table);
        }
      }
      
      const exists = missingTables.length === 0;
      return { exists, missingTables };
    } catch (error) {
      console.error("Error checking HR tables:", error);
      return { exists: false, missingTables: ['hr_employees', 'hr_departments', 'hr_positions'] };
    }
  },
  
  seedSampleData: async () => {
    try {
      // Check if there are any existing departments
      const { data: existingDepartments, error: existingDepartmentsError } = await supabase
        .from('hr_departments')
        .select('id')
        .limit(1);
        
      if (existingDepartmentsError) {
        console.error('Error checking existing departments:', existingDepartmentsError);
        throw existingDepartmentsError;
      }
      
      if (existingDepartments && existingDepartments.length > 0) {
        console.log('Sample data already exists. Skipping seeding.');
        return { success: true };
      }
      
      // Insert sample departments
      const { data: departments, error: departmentsError } = await supabase
        .from('hr_departments')
        .insert([
          { name: 'Engineering', code: 'ENG', description: 'Software and hardware development' },
          { name: 'Human Resources', code: 'HR', description: 'Employee management and relations' },
          { name: 'Marketing', code: 'MKT', description: 'Promotion and advertising' },
        ])
        .select();
        
      if (departmentsError) {
        console.error('Error seeding departments:', departmentsError);
        throw departmentsError;
      }
      
      // Insert sample positions
      const { data: positions, error: positionsError } = await supabase
        .from('hr_positions')
        .insert([
          { title: 'Software Engineer', department_id: departments[0].id, level: 'Mid' },
          { title: 'HR Manager', department_id: departments[1].id, level: 'Senior' },
          { title: 'Marketing Specialist', department_id: departments[2].id, level: 'Junior' },
        ])
        .select();
        
      if (positionsError) {
        console.error('Error seeding positions:', positionsError);
        throw positionsError;
      }
      
      // Insert sample employees
      const { data: employees, error: employeesError } = await supabase
        .from('hr_employees')
        .insert([
          {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            department: 'Engineering',
            position: 'Software Engineer',
            hire_date: new Date(),
          },
          {
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@example.com',
            department: 'Human Resources',
            position: 'HR Manager',
            hire_date: new Date(),
          },
        ])
        .select();
        
      if (employeesError) {
        console.error('Error seeding employees:', employeesError);
        throw employeesError;
      }
      
      console.log('Sample data seeded successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error seeding sample data:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to seed sample data' };
    }
  },
  
  testMinimalApiRequest: async () => {
    try {
      console.log('Starting minimal API test...');
      
      // Await a very simple Supabase query
      const { data, error, status, statusText } = await supabase
        .from('hr_departments')
        .select('id, name')
        .limit(1);
      
      // Check for errors
      if (error) {
        console.error('API test query failed:', error);
        return { 
          success: false, 
          error, 
          status,
          statusText,
          responseText: `Error: ${error.message} (Status: ${status} ${statusText})`
        };
      }
      
      // If no data is returned, it might indicate a configuration issue
      if (!data || data.length === 0) {
        const message = 'No data returned. Possible misconfiguration.';
        console.warn(message);
        return { 
          success: false, 
          error: new Error(message),
          status,
          statusText,
          responseText: `Warning: ${message} (Status: ${status} ${statusText})`
        };
      }
      
      console.log('API test successful, data received:', data);
      return { 
        success: true, 
        data,
        status,
        statusText,
        responseText: `Success: Data received (Status: ${status} ${statusText})`
      };
    } catch (error) {
      console.error('API test failed with exception:', error);
      return { 
        success: false, 
        error,
        status: 500,
        statusText: 'Internal Server Error',
        responseText: `Exception: ${error.message || 'Unknown error'}`
      };
    }
  }
}
