// Endpoint to check database permissions for each table involved in course enhancement
// This tests read/write access to all tables needed

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
    // Test tables for read access
    const readResults = {};
    const tables = [
      'users',
      'hr_employees',
      'hr_departments',
      'hr_positions',
      'hr_courses',
      'hr_course_enrollments',
      'ai_course_content',
      'ai_course_content_sections',
      'ai_course_quiz_questions'
    ];
    
    // Test read access for each table
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('id')
          .limit(1);
        
        readResults[table] = {
          success: !error,
          error: error ? error.message : null,
          hasData: data && data.length > 0
        };
      } catch (e) {
        readResults[table] = {
          success: false,
          error: e.message,
          exception: true
        };
      }
    }
    
    // Test write access to AI course content tables
    const writeResults = {};
    const testUuid = generateTestUuid();
    
    // Test ai_course_content table
    try {
      const { data, error } = await supabase
        .from('ai_course_content')
        .insert({
          id: testUuid,
          course_id: testUuid,
          version: 'test',
          created_for_user_id: testUuid,
          metadata: { test: true },
          personalization_context: { test: true },
          is_active: false
        })
        .select();
      
      writeResults.ai_course_content = {
        success: !error,
        error: error ? error.message : null
      };
      
      // Clean up test data if insert was successful
      if (!error) {
        await supabase
          .from('ai_course_content')
          .delete()
          .eq('id', testUuid);
      }
    } catch (e) {
      writeResults.ai_course_content = {
        success: false,
        error: e.message,
        exception: true
      };
    }
    
    // Test ai_course_content_sections table
    try {
      const { data, error } = await supabase
        .from('ai_course_content_sections')
        .insert({
          content_id: testUuid,
          module_id: testUuid,
          section_id: 'test-section',
          title: 'Test Section',
          content: '<p>Test content</p>',
          order_index: 0
        })
        .select();
      
      writeResults.ai_course_content_sections = {
        success: !error,
        error: error ? error.message : null
      };
      
      // Clean up test data if insert was successful
      if (!error) {
        await supabase
          .from('ai_course_content_sections')
          .delete()
          .eq('content_id', testUuid);
      }
    } catch (e) {
      writeResults.ai_course_content_sections = {
        success: false,
        error: e.message,
        exception: true
      };
    }
    
    // Test ai_course_quiz_questions table
    try {
      const { data, error } = await supabase
        .from('ai_course_quiz_questions')
        .insert({
          content_id: testUuid,
          module_id: testUuid,
          question: 'Test question?',
          options: JSON.stringify(['A', 'B', 'C']),
          correct_answer: 'A',
          explanation: 'Test explanation',
          difficulty: 'easy'
        })
        .select();
      
      writeResults.ai_course_quiz_questions = {
        success: !error,
        error: error ? error.message : null
      };
      
      // Clean up test data if insert was successful
      if (!error) {
        await supabase
          .from('ai_course_quiz_questions')
          .delete()
          .eq('content_id', testUuid);
      }
    } catch (e) {
      writeResults.ai_course_quiz_questions = {
        success: false,
        error: e.message,
        exception: true
      };
    }
    
    return res.status(200).json({
      success: true,
      message: 'Database permissions check complete',
      read: readResults,
      write: writeResults,
      timestamp: new Date().toISOString(),
      clientInfo: {
        initialized: !!supabase,
        hasAuth: !!supabase.auth,
        hasFrom: typeof supabase.from === 'function'
      }
    });
  } catch (error) {
    console.error('Error in db-permissions-check endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'General error',
      message: error.message,
      stack: error.stack
    });
  }
}

// Generate a test UUID for database operations
function generateTestUuid() {
  return 'test-' + Math.random().toString(36).substring(2, 15);
} 