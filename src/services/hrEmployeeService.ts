
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

// Define Employee type based on the database schema
export type Employee = {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  department?: string;
  position?: string;
  hire_date?: string;
  status?: 'active' | 'inactive' | 'onboarding' | 'terminated' | 'leave';
  manager_id?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  birth_date?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  skills?: string[];
  certifications?: string[];
  photo_url?: string;
  notes?: string;
  last_activity?: string;
  created_at?: string;
  updated_at?: string;
};

// Define EmployeeStats type
export type EmployeeStats = {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  newHires: number;
  departments: { name: string; count: number }[];
};

export const hrEmployeeService = {
  // Get all employees
  getAllEmployees: async (): Promise<Employee[]> => {
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select('*')
        .order('last_name', { ascending: true });
      
      if (error) throw new Error(error.message);
      return data || [];
    } catch (error) {
      console.error("Error fetching employees:", error);
      return [];
    }
  },
  
  // Get employee by ID
  getEmployeeById: async (id: string): Promise<Employee | null> => {
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      console.error(`Error fetching employee ${id}:`, error);
      return null;
    }
  },
  
  // Create new employee
  createEmployee: async (employee: Omit<Employee, 'id'>): Promise<Employee | null> => {
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .insert([employee])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      console.error("Error creating employee:", error);
      return null;
    }
  },
  
  // Update employee
  updateEmployee: async (id: string, updates: Partial<Employee>): Promise<Employee | null> => {
    try {
      // Convert department and position IDs to names if needed
      if (updates.department) {
        updates.department = updates.department;
      }
      
      if (updates.position) {
        updates.position = updates.position;
      }
      
      // Format dates correctly
      if (updates.hire_date) {
        updates.hire_date = updates.hire_date;
      }
      
      const { data, error } = await supabase
        .from('hr_employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      console.error(`Error updating employee ${id}:`, error);
      return null;
    }
  },
  
  // Delete employee
  deleteEmployee: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('hr_employees')
        .delete()
        .eq('id', id);
      
      if (error) throw new Error(error.message);
      return true;
    } catch (error) {
      console.error(`Error deleting employee ${id}:`, error);
      return false;
    }
  },
  
  // Search employees
  searchEmployees: async (query: string): Promise<Employee[]> => {
    try {
      const { data, error } = await supabase
        .from('hr_employees')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`);
      
      if (error) throw new Error(error.message);
      return data || [];
    } catch (error) {
      console.error(`Error searching employees for "${query}":`, error);
      return [];
    }
  },
  
  // Get employee statistics
  getEmployeeStats: async (): Promise<EmployeeStats> => {
    try {
      // Convert department and position IDs to names if needed
      if (updates.department) {
        updates.department = updates.department;
      }
      
      if (updates.position) {
        updates.position = updates.position;
      }
      
      // Format dates correctly
      if (updates.last_activity) {
        updates.last_activity = updates.last_activity;
      }
      
      // Get total employees count
      const { count: totalCount, error: countError } = await supabase
        .from('hr_employees')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw new Error(countError.message);
      
      // Get active employees count
      const { count: activeCount, error: activeError } = await supabase
        .from('hr_employees')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (activeError) throw new Error(activeError.message);
      
      // Get inactive employees count
      const { count: inactiveCount, error: inactiveError } = await supabase
        .from('hr_employees')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'active');
      
      if (inactiveError) throw new Error(inactiveError.message);
      
      // Get new hires count (hired in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: newHiresCount, error: newHiresError } = await supabase
        .from('hr_employees')
        .select('*', { count: 'exact', head: true })
        .gte('hire_date', thirtyDaysAgo.toISOString().split('T')[0]);
      
      if (newHiresError) throw new Error(newHiresError.message);
      
      // Get department counts
      const { data: deptData, error: deptError } = await supabase
        .from('hr_employees')
        .select('department');
      
      if (deptError) throw new Error(deptError.message);
      
      const departments: Record<string, number> = {};
      deptData.forEach(emp => {
        const dept = emp.department || 'Unassigned';
        departments[dept] = (departments[dept] || 0) + 1;
      });
      
      const deptCounts = Object.entries(departments).map(([name, count]) => ({ name, count }));
      
      return {
        totalEmployees: totalCount || 0,
        activeEmployees: activeCount || 0,
        inactiveEmployees: inactiveCount || 0,
        newHires: newHiresCount || 0,
        departments: deptCounts
      };
    } catch (error) {
      console.error("Error getting employee statistics:", error);
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        inactiveEmployees: 0,
        newHires: 0,
        departments: []
      };
    }
  },
  
  // Seed sample data
  seedSampleData: async (): Promise<void> => {
    try {
      // Check if we already have data
      const { count, error: countError } = await supabase
        .from('hr_employees')
        .select('*', { count: 'exact', head: true });
      
      if (countError) throw new Error(countError.message);
      
      if (count && count > 0) {
        console.log('Sample HR data already exists, skipping seed');
        return;
      }
      
      // Create sample departments
      const departments = [
        { name: 'Engineering', code: 'ENG', description: 'Software development and engineering' },
        { name: 'Marketing', code: 'MKT', description: 'Marketing and brand management' },
        { name: 'Sales', code: 'SLS', description: 'Sales and account management' },
        { name: 'Human Resources', code: 'HR', description: 'HR and talent acquisition' }
      ];
      
      for (const dept of departments) {
        await supabase.from('hr_departments').insert(dept);
      }
      
      // Create sample positions
      const positions = [
        { title: 'Software Engineer', department_id: 'Engineering', level: 'Mid-level' },
        { title: 'Senior Software Engineer', department_id: 'Engineering', level: 'Senior' },
        { title: 'Marketing Specialist', department_id: 'Marketing', level: 'Mid-level' },
        { title: 'Sales Representative', department_id: 'Sales', level: 'Junior' },
        { title: 'HR Coordinator', department_id: 'Human Resources', level: 'Mid-level' }
      ];
      
      for (const position of positions) {
        await supabase.from('hr_positions').insert(position);
      }
      
      // Create sample employees
      const employees = [
        {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          department: 'Engineering',
          position: 'Software Engineer',
          hire_date: '2021-06-15',
          status: 'active',
          phone: '555-123-4567',
          skills: ['JavaScript', 'React', 'Node.js']
        },
        {
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@example.com',
          department: 'Marketing',
          position: 'Marketing Specialist',
          hire_date: '2022-03-10',
          status: 'active',
          phone: '555-987-6543',
          skills: ['Content Strategy', 'SEO', 'Social Media']
        },
        {
          first_name: 'Robert',
          last_name: 'Johnson',
          email: 'robert.johnson@example.com',
          department: 'Sales',
          position: 'Sales Representative',
          hire_date: '2020-11-22',
          status: 'active',
          phone: '555-456-7890',
          skills: ['Negotiation', 'CRM Software', 'Presentation']
        },
        {
          first_name: 'Emily',
          last_name: 'Williams',
          email: 'emily.williams@example.com',
          department: 'Human Resources',
          position: 'HR Coordinator',
          hire_date: '2023-01-15',
          status: 'active',
          phone: '555-789-0123',
          skills: ['Recruiting', 'Employee Relations', 'Benefits Administration']
        }
      ];
      
      for (const employee of employees) {
        await supabase.from('hr_employees').insert(employee);
      }
      
      console.log('Successfully seeded HR sample data');
    } catch (error) {
      console.error('Error seeding HR sample data:', error);
    }
  }
};
