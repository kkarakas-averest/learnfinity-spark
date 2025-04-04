import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

/**
 * Interface for employee data structure
 */
export interface EmployeeData {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  department: string;
  position: string;
  department_id: string;
  position_id: string;
  hire_date?: string;
  metadata?: any;
  learning_preferences?: any;
}

/**
 * Fetches employee data from HR system for content personalization
 * 
 * @param userId - The user ID to fetch employee data for
 * @returns Promise with employee data or null if not found
 */
export async function getEmployeeDataForPersonalization(userId: string): Promise<EmployeeData | null> {
  try {
    console.log(`Fetching employee data for user ID: ${userId}`);
    
    // First, try to get from hr_employees with user_id
    const { data: employeeData, error: employeeError } = await supabase
      .from('hr_employees')
      .select(`
        *,
        hr_departments (
          id,
          name
        ),
        hr_positions (
          id,
          title
        )
      `)
      .eq('user_id', userId)
      .single();
    
    if (employeeData && !employeeError) {
      // Transform the employee data into the required format
      return {
        id: employeeData.id,
        user_id: employeeData.user_id,
        name: employeeData.name || 'Unknown Employee',
        email: employeeData.email,
        department: employeeData.hr_departments?.name || 'Unknown Department',
        position: employeeData.hr_positions?.title || 'Unknown Position',
        department_id: employeeData.department_id,
        position_id: employeeData.position_id,
        hire_date: employeeData.hire_date,
        metadata: {},
        learning_preferences: {}
      };
    }
    
    // If not found in hr_employees, try to get from learner_profiles
    const { data: profileData, error: profileError } = await supabase
      .from('learner_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (profileData && !profileError) {
      // Get auth user data for basic info
      const { data: userData, error: userError } = await supabase
        .auth
        .admin
        .getUserById(userId);
        
      if (userData && !userError) {
        return {
          id: profileData.id,
          user_id: userId,
          name: userData.user.user_metadata?.full_name || userData.user.email || 'Unknown User',
          email: userData.user.email || 'unknown@example.com',
          department: profileData.department || 'General',
          position: profileData.title || 'Learner',
          department_id: profileData.employee_id || '',
          position_id: '',
          learning_preferences: profileData.preferences || {}
        };
      }
    }
    
    // If we still don't have data, get basic info from auth
    const { data: authUser, error: authError } = await supabase
      .auth
      .admin
      .getUserById(userId);
      
    if (authUser && !authError) {
      // Return basic user info
      return {
        id: userId,
        user_id: userId,
        name: authUser.user.user_metadata?.full_name || authUser.user.email || 'Unknown User',
        email: authUser.user.email || 'unknown@example.com',
        department: 'General',
        position: 'Learner',
        department_id: '',
        position_id: '',
        learning_preferences: {}
      };
    }
    
    // If we have no data at all, return null
    console.error(`No employee data found for user ID: ${userId}`);
    return null;
  } catch (error) {
    console.error('Error fetching employee data for personalization:', error);
    return null;
  }
} 