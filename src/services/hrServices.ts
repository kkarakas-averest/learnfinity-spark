
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
  }
};
