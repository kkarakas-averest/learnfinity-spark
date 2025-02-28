import hrService from './hrService';
import hrEmployeeService from './hrEmployeeService';
import hrCourseService from './hrCourseService';
import hrDepartmentService from './hrDepartmentService';
import hrLearningPathService from './hrLearningPathService';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { seedHRDatabase } from '@/lib/database/seed-hr-database';

// Export all HR services
export {
  hrService,          // Core HR service with database operations
  hrEmployeeService,  // Employee-specific operations
  hrCourseService,    // Course-specific operations
  hrDepartmentService, // Department and position operations
  hrLearningPathService // Learning path operations
};

// Default export for convenience
export default {
  hr: hrService,
  employees: hrEmployeeService,
  courses: hrCourseService,
  departments: hrDepartmentService,
  learningPaths: hrLearningPathService
};

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

// HR services for dashboard functionality
export const hrServices = {
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
      const completionRateChange = completionRate - prevCompletionRate;
      
      // Get skill gaps (this would be more complex in a real system, so we're simplifying)
      // For example, skill gaps could be identified by comparing required skills for positions 
      // with actual employee skills
      const skillGaps = 18; // Mock value for now
      const skillGapsChange = -3; // Mock change value
      
      // Get learning hours
      const { data: activities, error: actError } = await supabase
        .from('hr_employee_activities')
        .select('*');
        
      if (actError) throw actError;
      
      // Calculate learning hours (in a real system, activities would have duration)
      // Here we're just assigning a mock value based on activity count
      const learningHours = activities ? activities.length * 2 : 0;
      
      // Compare with previous month
      const { data: prevActivities, error: prevActError } = await supabase
        .from('hr_employee_activities')
        .select('*')
        .lt('timestamp', thisMonth.toISOString())
        .gte('timestamp', lastMonth.toISOString());
        
      if (prevActError) throw prevActError;
      
      const prevLearningHours = prevActivities ? prevActivities.length * 2 : 0;
      const learningHoursChange = learningHours - prevLearningHours;
      
      return {
        activeEmployees: activeEmployees ? activeEmployees.length : 0,
        newEmployees: newEmployees ? newEmployees.length : 0,
        completionRate,
        completionRateChange,
        skillGaps,
        skillGapsChange,
        learningHours,
        learningHoursChange
      };
    } catch (error) {
      return handleError(error, 'Failed to fetch dashboard metrics');
    }
  },
  
  /**
   * Get recent activities for the dashboard
   */
  async getRecentActivities() {
    try {
      const { data, error } = await supabase
        .from('hr_employee_activities')
        .select(`
          *,
          employee:hr_employees(id, name),
          course:hr_courses(id, title)
        `)
        .order('timestamp', { ascending: false })
        .limit(10);
        
      if (error) throw error;
      
      // Format the activities for the UI
      const activities = data.map(activity => {
        // Format the timestamp as a relative time
        const time = activity.timestamp 
          ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
          : 'Recently';
        
        // Basic activity object
        const formattedActivity = {
          id: activity.id,
          type: activity.activity_type,
          user: activity.employee?.name || 'Unknown Employee',
          time,
        };
        
        // Add additional properties based on activity type
        switch (activity.activity_type) {
          case 'enrollment':
            return {
              ...formattedActivity,
              course: activity.course?.title || 'Unknown Course',
            };
          case 'completion':
            return {
              ...formattedActivity,
              course: activity.course?.title || 'Unknown Course',
            };
          case 'feedback':
            return {
              ...formattedActivity,
              course: activity.course?.title || 'Unknown Course',
              rating: activity.rating || 0,
              comment: activity.description || 'No comment provided',
            };
          case 'alert':
            return {
              ...formattedActivity,
              issue: activity.description || 'Unspecified issue',
            };
          default:
            return formattedActivity;
        }
      });
      
      return activities;
    } catch (error) {
      return handleError(error, 'Failed to fetch recent activities');
    }
  },
  
  /**
   * Initialize the HR database with sample data if it's empty
   */
  async initializeHRDatabase() {
    try {
      // Check if the database already has data
      const { data: existingData, error: checkError } = await supabase
        .from('hr_departments')
        .select('id')
        .limit(1);
        
      if (checkError) throw checkError;
      
      // If data exists, no need to initialize
      if (existingData && existingData.length > 0) {
        console.log('HR database already has data, skipping initialization');
        return true;
      }
      
      console.log('Initializing HR database with sample data...');
      
      // Execute the seed function
      const result = await seedHRDatabase();
      
      if (!result.success) {
        throw new Error('Seeding failed: ' + (result.error ? result.error.message : 'Unknown error'));
      }
      
      return true;
    } catch (error) {
      return handleError(error, 'Failed to initialize HR database');
    }
  }
}; 