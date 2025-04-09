import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || '';

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

async function createEmployeeUserMappings() {
  try {
    console.log('Starting employee-user mapping process...');
    
    // Step 1: Get all users
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email');
      
    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }
    
    console.log(`Found ${users?.length || 0} users`);
    
    // Step 2: Get all HR employees
    const { data: employees, error: employeesError } = await supabase
      .from('hr_employees')
      .select('id, email');
      
    if (employeesError) {
      console.error('Error fetching employees:', employeesError);
      throw employeesError;
    }
    
    console.log(`Found ${employees?.length || 0} HR employees`);
    
    // Step 3: Match users with employees by email
    const mappings = [];
    
    for (const user of users || []) {
      const matchingEmployee = employees?.find(e => e.email.toLowerCase() === user.email.toLowerCase());
      
      if (matchingEmployee) {
        mappings.push({
          id: uuidv4(),
          employee_id: matchingEmployee.id,
          user_id: user.id,
          created_at: new Date().toISOString()
        });
      }
    }
    
    console.log(`Created ${mappings.length} employee-user mappings`);
    
    // Step 4: Insert the mappings
    if (mappings.length > 0) {
      const { data: insertData, error: insertError } = await supabase
        .from('employee_user_mapping')
        .upsert(mappings, { onConflict: 'employee_id,user_id' });
        
      if (insertError) {
        console.error('Error inserting mappings:', insertError);
        throw insertError;
      }
      
      console.log('Mappings inserted successfully!');
    } else {
      console.log('No mappings to insert.');
    }
    
    // Step 5: Verify the mappings
    const { data: verifyData, error: verifyError } = await supabase
      .from('employee_user_mapping')
      .select('*');
      
    if (verifyError) {
      console.error('Error verifying mappings:', verifyError);
    } else {
      console.log(`Verified ${verifyData?.length || 0} mappings in employee_user_mapping table`);
    }
    
    console.log('Employee-user mapping process complete.');
  } catch (error) {
    console.error('Unexpected error during mapping process:', error);
    process.exit(1);
  }
}

// Run the script
createEmployeeUserMappings(); 