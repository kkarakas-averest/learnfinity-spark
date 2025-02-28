import { supabase } from '@/lib/database/supabaseClient';
import { seedHRDatabase } from '@/lib/database/seed-hr-database';

// High-level HR services for dashboard functionality
export const hrServices = {
  /**
   * Initialize the HR database
   * This checks if seeding is needed and performs the seeding if necessary
   */
  async initializeHRDatabase() {
    try {
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