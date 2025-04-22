import { createClient } from '@supabase/supabase-js';

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
      .select('*')
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