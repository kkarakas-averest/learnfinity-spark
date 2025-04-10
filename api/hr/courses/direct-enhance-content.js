// Fixed API endpoint for enhancing HR course content with personalized data
// Using direct Supabase import instead of getSupabase helper

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// Direct Supabase configuration
const SUPABASE_URL = "https://ujlqzkkkfatehxeqtbdl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODA4MzIsImV4cCI6MjA1NjI1NjgzMn0.ed-wciIqkubS4f2T3UNnkgqwzLEdpC-SVZoVsP7-W1E";

// Create Supabase client directly
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Proper UUID generator that follows the standard format
function generateUUID() {
  // This creates a proper PostgreSQL-compatible UUID in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Request validation schema
const requestSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID format"),
  courseId: z.string().optional(),
});

// CORS headers helper
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  // Set CORS headers
  setCorsHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Parse request body
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
    
    console.log('Request received for employee:', body.employeeId);
    
    // Validate request
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error.format() 
      });
    }
    
    const { employeeId, courseId } = validationResult.data;
    
    // 1. Fetch basic employee info
    console.log('Fetching employee data');
    const { data: employee, error: employeeError } = await supabase
      .from('hr_employees')
      .select('id, name, department_id, position_id, user_id')
      .eq('id', employeeId)
      .single();
      
    if (employeeError) {
      console.error('Error fetching employee:', employeeError);
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    console.log('Employee found:', employee.name);
    
    // CRITICAL: Get the user_id from the employee record
    // This is needed for the foreign key constraint in ai_course_content
    if (!employee.user_id) {
      console.error('Employee has no associated user_id');
      return res.status(400).json({ 
        error: 'Database constraint error', 
        message: 'Employee has no associated user_id in the users table',
        details: 'The ai_course_content table requires a valid user_id reference'
      });
    }
    
    // 2. Get department and position info
    let departmentName = 'Department';
    let positionTitle = 'Position';
    
    if (employee.department_id) {
      const { data: departmentData } = await supabase
        .from('hr_departments')
        .select('name')
        .eq('id', employee.department_id)
        .single();
        
      if (departmentData) {
        departmentName = departmentData.name;
      }
    }
    
    if (employee.position_id) {
      const { data: positionData } = await supabase
        .from('hr_positions')
        .select('title')
        .eq('id', employee.position_id)
        .single();
        
      if (positionData) {
        positionTitle = positionData.title;
      }
    }
    
    // 3. Get course info
    let course = null;
    
    if (courseId) {
      console.log('Fetching course data');
      const { data: courseData, error: courseError } = await supabase
        .from('courses') // Use 'courses' table, not 'hr_courses'
        .select('id, title, description, skill_level')
        .eq('id', courseId)
        .single();
        
      if (!courseError && courseData) {
        course = courseData;
        console.log('Course found:', course.title);
      } else {
        console.error('Course not found:', courseError);
        return res.status(404).json({ 
          error: 'Database constraint error', 
          message: 'Course not found or invalid course_id',
          details: 'The ai_course_content table requires a valid course_id reference'
        });
      }
    } else {
      return res.status(400).json({ 
        error: 'Missing data', 
        message: 'courseId is required' 
      });
    }
    
    // 4. Create a personalized content record
    console.log('Creating personalized content');
    const contentUuid = generateUUID();
    const moduleUuid = generateUUID();

    // Generate a unique version string
    const versionString = `emp-${employeeId.substring(0, 6)}-${Date.now()}`;

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
      
      console.log('Generated contentUuid:', contentUuid); // Log UUID for debugging
      console.log('Generated moduleUuid:', moduleUuid); // Log UUID for debugging
      
      // Insert content record
      const insertResult = await supabase
        .from('ai_course_content')
        .insert({
          id: contentUuid,
          course_id: courseId,
          version: versionString,
          created_for_user_id: employee.user_id, // Use the user_id from employee record
          metadata: {
            title: course.title,
            description: course.description || 'Course description',
            level: course.skill_level || 'intermediate'
          },
          personalization_context: personalizationContext,
          is_active: true
        })
        .select();
        
      if (insertResult.error) {
        console.error('Error creating content record:', insertResult.error);
        return res.status(500).json({ 
          error: 'Database error', 
          message: insertResult.error.message,
          details: insertResult.error.details || 'No additional details',
          hint: 'Check data types for the ai_course_content table'
        });
      }
      
      console.log('Content record created successfully');
      
      // 5. Create one sample section
      const sectionTitle = `${course.title} for ${positionTitle}s`;
      const sectionContent = `
        <div class="prose max-w-none">
          <h2>Welcome ${employee.name}</h2>
          <p>This course has been personalized for your role as a ${positionTitle} in the ${departmentName} department.</p>
          <p>${course.description || 'This course will help you develop skills relevant to your role.'}</p>
          <h3>Why This Matters To You</h3>
          <p>As a ${positionTitle}, understanding these concepts will help you excel in your daily responsibilities and contribute more effectively to your team's success.</p>
        </div>
      `;
      
      const sectionResult = await supabase
        .from('ai_course_content_sections')
        .insert({
          content_id: contentUuid,
          module_id: moduleUuid,
          section_id: 'section-1-1',
          title: sectionTitle,
          content: sectionContent,
          order_index: 0
        });
        
      if (sectionResult.error) {
        console.error('Error creating section:', sectionResult.error);
        return res.status(500).json({
          error: 'Database section creation error',
          message: sectionResult.error.message,
          details: sectionResult.error.details || 'No additional details',
          hint: 'Check data types for the ai_course_content_sections table'
        });
      } else {
        console.log('Sample section created successfully');
      }
      
      // 6. Create one sample quiz question
      const questionResult = await supabase
        .from('ai_course_quiz_questions')
        .insert({
          content_id: contentUuid,
          module_id: moduleUuid,
          question: `How is this course relevant to your role as a ${positionTitle}?`,
          options: JSON.stringify([
            `It provides general knowledge unrelated to ${departmentName}`,
            `It's specifically tailored to ${positionTitle}s in the ${departmentName} department`,
            `It's only relevant for managers`,
            `It's only relevant for technical roles`
          ]),
          correct_answer: `It's specifically tailored to ${positionTitle}s in the ${departmentName} department`,
          explanation: `This course has been personalized to address the unique challenges and responsibilities of ${positionTitle}s in the ${departmentName} department.`,
          difficulty: 'intermediate'
        });
        
      if (questionResult.error) {
        console.error('Error creating quiz question:', questionResult.error);
        return res.status(500).json({
          error: 'Database quiz creation error',
          message: questionResult.error.message,
          details: questionResult.error.details || 'No additional details',
          hint: 'Check data types for the ai_course_quiz_questions table'
        });
      } else {
        console.log('Sample quiz question created successfully');
      }
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Basic personalized course content created successfully',
        contentId: contentUuid,
        course: {
          id: course.id,
          title: course.title
        },
        employee: {
          name: employee.name,
          role: positionTitle,
          department: departmentName
        }
      });
      
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ 
        error: 'Database error', 
        message: dbError.message
      });
    }
    
  } catch (error) {
    console.error('General error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      message: error.message
    });
  }
} 