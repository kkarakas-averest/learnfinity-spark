import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * This script fixes the dashboard data issue by:
 * 1. Checking if the user exists in auth.users
 * 2. Checking if the user exists in hr_employees with the correct email
 * 3. Verifying the field mappings for learning_path_enrollments and learner_statistics
 * 4. Updating schema if needed
 */
async function main() {
  // Initialize Supabase client with anon key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or key is missing. Please check your .env file.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const userEmail = 'kkarakass@averesttraining.com';
  
  console.log('Starting dashboard data fix for user:', userEmail);
  
  try {
    // 1. Check the user in auth.users (may not have access with anon key)
    console.log('\nChecking auth users...');
    const { data: authUser, error: authError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', userEmail)
      .limit(1);
      
    if (authError) {
      console.error('Error checking auth users:', authError.message);
    } else {
      console.log('Auth user record:', authUser);
    }
    
    // 2. Check HR employee
    console.log('\nChecking HR employee...');
    const { data: hrEmployee, error: hrError } = await supabase
      .from('hr_employees')
      .select('id, name, email')
      .eq('email', userEmail)
      .limit(1);
      
    if (hrError) {
      console.error('Error checking HR employee:', hrError.message);
    } else {
      console.log('HR employee record:', hrEmployee);
      
      if (hrEmployee && hrEmployee.length > 0) {
        const employeeId = hrEmployee[0].id;
        
        // 3. Check learning path enrollments table structure
        console.log('\nChecking learning path enrollments table structure...');
        let hasEstimatedCompletionDate = false;
        
        try {
          // Try to retrieve a sample record to check fields
          const { data: sampleLP, error: sampleLPError } = await supabase
            .from('hr_learning_path_enrollments')
            .select('estimated_completion_date')
            .limit(1);
            
          // If no error, column exists
          if (!sampleLPError) {
            hasEstimatedCompletionDate = true;
            console.log('estimated_completion_date column exists');
          } else {
            console.log('Error querying estimated_completion_date:', sampleLPError.message);
          }
        } catch (err) {
          console.error('Error checking learning path enrollments:', err);
        }
            
        if (!hasEstimatedCompletionDate) {
          console.log('\nMissing estimated_completion_date column in hr_learning_path_enrollments');
          console.log('You need to add this column in the Supabase dashboard or through a migration');
        }
        
        // 4. Check learner statistics table structure
        console.log('\nChecking learner statistics table...');
        let hasLearnerStatistics = false;
        let hasEmployeeId = false;
        let hasUserId = false;
        
        try {
          // Try to retrieve a sample record to check if table exists
          const { data: sampleStats, error: sampleStatsError } = await supabase
            .from('learner_statistics')
            .select('*')
            .limit(1);
            
          if (!sampleStatsError) {
            hasLearnerStatistics = true;
            console.log('learner_statistics table exists');
            
            // Now check for employee_id column
            try {
              const { data: withEmployeeId, error: employeeIdError } = await supabase
                .from('learner_statistics')
                .select('employee_id')
                .limit(1);
                
              if (!employeeIdError) {
                hasEmployeeId = true;
                console.log('employee_id column exists in learner_statistics');
              }
            } catch (err) {
              console.log('employee_id column does not exist');
            }
            
            // Check for user_id column
            try {
              const { data: withUserId, error: userIdError } = await supabase
                .from('learner_statistics')
                .select('user_id')
                .limit(1);
                
              if (!userIdError) {
                hasUserId = true;
                console.log('user_id column exists in learner_statistics');
              }
            } catch (err) {
              console.log('user_id column does not exist');
            }
          } else {
            console.log('Error querying learner_statistics:', sampleStatsError.message);
          }
        } catch (err) {
          console.error('Error checking learner statistics:', err);
        }
        
        if (!hasLearnerStatistics) {
          console.log('\nlearner_statistics table does not exist');
          console.log('You need to create this table in the Supabase dashboard or through a migration with these columns:');
          console.log('- id (UUID, primary key)');
          console.log('- employee_id (UUID, foreign key to hr_employees)');
          console.log('- courses_completed (integer)');
          console.log('- learning_paths_completed (integer)');
          console.log('- assigned_courses (integer)');
          console.log('- skills_acquired (integer)');
          console.log('- created_at, updated_at (timestamps)');
        } else if (!hasEmployeeId && hasUserId) {
          console.log('\nLearner statistics has user_id instead of employee_id');
          console.log('The code is using employee_id, so you need to rename the column in Supabase dashboard');
        } else if (!hasEmployeeId && !hasUserId) {
          console.log('\nLearner statistics is missing the employee_id column');
          console.log('You need to add this column in the Supabase dashboard');
        }
        
        // 5. Check if user has stats record, create if not
        if (hasLearnerStatistics && hasEmployeeId) {
          console.log('\nChecking if user has stats record...');
          const { data: statsRecord, error: recordError } = await supabase
            .from('learner_statistics')
            .select('*')
            .eq('employee_id', employeeId)
            .limit(1);
            
          if (recordError) {
            console.error('Error checking stats record:', recordError.message);
          } else {
            console.log('Stats record:', statsRecord);
            
            if (!statsRecord || statsRecord.length === 0) {
              console.log('Creating stats record for user...');
              
              // Get course enrollment counts
              const { data: courseData, error: courseError } = await supabase
                .from('hr_course_enrollments')
                .select('status')
                .eq('employee_id', employeeId);
                
              const completedCourses = courseData ? 
                courseData.filter(c => c.status === 'completed').length : 0;
              const totalCourses = courseData ? courseData.length : 0;
              
              const { error: insertError } = await supabase
                .from('learner_statistics')
                .insert({
                  employee_id: employeeId,
                  courses_completed: completedCourses,
                  learning_paths_completed: 0,
                  assigned_courses: totalCourses,
                  skills_acquired: completedCourses * 2,
                  total_time_spent: completedCourses * 60,
                  average_score: 90
                });
                
              if (insertError) {
                console.error('Error creating stats record:', insertError.message);
              } else {
                console.log('Created stats record successfully');
              }
            }
          }
        }
      } else {
        console.log('HR employee record not found for email:', userEmail);
      }
    }
    
    console.log('\nDashboard data fix completed!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 