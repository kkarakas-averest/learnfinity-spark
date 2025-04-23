
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// This is a simple direct service for debugging purposes
// It should only be used temporarily while fixing RLS issues

// Hardcoded credentials for demo/debug purposes only
// In production, these would be server-side environment variables
const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';

// Create a function that attempts to fetch employees directly
export const fetchEmployeesDirectWithKey = async (serviceKey: string) => {
  if (!serviceKey || serviceKey.length < 20) {
    console.error('Invalid service key provided');
    return { success: false, error: 'Invalid service key', employees: [] };
  }
  
  try {
    // Create a temporary client with the service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    console.log('Created temporary admin client with service key');
    
    // Try to fetch employees directly with the service role
    const { data: employees, error } = await supabaseAdmin
      .from('hr_employees')
      .select(`
        *,
        hr_departments(id, name),
        hr_positions(id, title),
        user_id
      `)
      .limit(10);
    
    if (error) {
      console.error('Error fetching employees with service key:', error);
      return { success: false, error: error.message, employees: [] };
    }
    
    console.log(`Successfully fetched ${employees.length} employees with service key`);
    return { success: true, employees };
  } catch (error) {
    console.error('Exception fetching employees with service key:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      employees: [] 
    };
  }
};

// Function to check authentication status and Supabase connection
export const checkSupabaseConnection = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Failed to get Supabase session:', sessionError);
      return { 
        success: false, 
        error: sessionError.message,
        authenticated: false,
        details: 'Error retrieving authentication session'
      };
    }
    
    if (!session) {
      console.warn('No active Supabase session found');
      return {
        success: false,
        authenticated: false,
        details: 'No active authentication session'
      };
    }
    
    // Try to get user profile info with current session
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role, company_id')
      .eq('id', session.user.id)
      .single();
      
    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return {
        success: true,
        authenticated: true,
        userId: session.user.id,
        email: session.user.email,
        userProfile: null,
        error: profileError.message,
        details: 'Authenticated but failed to fetch user profile'
      };
    }
    
    return {
      success: true,
      authenticated: true,
      userId: session.user.id,
      email: session.user.email,
      userProfile,
      details: 'Successfully authenticated and retrieved user profile'
    };
  } catch (error) {
    console.error('Unexpected error checking Supabase connection:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      authenticated: false,
      details: 'Unexpected error during authentication check'
    };
  }
};

// Fetch employees with the current authenticated session
export const fetchEmployeesWithAuthSession = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('No active session when trying to fetch employees');
      return { 
        success: false, 
        error: 'Not authenticated', 
        employees: [],
        note: 'This endpoint requires authentication' 
      };
    }
    
    console.log('Fetching employees with authenticated session, user ID:', session.user.id);
    
    // Try to get user's company_id from profile
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('company_id, role')
      .eq('id', session.user.id)
      .single();
    
    console.log('User profile data:', userProfile);
    
    // Fetch employees based on user's company_id
    const query = supabase
      .from('hr_employees')
      .select(`
        *,
        hr_departments(id, name),
        hr_positions(id, title),
        user_id
      `)
      .limit(50);
    
    // If there's a company_id, add it to the query
    if (userProfile && userProfile.company_id) {
      query.eq('company_id', userProfile.company_id);
      console.log('Filtering by company_id:', userProfile.company_id);
    }
    
    const { data: employees, error } = await query;
    
    if (error) {
      console.error('Error fetching employees with auth session:', error);
      return { 
        success: false, 
        error: error.message, 
        employees: [],
        userProfile 
      };
    }
    
    console.log(`Successfully fetched ${employees?.length || 0} employees with auth session`);
    
    return { 
      success: true, 
      employees: employees || [],
      userProfile,
      note: userProfile 
        ? `Query filtered by company_id: ${userProfile.company_id}` 
        : 'No user profile found, query not filtered by company'
    };
  } catch (error) {
    console.error('Exception fetching employees with auth session:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error', 
      employees: [] 
    };
  }
};
