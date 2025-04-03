import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

/**
 * This script checks if the dashboard is showing real data from the database.
 * It simulates a call to the dashboard API and compares the results with
 * the data directly from the database.
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
  
  console.log('Checking dashboard data for user:', userEmail);
  
  try {
    // 1. First get the employee ID for the user
    console.log('\nGetting employee data from database...');
    const { data: employee, error: empError } = await supabase
      .from('hr_employees')
      .select('id, name, email')
      .eq('email', userEmail)
      .single();
      
    if (empError) {
      console.error('Error fetching employee:', empError.message);
      return;
    }
    
    console.log('Employee found:', employee);
    
    // 2. Directly fetch the data from the database
    console.log('\nFetching course enrollments from database...');
    const { data: courseEnrollments, error: ceError } = await supabase
      .from('hr_course_enrollments')
      .select(`
        id,
        course_id,
        status,
        progress,
        enrollment_date,
        completion_date,
        hr_courses(id, title, description)
      `)
      .eq('employee_id', employee.id);
      
    if (ceError) {
      console.error('Error fetching course enrollments:', ceError.message);
    } else {
      console.log('Course enrollments from database:', JSON.stringify(courseEnrollments, null, 2));
    }
    
    console.log('\nFetching learning path enrollments from database...');
    const { data: lpEnrollments, error: lpError } = await supabase
      .from('hr_learning_path_enrollments')
      .select(`
        id,
        learning_path_id,
        status,
        progress,
        enrollment_date,
        completion_date,
        hr_learning_paths(id, title, description)
      `)
      .eq('employee_id', employee.id);
      
    if (lpError) {
      console.error('Error fetching learning path enrollments:', lpError.message);
    } else {
      console.log('Learning path enrollments from database:', JSON.stringify(lpEnrollments, null, 2));
    }
    
    // 3. Now simulate a call to the dashboard API
    console.log('\nSimulating dashboard API call...');
    
    // Try different possible API endpoints
    const possibleEndpoints = [
      `/api/learner/dashboard?userId=${employee.id}`,
      `/api/dashboard?userId=${employee.id}`,
      `/learner/api/dashboard?userId=${employee.id}`,
      `/learner-dashboard?userId=${employee.id}`,
      `/api/v1/learner/dashboard?userId=${employee.id}`,
      `/api/learner-dashboard?userId=${employee.id}`
    ];
    
    let dashboardData = null;
    let successEndpoint = null;
    
    console.log('Trying multiple possible endpoints...');
    
    // Try each possible endpoint
    for (const endpoint of possibleEndpoints) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const url = baseUrl + endpoint;
      console.log(`Trying: ${url}`);
      
      try {
        const response = await fetch(url);
        if (response.ok) {
          console.log(`Success with endpoint: ${endpoint}`);
          dashboardData = await response.json();
          successEndpoint = endpoint;
          break;
        } else {
          console.log(`Failed with status: ${response.status}`);
        }
      } catch (err) {
        console.log(`Error with endpoint ${endpoint}: ${err.message}`);
      }
    }
    
    // If no endpoint worked, try with the API server directly
    if (!dashboardData) {
      console.log('\nTrying API server directly...');
      
      const apiServerPorts = [3083, 8084, 3000];
      for (const port of apiServerPorts) {
        const url = `http://localhost:${port}/api/learner/dashboard?userId=${employee.id}`;
        console.log(`Trying: ${url}`);
        
        try {
          const response = await fetch(url);
          if (response.ok) {
            console.log(`Success with API server on port: ${port}`);
            dashboardData = await response.json();
            successEndpoint = `/api/learner/dashboard?userId=${employee.id} (port ${port})`;
            break;
          } else {
            console.log(`Failed with status: ${response.status}`);
          }
        } catch (err) {
          console.log(`Error with API server on port ${port}: ${err.message}`);
        }
      }
    }
    
    if (!dashboardData) {
      console.error('\nFailed to fetch dashboard data from any endpoint');
      console.log('You may need to make sure the API server is running or update the API endpoint');
      return;
    }
      
    console.log('\nDashboard data from API:');
    console.log(`Endpoint used: ${successEndpoint}`);
    console.log('Courses:', dashboardData.courses?.items?.length || 0);
    console.log('Learning Paths:', dashboardData.learningPaths?.length || 0);
    
    // 4. Compare the results
    console.log('\nComparing API data with database data:');
    
    // Check if courses match
    const apiCourseIds = dashboardData.courses?.items?.map(c => c.id) || [];
    const dbCourseIds = courseEnrollments.map(ce => ce.course_id);
    
    const missingInApi = dbCourseIds.filter(id => !apiCourseIds.includes(id));
    const missingInDb = apiCourseIds.filter(id => !dbCourseIds.includes(id));
    
    console.log('Courses in DB but not in API:', missingInApi);
    console.log('Courses in API but not in DB:', missingInDb);
    console.log('Course data match:', missingInApi.length === 0 && missingInDb.length === 0);
    
    // Check if learning paths match
    const apiLpIds = dashboardData.learningPaths?.map(lp => lp.id) || [];
    const dbLpIds = lpEnrollments.map(lpe => lpe.learning_path_id);
    
    const lpMissingInApi = dbLpIds.filter(id => !apiLpIds.includes(id));
    const lpMissingInDb = apiLpIds.filter(id => !dbLpIds.includes(id));
    
    console.log('Learning paths in DB but not in API:', lpMissingInApi);
    console.log('Learning paths in API but not in DB:', lpMissingInDb);
    console.log('Learning path data match:', lpMissingInApi.length === 0 && lpMissingInDb.length === 0);
    
    // Final conclusion
    if (missingInApi.length === 0 && missingInDb.length === 0 && 
        lpMissingInApi.length === 0 && lpMissingInDb.length === 0) {
      console.log('\nCONCLUSION: Dashboard API is showing REAL data from the database!');
    } else if (apiCourseIds.length === 0 && apiLpIds.length === 0) {
      console.log('\nCONCLUSION: Dashboard API is showing MOCK data (no real data detected)!');
    } else {
      console.log('\nCONCLUSION: Dashboard API is showing MIXED data (some real, some mock)!');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 