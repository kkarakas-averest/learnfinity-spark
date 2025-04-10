// ID validation tool for debugging database issues with specific records

import { createClient } from '@supabase/supabase-js';

// Direct Supabase configuration
const SUPABASE_URL = "https://ujlqzkkkfatehxeqtbdl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODA4MzIsImV4cCI6MjA1NjI1NjgzMn0.ed-wciIqkubS4f2T3UNnkgqwzLEdpC-SVZoVsP7-W1E";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Check if specific course exists
    const courseId = req.query.courseId || 'd686c302-2f9d-4cd8-8316-106c850ba588'; // Default to the course that's failing
    const employeeId = req.query.employeeId || '6e2c2548-c04a-419b-a17c-c2feb6a3d9c6'; // Default to the employee that's failing
    
    // Results container
    const results = {
      course: { exists: false, data: null },
      employee: { exists: false, data: null },
      hr_course: { exists: false, data: null },
      user: { exists: false, data: null },
      employee_user_relation: { exists: false },
      valid_course_sample: null,
      valid_user_sample: null,
      suggestions: []
    };
    
    // 1. Check the courses table
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title, description')
        .eq('id', courseId)
        .single();
        
      if (!courseError && courseData) {
        results.course.exists = true;
        results.course.data = courseData;
      } else {
        results.suggestions.push('The specified course ID does not exist in the courses table');
        
        // Get a sample valid course ID
        const { data: sampleCourse } = await supabase
          .from('courses')
          .select('id, title')
          .limit(1);
          
        if (sampleCourse && sampleCourse.length > 0) {
          results.valid_course_sample = sampleCourse[0];
          results.suggestions.push(`Try using this valid course ID instead: ${sampleCourse[0].id}`);
        }
      }
    } catch (e) {
      results.course.error = e.message;
    }
    
    // 2. Check the hr_courses table 
    try {
      const { data: hrCourseData, error: hrCourseError } = await supabase
        .from('hr_courses')
        .select('id, title, description')
        .eq('id', courseId)
        .single();
        
      if (!hrCourseError && hrCourseData) {
        results.hr_course.exists = true;
        results.hr_course.data = hrCourseData;
        results.suggestions.push('The course exists in hr_courses but not in courses table. You need to use courses table.');
      }
    } catch (e) {
      results.hr_course.error = e.message;
    }
    
    // 3. Check the employee
    try {
      const { data: employeeData, error: employeeError } = await supabase
        .from('hr_employees')
        .select('id, name, user_id')
        .eq('id', employeeId)
        .single();
        
      if (!employeeError && employeeData) {
        results.employee.exists = true;
        results.employee.data = employeeData;
        
        if (!employeeData.user_id) {
          results.suggestions.push('The employee exists but has no user_id. This is required for the foreign key constraint.');
        } else {
          results.employee_user_relation = { exists: true, user_id: employeeData.user_id };
          
          // 4. Check if the user exists
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('id, email')
              .eq('id', employeeData.user_id)
              .single();
              
            if (!userError && userData) {
              results.user.exists = true;
              results.user.data = userData;
            } else {
              results.suggestions.push(`The employee has a user_id (${employeeData.user_id}) but this user doesn't exist in the users table`);
            }
          } catch (e) {
            results.user.error = e.message;
          }
        }
      } else {
        results.suggestions.push('The specified employee ID does not exist');
      }
    } catch (e) {
      results.employee.error = e.message;
    }
    
    // 5. Get a sample valid user ID if needed
    if (!results.user.exists) {
      try {
        const { data: sampleUser } = await supabase
          .from('users')
          .select('id, email')
          .limit(1);
          
        if (sampleUser && sampleUser.length > 0) {
          results.valid_user_sample = sampleUser[0];
          results.suggestions.push(`Try using this valid user ID for testing: ${sampleUser[0].id}`);
        }
      } catch (e) {
        // Ignore errors
      }
    }
    
    // Add concrete next steps
    if (!results.course.exists && !results.hr_course.exists) {
      results.recommendations = [
        "The course ID doesn't exist in either table. Use a valid course ID from the courses table.",
        results.valid_course_sample ? `Try course ID: ${results.valid_course_sample.id}` : "No valid course found"
      ];
    } else if (results.hr_course.exists && !results.course.exists) {
      results.recommendations = [
        "The course exists in hr_courses but not in the main courses table.",
        "You need to either create this course in the main courses table or use a different course."
      ];
    } else if (!results.employee_user_relation.exists) {
      results.recommendations = [
        "The employee doesn't have an associated user_id.",
        "Update the employee record to include a valid user_id from the users table."
      ];
    } else if (!results.user.exists) {
      results.recommendations = [
        "The user_id associated with the employee doesn't exist in the users table.",
        "Update the employee record with a valid user_id."
      ];
    } else {
      results.recommendations = [
        "All required IDs and associations look valid.",
        "Check for other issues like unique constraint violations."
      ];
    }
    
    return res.status(200).json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in id-check endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message,
      stack: error.stack
    });
  }
} 