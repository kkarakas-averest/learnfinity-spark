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
      }
    } else {
      employeeId = req.query.employeeId;
      courseId = req.query.courseId;
    }
    
    console.log('Input parameters:', { employeeId, courseId });
    
    // 1. Resolve employee information
    let employeeName = 'Employee';
    let departmentName = 'Department';
    let positionTitle = 'Position';
    let userId = null;
    
    // Try to get valid employee info if an ID was provided
    if (employeeId) {
      try {
        const { data: employee } = await supabase
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
        }
      } catch (e) {
        console.warn('Error fetching employee:', e);
      }
    }
    
    // 2. Ensure we have a valid user ID (needed for foreign key constraint)
    if (!userId) {
      // If employee doesn't have a valid user_id, get the first user from the database
      try {
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .limit(1);
          
        if (users && users.length > 0) {
          userId = users[0].id;
          console.log('Using alternate user ID:', userId);
        } else {
          return res.status(404).json({
            success: false,
            error: 'No users found in the database',
            message: 'Cannot create course content without a valid user ID'
          });
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
    
    // 3. Ensure we have a valid course ID
    let course = null;
    
    // Try to get the specified course if an ID was provided
    if (courseId) {
      try {
        const { data } = await supabase
          .from('courses')
          .select('id, title, description, skill_level')
          .eq('id', courseId)
          .single();
          
        if (data) {
          course = data;
          console.log('Found course:', course.title);
        }
      } catch (e) {
        console.warn('Error fetching specified course:', e);
      }
    }
    
    // If we don't have a valid course yet, get the first one from the database
    if (!course) {
      try {
        const { data } = await supabase
          .from('courses')
          .select('id, title, description, skill_level')
          .limit(1);
          
        if (data && data.length > 0) {
          course = data[0];
          console.log('Using alternate course:', course.title);
        } else {
          return res.status(404).json({
            success: false,
            error: 'No courses found in the database',
            message: 'Cannot create course content without a valid course'
          });
        }
      } catch (e) {
        console.error('Error fetching courses:', e);
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: 'Error fetching course data: ' + e.message
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
        },
        userIdUsed: userId,
        note: userId !== (employeeId ? 'Used original employee user_id' : 'Used alternative user_id')
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