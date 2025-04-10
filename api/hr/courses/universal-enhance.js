
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

  console.log("Universal-enhance endpoint called");
  
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
      console.log(`Fetching employee data for ID: ${employeeId}`);
      
      const { data: employee, error } = await supabase
        .from('hr_employees')
        .select(`
          id, 
          name, 
          user_id,
          department_id,
          position_id,
          hr_departments (name),
          hr_positions (title)
        `)
        .eq('id', employeeId)
        .single();
        
      if (employee) {
        employeeName = employee.name;
        departmentName = employee.hr_departments?.name || departmentName;
        positionTitle = employee.hr_positions?.title || positionTitle;
        userId = employee.user_id;
        console.log('Found employee:', employeeName, departmentName, positionTitle);
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
          console.error('Failed to fetch users:', error);
          return res.status(500).json({
            success: false,
            error: 'Database error',
            message: 'Error fetching user data: ' + error.message
          });
        } else {
          console.error('No users found in the database');
          // Create a fallback ID for development purposes
          userId = generateUUID();
          console.log('Generated fallback user ID:', userId);
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
    
    try {
      console.log(`Checking for course ${courseId} in courses table`);
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, description')
        .eq('id', courseId)
        .single();
        
      if (data) {
        course = data;
        console.log('Found course in main table:', course.title);
      } else if (error) {
        if (error.code !== 'PGRST116') {
          console.warn('Error fetching course from main table:', error);
        } else {
          console.log('Course not found in main table, will check HR courses');
        }
      }
    } catch (e) {
      console.warn('Error fetching course from main table:', e);
    }

    // If course doesn't exist in main table, try to mirror it from HR courses
    if (!course) {
      console.log('Mirroring HR course to main courses table...');
      
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
          try {
            const courseInsertData = {
              id: hrCourse.id,
              title: hrCourse.title,
              description: hrCourse.description || 'Course imported from HR system',
              is_published: true,
              status: 'published',
              created_by: userId, // Use the resolved userId
              version: 1,
              generated_by: 'hr_course_mirror'
            };
            
            // Add skill_level if it exists
            if (hrCourse.skill_level) {
              courseInsertData.level = hrCourse.skill_level;
            }
            
            // Try to insert the course
            const { data: createdCourse, error: createError } = await supabase
              .from('courses')
              .insert(courseInsertData)
              .select()
              .single();
              
            if (createError) {
              console.error('Error mirroring course:', createError);
              throw createError;
            }
            
            course = createdCourse;
            console.log('Course mirrored successfully:', course.title);
          } catch (mirrorError) {
            console.error('Error in course create operation:', mirrorError);
            
            // If insertion fails, try to get the course again (it might have been created by another request)
            const { data: existingCourse, error: existingError } = await supabase
              .from('courses')
              .select('id, title, description')
              .eq('id', courseId)
              .single();
              
            if (existingCourse && !existingError) {
              course = existingCourse;
              console.log('Using existing course:', course.title);
            }
          }
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
            level: 'beginner',
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
          level: course.level || 'intermediate',
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
      
      // Check if ai_course_content table exists
      let tableExists = true;
      try {
        const { error: checkError } = await supabase
          .from('ai_course_content')
          .select('id')
          .limit(1);
          
        if (checkError && checkError.message.includes('does not exist')) {
          tableExists = false;
        }
      } catch (e) {
        tableExists = false;
      }
      
      if (!tableExists) {
        console.log('ai_course_content table not found, using course_ai_content instead');
        // Try with alternative table name
        const { data, error } = await supabase
          .from('course_ai_content')
          .insert({
            id: contentUuid,
            course_id: course.id,
            title: course.title,
            description: course.description || 'Personalized course content',
            created_for: employeeId,
            is_personalized: true
          })
          .select();
          
        if (error) {
          console.error('Error creating content record in course_ai_content:', error);
          throw error;
        }
        console.log('Content record created successfully in course_ai_content');
      } else {
        // Insert content record into ai_course_content
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
              level: course.level || 'intermediate'
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
      }
      
      // 5. Create one sample section
      let sectionCreated = false;
      
      // Try first table name
      try {
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
          if (sectionError.message.includes('does not exist')) {
            console.log('ai_course_content_sections table not found, will try alternative');
          } else {
            console.error('Error creating section:', sectionError);
          }
        } else {
          sectionCreated = true;
          console.log('Sample section created successfully in ai_course_content_sections');
        }
      } catch (e) {
        console.warn('Error with ai_course_content_sections table:', e);
      }
      
      // Try alternative table if needed
      if (!sectionCreated) {
        try {
          console.log('Trying to create section in course_content_sections');
          const sectionTitle = `Introduction to ${course.title}`;
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
            .from('course_content_sections')
            .insert({
              content_id: contentUuid,
              module_id: `module-1-personalized-${employeeId.slice(0, 8)}`,
              section_id: 'section-1-1',
              title: sectionTitle,
              content: sectionContent,
              order_index: 0,
              created_for: employeeId
            });
            
          if (sectionError) {
            console.error('Error creating section in alternative table:', sectionError);
          } else {
            sectionCreated = true;
            console.log('Sample section created successfully in course_content_sections');
          }
        } catch (e) {
          console.error('Error with course_content_sections table:', e);
        }
      }
      
      // Update HR course enrollment if needed
      try {
        const { data, error } = await supabase
          .from('hr_course_enrollments')
          .update({
            personalized_content_id: contentUuid,
            updated_at: new Date().toISOString()
          })
          .eq('employee_id', employeeId)
          .eq('course_id', courseId);
          
        if (error) {
          console.warn('Could not update hr_course_enrollments:', error);
        } else {
          console.log('Updated hr_course_enrollments with personalized_content_id');
        }
      } catch (e) {
        console.warn('Error updating hr_course_enrollments:', e);
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
