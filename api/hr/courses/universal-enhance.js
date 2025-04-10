
// Universal course enhancement endpoint that works with any employee
// This finds valid course IDs and user IDs if the provided ones aren't valid

import { createClient } from '@supabase/supabase-js';

// Direct Supabase configuration
const SUPABASE_URL = "https://ujlqzkkkfatehxeqtbdl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODA4MzIsImV4cCI6MjA1NjI1NjgzMn0.ed-wciIqkubS4f2T3UNnkgqwzLEdpC-SVZoVsP7-W1E";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Proper UUID generator
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Get input parameters - either from query params or POST body
    let employeeId, courseId;
    
    if (req.method === 'POST') {
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        employeeId = body.employeeId;
        courseId = body.courseId;
      } catch (e) {
        console.error('Error parsing request body:', e);
        return res.status(400).json({
          success: false,
          error: 'Invalid request body',
          message: e.message
        });
      }
    } else {
      employeeId = req.query.employeeId;
      courseId = req.query.courseId;
    }
    
    console.log('Input parameters:', { employeeId, courseId });
    
    if (!employeeId || !courseId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Both employeeId and courseId are required'
      });
    }
    
    // 1. Resolve employee information
    let employeeName = 'Employee';
    let departmentName = 'Department';
    let positionTitle = 'Position';
    let userId = null;
    
    // Try to get valid employee info if an ID was provided
    try {
      const { data: employee, error } = await supabase
        .from('hr_employees')
        .select(`
          id, 
          name, 
          user_id,
          department_id,
          position_id,
          hr_departments(name),
          hr_positions(title)
        `)
        .eq('id', employeeId)
        .single();
        
      if (employee) {
        employeeName = employee.name;
        departmentName = employee.hr_departments?.name || departmentName;
        positionTitle = employee.hr_positions?.title || positionTitle;
        userId = employee.user_id;
        console.log('Found employee:', employeeName);
      } else if (error) {
        console.warn('Error fetching employee:', error);
      }
    } catch (e) {
      console.warn('Error fetching employee:', e);
    }
    
    // 2. Ensure we have a valid user ID (needed for foreign key constraint)
    if (!userId) {
      // If employee doesn't have a valid user_id, get the first user from the database
      try {
        const { data: users, error } = await supabase
          .from('users')
          .select('id')
          .limit(1);
          
        if (users && users.length > 0) {
          userId = users[0].id;
          console.log('Using alternate user ID:', userId);
        } else if (error) {
          throw new Error(`Failed to fetch users: ${error.message}`);
        } else {
          throw new Error('No users found in the database');
        }
      } catch (e) {
        console.error('Error fetching users:', e);
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: 'Error fetching user data: ' + e.message
        });
      }
    }
    
    // 3. Check if course exists in main courses table
    let course = null;
    
    // Try to get the specified course from the main courses table
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description, skill_level')
        .eq('id', courseId)
        .single();
        
      if (data) {
        course = data;
        console.log('Found course in main table:', course.title);
      } else if (error && error.code !== 'PGRST116') {
        console.warn('Error fetching course from main table:', error);
      }
    } catch (e) {
      console.warn('Error fetching course from main table:', e);
    }
    
    // If course doesn't exist in main table, try to mirror it from HR courses
    if (!course) {
      console.log('Course not found in main table, checking HR courses...');
      
      try {
        // First check if it exists in hr_courses
        const { data: hrCourse, error: hrError } = await supabase
          .from('hr_courses')
          .select('id, title, description, skill_level')
          .eq('id', courseId)
          .single();
        
        if (hrCourse) {
          console.log('Found course in HR table:', hrCourse.title);
          
          // Create a new entry in the main courses table
          const { data: createdCourse, error: createError } = await supabase
            .from('courses')
            .insert({
              id: hrCourse.id,
              title: hrCourse.title,
              description: hrCourse.description || 'Course imported from HR system',
              skill_level: hrCourse.skill_level || 'beginner',
              is_published: true,
              status: 'published',
              created_by: userId, // Use the resolved userId
              version: 1,
              generated_by: 'hr_course_mirror'
            })
            .select()
            .single();
            
          if (createError) {
            console.error('Error mirroring course:', createError);
            throw createError;
          }
          
          course = createdCourse;
          console.log('Course mirrored successfully:', course.title);
        } else if (hrError && hrError.code !== 'PGRST116') {
          console.warn('Error checking HR courses:', hrError);
        } else {
          console.warn('Course not found in HR courses either');
        }
      } catch (e) {
        console.error('Error in course mirroring process:', e);
      }
    }
    
    // If we still don't have a course, create a placeholder
    if (!course) {
      console.log('Creating placeholder course...');
      const placeholderId = courseId || generateUUID();
      const placeholderTitle = 'Personalized Learning Course';
      
      try {
        const { data: createdCourse, error: createError } = await supabase
          .from('courses')
          .insert({
            id: placeholderId,
            title: placeholderTitle,
            description: 'Automatically generated personalized learning content',
            skill_level: 'beginner',
            is_published: true,
            status: 'published',
            created_by: userId,
            version: 1,
            generated_by: 'universal_enhance'
          })
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating placeholder course:', createError);
          throw createError;
        }
        
        course = createdCourse;
        console.log('Placeholder course created:', course.title);
      } catch (e) {
        console.error('Error creating placeholder course:', e);
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: 'Failed to create placeholder course: ' + e.message
        });
      }
    }
    
    // 4. Create a personalized content record
    console.log('Creating personalized content with:');
    console.log('- Course ID:', course.id);
    console.log('- User ID:', userId);
    console.log('- Employee name:', employeeName);
    console.log('- Department:', departmentName);
    console.log('- Position:', positionTitle);
    
    const contentUuid = generateUUID();
    const moduleUuid = generateUUID();
    const versionString = `auto-${Date.now()}`;
    
    try {
      // Create personalization context
      const personalizationContext = {
        userProfile: {
          role: positionTitle,
          department: departmentName
        },
        courseContext: {
          title: course.title,
          level: course.skill_level || 'intermediate',
          learningObjectives: [
            `Understand concepts relevant to your ${positionTitle} role`,
            `Apply principles to ${departmentName} department challenges`,
            `Develop skills relevant to your position`
          ]
        },
        employeeContext: {
          department: departmentName,
          position: positionTitle,
          skills: []
        }
      };
      
      // Insert content record
      const { data, error } = await supabase
        .from('ai_course_content')
        .insert({
          id: contentUuid,
          course_id: course.id,
          version: versionString,
          created_for_user_id: userId,
          metadata: {
            title: course.title,
            description: course.description || 'Course description',
            level: course.skill_level || 'intermediate'
          },
          personalization_context: personalizationContext,
          is_active: true
        })
        .select();
        
      if (error) {
        console.error('Error creating content record:', error);
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: error.message,
          details: error.details || 'No additional details'
        });
      }
      
      console.log('Content record created successfully');
      
      // 5. Create one sample section
      const sectionTitle = `${course.title} for ${positionTitle}s`;
      const sectionContent = `
        <div class="prose max-w-none">
          <h2>Welcome ${employeeName}</h2>
          <p>This course has been personalized for your role as a ${positionTitle} in the ${departmentName} department.</p>
          <p>${course.description || 'This course will help you develop skills relevant to your role.'}</p>
          <h3>Why This Matters To You</h3>
          <p>As a ${positionTitle}, understanding these concepts will help you excel in your daily responsibilities and contribute more effectively to your team's success.</p>
        </div>
      `;
      
      const { error: sectionError } = await supabase
        .from('ai_course_content_sections')
        .insert({
          content_id: contentUuid,
          module_id: moduleUuid,
          section_id: 'section-1-1',
          title: sectionTitle,
          content: sectionContent,
          order_index: 0
        });
        
      if (sectionError) {
        console.error('Error creating section:', sectionError);
      } else {
        console.log('Sample section created successfully');
      }
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Personalized course content created successfully',
        contentId: contentUuid,
        course: {
          id: course.id,
          title: course.title
        },
        employee: {
          name: employeeName,
          role: positionTitle,
          department: departmentName
        }
      });
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: dbError.message
      });
    }
    
  } catch (error) {
    console.error('General error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message
    });
  }
}
