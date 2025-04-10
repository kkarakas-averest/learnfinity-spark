// Ultra-minimal test endpoint for debugging database issues
// Only attempts to insert a single record with comprehensive error reporting

import { createClient } from '@supabase/supabase-js';

// Direct Supabase configuration
const SUPABASE_URL = "https://ujlqzkkkfatehxeqtbdl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODA4MzIsImV4cCI6MjA1NjI1NjgzMn0.ed-wciIqkubS4f2T3UNnkgqwzLEdpC-SVZoVsP7-W1E";

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Proper UUID generator
function generateProperUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
    // First, get a valid course ID from the database
    let courseId = null;
    let userId = null;
    let version = null;
    
    try {
      // Get a real course ID
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id')
        .limit(1);
        
      if (courseError || !courseData || courseData.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No courses found',
          details: courseError?.message || 'No courses are available in the database'
        });
      }
      
      courseId = courseData[0].id;
      console.log('Found valid course ID:', courseId);
      
      // Get a real user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
        
      if (userError || !userData || userData.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No users found',
          details: userError?.message || 'No users are available in the database'
        });
      }
      
      userId = userData[0].id;
      console.log('Found valid user ID:', userId);
      
      // Generate a unique version string
      version = `test-${Date.now()}`;
      
      // Generate a new UUID for the content
      const contentUuid = generateProperUUID();
      console.log('Generated content UUID:', contentUuid);
      
      // Step 1: Try to insert into ai_course_content with real foreign keys
      console.log('Attempting to insert into ai_course_content with valid foreign keys...');
      const { data: contentData, error: contentError } = await supabase
        .from('ai_course_content')
        .insert({
          id: contentUuid,
          course_id: courseId,  // Valid course ID
          version: version,
          created_for_user_id: userId,  // Valid user ID
          metadata: { title: 'Test Course', description: 'Test Description' },
          personalization_context: { test: true },
          is_active: true
        })
        .select();
      
      if (contentError) {
        console.error('Content insert error:', contentError);
        return res.status(500).json({
          success: false,
          step: 'ai_course_content insert',
          error: contentError.message,
          details: contentError.details,
          debug: {
            code: contentError.code,
            hint: contentError.hint,
            table: 'ai_course_content',
            data: {
              id: contentUuid,
              course_id: courseId,
              created_for_user_id: userId,
              version: version
            }
          }
        });
      }
      
      console.log('Successfully inserted record into ai_course_content');
      
      // Clean up - delete the record we just created
      try {
        await supabase
          .from('ai_course_content')
          .delete()
          .eq('id', contentUuid);
        console.log('Successfully cleaned up test record');
      } catch (cleanupError) {
        console.warn('Could not clean up test record:', cleanupError);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Successfully inserted and cleaned up test record',
        uuid: contentUuid,
        validIds: {
          courseId,
          userId,
          version
        }
      });
      
    } catch (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Database error',
        message: error.message,
        stack: error.stack
      });
    }
    
  } catch (generalError) {
    console.error('General error:', generalError);
    return res.status(500).json({
      success: false,
      error: 'General error',
      message: generalError.message,
      stack: generalError.stack
    });
  }
} 