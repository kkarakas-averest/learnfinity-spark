import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

// Error handling helper
const handleError = (error: any, customMessage: string = 'An error occurred') => {
  console.error(`${customMessage}:`, error);
  toast({
    title: 'Error',
    description: customMessage,
    variant: 'destructive',
  });
  return null;
};

// Base HR service with core functionality
const hrService = {
  /**
   * Initializes the HR database by running the schema SQL
   * This should be run once during the application setup
   */
  async initializeDatabase() {
    try {
      // Read the SQL from the file (this would be implemented differently in production)
      const response = await fetch('/src/lib/database/hr-schema.sql');
      const sqlScript = await response.text();
      
      // Execute the SQL script using a Supabase function
      const { error } = await supabase.rpc('execute_sql', { sql: sqlScript });
      
      if (error) {
        throw error;
      }
      
      console.log('HR database initialized successfully');
      return true;
    } catch (error) {
      return handleError(error, 'Failed to initialize HR database');
    }
  },

  /**
   * Checks if the HR database tables exist
   */
  async checkDatabaseExists() {
    try {
      const { data, error } = await supabase
        .from('hr_departments')
        .select('id')
        .limit(1);
        
      if (error) {
        throw error;
      }
      
      return true;
    } catch (error) {
      console.warn('HR database tables may not exist yet:', error);
      return false;
    }
  },
  
  /**
   * Seeds the database with initial data
   * Useful for development and testing
   */
  async seedDatabase() {
    try {
      // Check if data already exists
      const { data: existingDepts } = await supabase
        .from('hr_departments')
        .select('id')
        .limit(1);
        
      if (existingDepts && existingDepts.length > 0) {
        console.log('Database already has data, skipping seed');
        return true;
      }
      
      // Seed departments
      const departments = [
        { name: 'Engineering', description: 'Software development and infrastructure' },
        { name: 'Marketing', description: 'Brand management and growth' },
        { name: 'Sales', description: 'Revenue generation and client relationships' },
        { name: 'Human Resources', description: 'Employee management and culture' },
        { name: 'Product', description: 'Product management and design' }
      ];
      
      const { data: deptData, error: deptError } = await supabase
        .from('hr_departments')
        .insert(departments)
        .select();
        
      if (deptError) throw deptError;
      
      // Map department IDs for reference
      const deptMap = deptData.reduce((map, dept) => {
        map[dept.name] = dept.id;
        return map;
      }, {});
      
      // Seed positions
      const positions = [
        { title: 'Software Engineer', department_id: deptMap['Engineering'] },
        { title: 'Senior Software Engineer', department_id: deptMap['Engineering'] },
        { title: 'Product Manager', department_id: deptMap['Product'] },
        { title: 'Marketing Specialist', department_id: deptMap['Marketing'] },
        { title: 'HR Manager', department_id: deptMap['Human Resources'] },
        { title: 'Sales Representative', department_id: deptMap['Sales'] }
      ];
      
      const { error: posError } = await supabase
        .from('hr_positions')
        .insert(positions);
        
      if (posError) throw posError;
      
      // More seeding can be added as needed
      
      console.log('Database seeded successfully');
      return true;
    } catch (error) {
      return handleError(error, 'Failed to seed database');
    }
  }
};

export default hrService; 