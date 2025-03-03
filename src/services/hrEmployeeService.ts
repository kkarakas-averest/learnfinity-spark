import { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

type Employee = Database['public']['Tables']['employees']['Row'];

export const hrEmployeeService = {
  /**
   * Initialize the HR system by creating necessary tables if they don't exist.
   * @returns {Promise<{ success: boolean; error?: any }>}
   */
  async initialize(): Promise<{ success: boolean; error?: any }> {
    try {
      // Check if the 'employees' table exists
      const { data: existingTable, error: tableError } = await supabase.from('employees').select('*').limit(1);

      if (tableError) {
        console.error('Error checking for existing employees table:', tableError);
        return { success: false, error: tableError };
      }

      // If the table doesn't exist, attempt to create it
      if (!existingTable) {
        console.log('Employees table does not exist. Attempting to create it...');

        // SQL script to create the 'employees' table
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS employees (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            name TEXT,
            email TEXT UNIQUE,
            phone TEXT,
            address TEXT,
            department TEXT,
            position TEXT,
            salary NUMERIC,
            hire_date DATE,
            last_activity TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            is_active BOOLEAN DEFAULT TRUE,
            profile_url TEXT NULL
          );
        `;

        const { error: createError } = await supabase.rpc('execute_sql', { sql: createTableSQL });

        if (createError) {
          console.error('Error creating employees table:', createError);
          return { success: false, error: createError };
        }

        console.log('Employees table created successfully.');
      } else {
        console.log('Employees table already exists. No action needed.');
      }

      return { success: true };
    } catch (error) {
      console.error('Error during HR system initialization:', error);
      return { success: false, error };
    }
  },

  /**
   * Fetch all employees from the database.
   * @returns {Promise<{ data: Employee[] | null; error: any | null }>}
   */
  async getAllEmployees(): Promise<{ data: Employee[] | null; error: any | null }> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    return { data, error };
  },

  /**
   * Get a single employee by ID.
   * @param {string} id - The ID of the employee to retrieve.
   * @returns {Promise<{ data: Employee | null; error: any | null }>}
   */
  async getEmployeeById(id: string): Promise<{ data: Employee | null; error: any | null }> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    return { data, error };
  },

  /**
   * Create a new employee.
   * @param {Partial<Employee>} employee - The employee data to insert.
   * @returns {Promise<{ data: Employee[] | null; error: any | null }>}
   */
  async createEmployee(employee: Partial<Employee>): Promise<{ data: Employee[] | null; error: any | null }> {
    const { data, error } = await supabase
      .from('employees')
      .insert([
        {
          ...employee,
          // Ensure these fields are provided during creation
          name: employee.name || 'Unknown',
          email: employee.email || 'no-email@example.com',
        },
      ])
      .select();

    return { data, error };
  },

  /**
   * Update an existing employee's data.
   * @param {string} id - The ID of the employee to update.
   * @param {Partial<Employee>} updatedEmployee - The updated employee data.
   * @returns {Promise<{ data: Employee[] | null; error: any | null }>}
   */
  async updateEmployee(id: string, updatedEmployee: Partial<Employee>): Promise<{ data: Employee[] | null; error: any | null }> {
    // Log the updatedEmployee object to check its contents
    console.log('Updating employee with ID:', id, 'with data:', updatedEmployee);

    const { data, error } = await supabase
      .from('employees')
      .update({
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        phone: updatedEmployee.phone,
        address: updatedEmployee.address,
        department: updatedEmployee.department,
        position: updatedEmployee.position,
        salary: updatedEmployee.salary,
        hire_date: updatedEmployee.hire_date,
        last_activity: updatedEmployee.lastActivity,
        is_active: updatedEmployee.is_active,
        profile_url: updatedEmployee.profile_url,
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating employee:', error);
    } else {
      console.log('Employee updated successfully. Result:', data);
    }

    return { data, error };
  },

  /**
   * Delete an employee by ID.
   * @param {string} id - The ID of the employee to delete.
   * @returns {Promise<{ error: any | null }>}
   */
  async deleteEmployee(id: string): Promise<{ error: any | null }> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    return { error };
  },

  /**
   * Update the activity timestamp of an employee.
   * @param {string} id - The ID of the employee to update.
   * @returns {Promise<{ data: Employee[] | null; error: any | null }>}
   */
  async updateEmployeeActivity(id: string): Promise<{ data: Employee[] | null; error: any | null }> {
    const { data, error } = await supabase
      .from('employees')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', id)
      .select();

    return { data, error };
  },
};
