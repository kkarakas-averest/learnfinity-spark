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
    // Generate test UUIDs
    const contentUuid = generateProperUUID();
    const testUserId = generateProperUUID();
    const testCourseId = generateProperUUID();
    
    console.log('Test UUIDs:');
    console.log('- contentUuid:', contentUuid);
    console.log('- testUserId:', testUserId);
    console.log('- testCourseId:', testCourseId);
    
    // Try each insert one by one with detailed error reporting
    
    // Step 1: Try to insert into ai_course_content
    try {
      console.log('Attempting to insert into ai_course_content...');
      const { data: contentData, error: contentError } = await supabase
        .from('ai_course_content')
        .insert({
          id: contentUuid,
          course_id: testCourseId,
          version: 'test-version',
          created_for_user_id: testUserId,
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
              course_id: testCourseId,
              created_for_user_id: testUserId
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
        uuid: contentUuid
      });
      
    } catch (error) {
      console.error('Unhandled database error:', error);
      return res.status(500).json({
        success: false,
        error: 'Unhandled database error',
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