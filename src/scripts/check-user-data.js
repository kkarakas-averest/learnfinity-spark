import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  // Initialize Supabase client with anon key (which we've confirmed works)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or key is missing. Please check your .env file.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const userEmail = 'kkarakass@averesttraining.com';

  console.log(`Checking data for user with email: ${userEmail}`);

  try {
    // 1. Check if the user exists in auth.users (note: anon key may not have access to auth schema)
    console.log('\n1. Checking auth.users:');
    const { data: authUser, error: authError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .eq('email', userEmail)
      .limit(1);
    
    if (authError) {
      console.error('Error checking auth.users:', authError.message);
    } else {
      console.log('Auth user record:', authUser);
    }

    // 2. Check if user exists in hr_employees
    console.log('\n2. Checking hr_employees:');
    const { data: hrEmployee, error: hrError } = await supabase
      .from('hr_employees')
      .select('id, name, email, department_id, position_id, hire_date, status, manager_id')
      .eq('email', userEmail)
      .limit(1);
    
    if (hrError) {
      console.error('Error checking hr_employees:', hrError.message);
    } else {
      console.log('HR employee record:', hrEmployee);
      
      if (hrEmployee && hrEmployee.length > 0) {
        const employeeId = hrEmployee[0].id;
        
        // 3. Check employee's department and position
        if (hrEmployee[0].department_id) {
          console.log('\n3. Checking department:');
          const { data: dept, error: deptError } = await supabase
            .from('hr_departments')
            .select('*')
            .eq('id', hrEmployee[0].department_id)
            .limit(1);
          
          if (deptError) {
            console.error('Error checking department:', deptError.message);
          } else {
            console.log('Department:', dept);
          }
        }
        
        if (hrEmployee[0].position_id) {
          console.log('\n4. Checking position:');
          const { data: position, error: posError } = await supabase
            .from('hr_positions')
            .select('*')
            .eq('id', hrEmployee[0].position_id)
            .limit(1);
          
          if (posError) {
            console.error('Error checking position:', posError.message);
          } else {
            console.log('Position:', position);
          }
        }
        
        // 4. Check course enrollments
        console.log('\n5. Checking course enrollments:');
        const { data: courseEnrollments, error: ceError } = await supabase
          .from('hr_course_enrollments')
          .select(`
            id, course_id, status, progress, enrollment_date, completion_date,
            hr_courses (id, title, description)
          `)
          .eq('employee_id', employeeId);
        
        if (ceError) {
          console.error('Error checking course enrollments:', ceError.message);
        } else {
          console.log('Course enrollments:', courseEnrollments);
        }
        
        // 5. Check learning path enrollments
        console.log('\n6. Checking learning path enrollments:');
        const { data: pathEnrollments, error: peError } = await supabase
          .from('hr_learning_path_enrollments')
          .select(`
            id, learning_path_id, status, progress, enrollment_date, estimated_completion_date,
            hr_learning_paths (id, title, description)
          `)
          .eq('employee_id', employeeId);
        
        if (peError) {
          console.error('Error checking learning path enrollments:', peError.message);
        } else {
          console.log('Learning path enrollments:', pathEnrollments);
        }
        
        // 6. Check learner statistics
        console.log('\n7. Checking learner statistics:');
        const { data: stats, error: statsError } = await supabase
          .from('learner_statistics')
          .select('*')
          .eq('user_id', employeeId);
        
        if (statsError) {
          console.error('Error checking learner statistics:', statsError.message);
        } else {
          console.log('Learner statistics:', stats);
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 