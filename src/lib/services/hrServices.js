import { supabase } from '@/lib/supabase';
import { seedHRDatabase } from '@/lib/database/seed-hr-database';
import { hrEmployeeService } from './hrEmployeeService';

// High-level HR services for dashboard functionality
export const hrServices = {
  /**
   * Initialize the HR database
   * This checks if seeding is needed and performs the seeding if necessary
   * Also ensures required storage buckets exist
   */
  async initializeHRDatabase() {
    try {
      // First, ensure the hr-documents storage bucket exists
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