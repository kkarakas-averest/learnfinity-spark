import { supabase } from '@/lib/supabase';
import { seedHRDatabase } from '@/lib/database/seed-hr-database';
import { hrEmployeeService } from './hrEmployeeService';

// High-level HR services for dashboard functionality
export const hrServices = {
  /**
   * Create HR database tables if they don't exist
   */
  async createHRTablesIfNotExist() {
    try {
      console.log('Checking if HR database tables exist...');
      
      // Check if hr_departments table exists
      const { error: checkError } = await supabase
        .from('hr_departments')
        .select('id')
        .limit(1);
        
      // If the table doesn't exist, we'll create the basic schema
      if (checkError && checkError.message.includes('relation "hr_departments" does not exist')) {
        console.log('HR database tables do not exist. Creating them...');
        
        // Create departments table
        const { error: deptError } = await supabase.rpc('create_hr_departments_table');
        if (deptError) {
          console.error('Error creating hr_departments table:', deptError);
          
          // Let's create it directly with SQL
          const { error: sqlError } = await supabase.rpc('execute_sql', {
            sql: `
              CREATE TABLE IF NOT EXISTS hr_departments (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
              );
            `
          });
          
          if (sqlError) {
            console.error('Error creating hr_departments table with SQL:', sqlError);
            return { success: false, error: sqlError };
          }
        }
        
        // Create positions table
        const { error: posError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS hr_positions (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              title VARCHAR(100) NOT NULL,
              department_id UUID,
              salary_range_min DECIMAL(10,2),
              salary_range_max DECIMAL(10,2),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(title, department_id)
            );
          `
        });
        
        if (posError) {
          console.error('Error creating hr_positions table:', posError);
          return { success: false, error: posError };
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
              department_id UUID,
              position_id UUID,
              manager_id UUID,
              status VARCHAR(20) DEFAULT 'active',
              profile_image_url TEXT,
              resume_url TEXT,
              company_id UUID NOT NULL,
              last_active_at TIMESTAMP WITH TIME ZONE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `
        });
        
        if (empError) {
          console.error('Error creating hr_employees table:', empError);
          return { success: false, error: empError };
        }
        
        // Create courses table
        const { error: courseError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS hr_courses (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              title VARCHAR(200) NOT NULL,
              description TEXT,
              department_id UUID,
              skill_level VARCHAR(20) DEFAULT 'beginner',
              duration INTEGER,
              status VARCHAR(20) DEFAULT 'active',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `
        });
        
        if (courseError) {
          console.error('Error creating hr_courses table:', courseError);
          return { success: false, error: courseError };
        }
        
        // Create course enrollments table
        const { error: enrollError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS hr_course_enrollments (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              employee_id UUID NOT NULL,
              course_id UUID NOT NULL,
              status VARCHAR(20) DEFAULT 'enrolled',
              progress INTEGER DEFAULT 0,
              score DECIMAL(5,2),
              enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
              completion_date TIMESTAMP WITH TIME ZONE,
              UNIQUE(employee_id, course_id)
            );
          `
        });
        
        if (enrollError) {
          console.error('Error creating hr_course_enrollments table:', enrollError);
          return { success: false, error: enrollError };
        }
        
        // Create activities table
        const { error: actError } = await supabase.rpc('execute_sql', {
          sql: `
            CREATE TABLE IF NOT EXISTS hr_employee_activities (
              id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
              employee_id UUID NOT NULL,
              activity_type VARCHAR(50) NOT NULL,
              description TEXT,
              course_id UUID,
              timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
          `
        });
        
        if (actError) {
          console.error('Error creating hr_employee_activities table:', actError);
          return { success: false, error: actError };
        }
        
        console.log('Successfully created HR database tables');
      } else {
        console.log('HR database tables already exist');
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error creating HR database tables:', error);
      return { success: false, error };
    }
  },

  /**
   * Initialize the HR database
   * This checks if seeding is needed and performs the seeding if necessary
   * Also ensures required storage buckets exist
   */
  async initializeHRDatabase() {
    try {
      // First, create tables if they don't exist
      const { success: tablesSuccess, error: tablesError } = await this.createHRTablesIfNotExist();
      
      if (!tablesSuccess) {
        console.warn('Failed to create HR tables:', tablesError);
      }
    
      // Next, ensure the hr-documents storage bucket exists
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const hrDocumentsBucket = buckets?.find(bucket => bucket.name === 'hr-documents');
        
        if (!hrDocumentsBucket) {
          console.log('Creating hr-documents storage bucket...');
          // Create the bucket
          const { error: bucketError } = await supabase.storage.createBucket('hr-documents', {
            public: false, // Private by default
            fileSizeLimit: 10485760, // 10MB
            allowedMimeTypes: [
              'application/pdf',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]
          });
          
          if (bucketError) {
            console.error('Error creating hr-documents bucket:', bucketError);
          } else {
            // Set bucket policy to make it publicly accessible
            await supabase.storage.updateBucket('hr-documents', {
              public: true
            });
          }
        }
      } catch (storageError) {
        console.error('Error initializing storage bucket:', storageError);
      }
      
      // Ensure the resume_url column exists in the hr_employees table
      await hrEmployeeService.ensureResumeUrlColumn();
      
      // Seed the database if necessary
      return await seedHRDatabase();
    } catch (error) {
      console.error('Error initializing HR database:', error);
      throw error;
    }
  },

  /**
   * Get dashboard metrics for the overview
   */
  async getDashboardMetrics() {
    try {
      // Get active employees count
      const { data: activeEmployees, error: activeError } = await supabase
        .from('hr_employees')
        .select('id')
        .eq('status', 'active');
        
      if (activeError) throw activeError;
      
      // Get new employees this month
      const thisMonth = new Date();
      thisMonth.setDate(1); // First day of current month
      
      const { data: newEmployees, error: newError } = await supabase
        .from('hr_employees')
        .select('id')
        .gte('created_at', thisMonth.toISOString());
        
      if (newError) throw newError;
      
      // Get course completion metrics
      const { data: enrollments, error: enrollError } = await supabase
        .from('hr_course_enrollments')
        .select('*');
        
      if (enrollError) throw enrollError;
      
      const totalEnrollments = enrollments ? enrollments.length : 0;
      const completedEnrollments = enrollments ? enrollments.filter(e => e.status === 'completed').length : 0;
      const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;
      
      // Get previous month data for comparison
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      lastMonth.setDate(1);
      const endOfLastMonth = new Date(thisMonth);
      endOfLastMonth.setDate(0);
      
      const { data: prevEnrollments, error: prevError } = await supabase
        .from('hr_course_enrollments')
        .select('*')
        .lt('enrollment_date', thisMonth.toISOString())
        .gte('enrollment_date', lastMonth.toISOString());
        
      if (prevError) throw prevError;
      
      const prevTotalEnrollments = prevEnrollments ? prevEnrollments.length : 0;
      const prevCompletedEnrollments = prevEnrollments ? prevEnrollments.filter(e => e.status === 'completed').length : 0;
      const prevCompletionRate = prevTotalEnrollments > 0 ? Math.round((prevCompletedEnrollments / prevTotalEnrollments) * 100) : 0;
      
      // Calculate trend percentages (positive = improving, negative = declining)
      const completionRateTrend = prevCompletionRate > 0 ? 
        ((completionRate - prevCompletionRate) / prevCompletionRate) * 100 : 0;
      
      return {
        activeEmployees: activeEmployees?.length || 0,
        newEmployees: newEmployees?.length || 0,
        totalCourses: 5, // Placeholder
        totalEnrollments,
        completedEnrollments,
        completionRate,
        trends: {
          completionRate: completionRateTrend
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      return null;
    }
  },

  /**
   * Get recent activities for the dashboard
   */
  async getRecentActivities(limit = 5) {
    try {
      const { data, error } = await supabase
        .from('hr_employee_activities')
        .select(`
          *,
          hr_employees(id, name)
        `)
        .order('activity_date', { ascending: false })
        .limit(limit);
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }
};

export default hrServices; 