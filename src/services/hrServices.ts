
import { supabase } from "@/lib/supabase";
import { hrEmployeeService } from "./hrEmployeeService";

export const hrServices = {
  initializeHRDatabase: async () => {
    try {
      // Check if employees table exists
      const { error: schemaError } = await supabase
        .from('hr_employees')
        .select('id')
        .limit(1);
        
      if (schemaError) {
        console.log('Creating HR tables schema...');
        // Create departments table
        await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS hr_departments (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              name TEXT NOT NULL,
              code TEXT,
              description TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
            );
          `
        });
        
        // Create positions table
        await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS hr_positions (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              title TEXT NOT NULL,
              department_id UUID REFERENCES hr_departments(id),
              level TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
            );
          `
        });
        
        // Create employees table
        await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS hr_employees (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              user_id UUID REFERENCES auth.users(id),
              first_name TEXT NOT NULL,
              last_name TEXT NOT NULL,
              email TEXT NOT NULL,
              department TEXT,
              position TEXT,
              hire_date DATE,
              status TEXT DEFAULT 'active',
              manager_id UUID REFERENCES hr_employees(id),
              phone TEXT,
              address TEXT,
              city TEXT,
              state TEXT,
              postal_code TEXT,
              country TEXT,
              birth_date DATE,
              emergency_contact TEXT,
              emergency_phone TEXT,
              skills TEXT[],
              certifications TEXT[],
              photo_url TEXT,
              notes TEXT,
              last_activity TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
            );
          `
        });
        
        // Create sample data
        await hrEmployeeService.seedSampleData();
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error initializing HR database:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error initializing database" 
      };
    }
  },
  
  // Add missing dashboard functions
  getDashboardMetrics: async () => {
    try {
      // Get total number of employees
      const { data: employeesData, error: employeesError } = await supabase
        .from('hr_employees')
        .select('id, status')
        .order('created_at', { ascending: false });
        
      if (employeesError) throw employeesError;
      
      const employeeCount = employeesData?.length || 0;
      const activeEmployees = employeesData?.filter(e => e.status === 'active').length || 0;
      const inactiveEmployees = employeesData?.filter(e => e.status !== 'active').length || 0;
      
      // Get departments count
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('hr_departments')
        .select('id');
        
      if (departmentsError) throw departmentsError;
      
      // Get recent hires (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: recentHiresData, error: recentHiresError } = await supabase
        .from('hr_employees')
        .select('id')
        .gte('created_at', thirtyDaysAgo.toISOString());
        
      if (recentHiresError) throw recentHiresError;
      
      return {
        success: true,
        metrics: {
          totalEmployees: employeeCount,
          activeEmployees,
          inactiveEmployees,
          totalDepartments: departmentsData?.length || 0,
          recentHires: recentHiresData?.length || 0
        }
      };
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error fetching metrics"
      };
    }
  },
  
  getRecentActivities: async () => {
    try {
      // Get recent employees (created in the last 30 days)
      const { data: recentEmployees, error: employeesError } = await supabase
        .from('hr_employees')
        .select('id, first_name, last_name, email, status, position, department, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (employeesError) throw employeesError;
      
      // Transform to activities format
      const activities = recentEmployees?.map(employee => ({
        id: employee.id,
        type: 'employee_created',
        subject: `${employee.first_name} ${employee.last_name}`,
        description: `New employee added as ${employee.position} in ${employee.department}`,
        timestamp: employee.created_at,
        status: employee.status
      })) || [];
      
      return {
        success: true,
        activities
      };
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error fetching activities"
      };
    }
  }
};
