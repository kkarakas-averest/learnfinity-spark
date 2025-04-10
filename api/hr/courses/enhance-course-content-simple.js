// Simplified API endpoint for enhancing course content
// This version bypasses GROQ API entirely to diagnose server issues

import { getSupabase } from '../../../src/lib/supabase.js';
import { z } from 'zod';

// Simple UUID generator
function generateSimpleUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
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
    
    // Get Supabase instance
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ error: 'Failed to initialize database connection' });
    }
    
    // 1. Fetch basic employee info
    console.log('Fetching employee data');
    const { data: employee, error: employeeError } = await supabase
      .from('hr_employees')
      .select('id, name')
      .eq('id', employeeId)
      .single();
      
    if (employeeError) {
      console.error('Error fetching employee:', employeeError);
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    console.log('Employee found:', employee.name);
    
    // 2. Get course info (if specified)
    let course = { id: courseId, title: 'Example Course' };
    
    if (courseId) {
      console.log('Fetching course data');
      const { data: courseData, error: courseError } = await supabase
        .from('hr_courses')
        .select('id, title')
        .eq('id', courseId)
        .single();
        
      if (!courseError && courseData) {
        course = courseData;
        console.log('Course found:', course.title);
      } else {
        console.log('Course not found, using default title');
      }
    }
    
    // 3. Create a simple content record
    console.log('Creating content record');
    const contentUuid = generateSimpleUUID();
    
    try {
      const insertResult = await supabase
        .from('ai_course_content')
        .insert({
          id: contentUuid,
          course_id: course.id,
          version: `simple-v1-${Date.now()}`,
          created_for_user_id: employeeId,
          metadata: {
            title: course.title || 'Course',
            description: 'Sample course description',
            level: 'intermediate'
          },
          personalization_context: {
            userProfile: {
              role: 'Employee',
              department: 'Department'
            },
            employeeContext: {
              skills: []
            }
          },
          is_active: true
        })
        .select();
      
      if (insertResult.error) {
        console.error('Error creating content record:', insertResult.error);
        return res.status(500).json({ 
          error: 'Database error', 
          message: insertResult.error.message
        });
      }
      
      console.log('Content record created successfully');
      
      // 4. Create one sample module
      const moduleUuid = generateSimpleUUID();
      
      // 5. Create one sample section
      const sectionResult = await supabase
        .from('ai_course_content_sections')
        .insert({
          content_id: contentUuid,
          module_id: moduleUuid,
          section_id: 'section-1-1',
          title: 'Sample Section',
          content: '<div class="prose max-w-none"><p>This is sample content created for testing.</p></div>',
          order_index: 0
        });
        
      if (sectionResult.error) {
        console.error('Error creating section:', sectionResult.error);
      } else {
        console.log('Sample section created successfully');
      }
      
      // 6. Create one sample quiz question
      const questionResult = await supabase
        .from('ai_course_quiz_questions')
        .insert({
          content_id: contentUuid,
          module_id: moduleUuid,
          question: 'Sample question?',
          options: JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']),
          correct_answer: 'Option A',
          explanation: 'This is a sample explanation',
          difficulty: 'intermediate'
        });
        
      if (questionResult.error) {
        console.error('Error creating quiz question:', questionResult.error);
      } else {
        console.log('Sample quiz question created successfully');
      }
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Basic course content created successfully',
        contentId: contentUuid
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