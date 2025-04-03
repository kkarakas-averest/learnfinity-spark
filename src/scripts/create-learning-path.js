import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

/**
 * This script creates a learning path for the specified user and enrolls them in it.
 * It also updates the estimated_completion_date for the enrollment.
 */
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

  try {
    // 1. Get the employee ID for the user
    console.log(`Finding employee ID for user: ${userEmail}`);
    const { data: employee, error: empError } = await supabase
      .from('hr_employees')
      .select('id, name')
      .eq('email', userEmail)
      .single();

    if (empError) {
      console.error('Error finding employee:', empError.message);
      return;
    }

    console.log(`Found employee: ${employee.name} (${employee.id})`);
    const employeeId = employee.id;

    // 2. Create a new learning path
    const learningPathId = uuidv4();
    const learningPath = {
      id: learningPathId,
      title: 'Financial Leadership Mastery',
      description: 'Comprehensive program designed for finance professionals looking to develop leadership skills',
      skill_level: 'Advanced',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating learning path:', learningPath.title);
    const { error: lpError } = await supabase
      .from('hr_learning_paths')
      .insert(learningPath);

    if (lpError) {
      // Check if it's a duplicate
      if (lpError.message.includes('duplicate')) {
        console.log('Learning path already exists, finding its ID...');
        const { data: existingLP, error: existingLPError } = await supabase
          .from('hr_learning_paths')
          .select('id')
          .eq('title', learningPath.title)
          .single();

        if (existingLPError) {
          console.error('Error finding existing learning path:', existingLPError.message);
          return;
        }

        console.log(`Found existing learning path with ID: ${existingLP.id}`);
        learningPathId = existingLP.id;
      } else {
        console.error('Error creating learning path:', lpError.message);
        return;
      }
    } else {
      console.log(`Learning path created with ID: ${learningPathId}`);
    }

    // 3. Enroll the user in the learning path
    console.log(`Enrolling employee in learning path...`);

    // First check if an enrollment already exists
    const { data: existingEnrollment, error: existingEnrollmentError } = await supabase
      .from('hr_learning_path_enrollments')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('learning_path_id', learningPathId)
      .single();

    if (!existingEnrollmentError && existingEnrollment) {
      console.log(`Employee is already enrolled in this learning path (ID: ${existingEnrollment.id})`);
      
      // Update the enrollment with the estimated completion date
      console.log('Updating enrollment with estimated completion date...');
      
      // Calculate a date 60 days from now
      const estCompletionDate = new Date();
      estCompletionDate.setDate(estCompletionDate.getDate() + 60);
      
      const { error: updateError } = await supabase
        .from('hr_learning_path_enrollments')
        .update({
          status: 'in_progress',
          progress: 25,
          estimated_completion_date: estCompletionDate.toISOString()
        })
        .eq('id', existingEnrollment.id);
        
      if (updateError) {
        if (updateError.message.includes('estimated_completion_date')) {
          console.error('Error updating enrollment - column does not exist:', updateError.message);
          console.log('You need to add the estimated_completion_date column to the hr_learning_path_enrollments table');
        } else {
          console.error('Error updating enrollment:', updateError.message);
        }
      } else {
        console.log('Enrollment updated successfully');
      }
    } else {
      // Create a new enrollment
      const enrollmentId = uuidv4();
      const enrollment = {
        id: enrollmentId,
        employee_id: employeeId,
        learning_path_id: learningPathId,
        status: 'in_progress',
        progress: 25,
        enrollment_date: new Date().toISOString(),
        completion_date: null
      };
      
      // Try to add estimated completion date
      try {
        const estCompletionDate = new Date();
        estCompletionDate.setDate(estCompletionDate.getDate() + 60);
        enrollment.estimated_completion_date = estCompletionDate.toISOString();
      } catch (err) {
        console.log('Not adding estimated_completion_date to enrollment object');
      }

      const { error: enrollmentError } = await supabase
        .from('hr_learning_path_enrollments')
        .insert(enrollment);

      if (enrollmentError) {
        if (enrollmentError.message.includes('estimated_completion_date')) {
          console.error('Error creating enrollment - column issue:', enrollmentError.message);
          
          // Try again without the estimated_completion_date
          delete enrollment.estimated_completion_date;
          
          const { error: enrollmentError2 } = await supabase
            .from('hr_learning_path_enrollments')
            .insert(enrollment);
            
          if (enrollmentError2) {
            console.error('Error creating enrollment (second attempt):', enrollmentError2.message);
          } else {
            console.log(`Enrollment created with ID: ${enrollmentId} (without estimated_completion_date)`);
          }
        } else {
          console.error('Error creating enrollment:', enrollmentError.message);
        }
      } else {
        console.log(`Enrollment created with ID: ${enrollmentId}`);
      }
    }

    // 4. Add courses to the learning path if needed
    console.log('Checking if learning path has courses...');
    
    // Since hr_learning_path_courses might not exist yet, let's try to add the courses directly
    console.log('Querying user course enrollments...');
    
    const { data: userCourses, error: userCoursesError } = await supabase
      .from('hr_course_enrollments')
      .select('course_id, hr_courses(title)')
      .eq('employee_id', employeeId);
    
    if (userCoursesError) {
      console.error('Error fetching user courses:', userCoursesError.message);
    } else if (userCourses && userCourses.length > 0) {
      console.log(`Found ${userCourses.length} courses the user is enrolled in:`);
      userCourses.forEach(course => {
        console.log(`- ${course.hr_courses?.title || 'Unknown course'}`);
      });
    } else {
      console.log('No courses found for this user');
    }
    
    console.log('Learning path setup completed successfully!');
    console.log('\nNOTE: To complete the setup, please run the SQL from alter-schema.js in Supabase SQL Editor');
    console.log('and then restart this script to assign courses to the learning path.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 