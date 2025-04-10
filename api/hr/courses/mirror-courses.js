// Mirror HR courses to main courses table
// This solves the foreign key constraint issues for course personalization

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
    // Determine which course(s) to mirror
    let courseId = null;
    let employeeId = null;
    let mirrorAll = false;
    
    if (req.method === 'POST') {
      // Get params from POST body
      try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        courseId = body.courseId;
        employeeId = body.employeeId;
        mirrorAll = body.mirrorAll === true;
      } catch (e) {
        console.error('Error parsing request body:', e);
      }
    } else {
      // Get params from query string
      courseId = req.query.courseId;
      employeeId = req.query.employeeId;
      mirrorAll = req.query.mirrorAll === 'true';
    }
    
    // Results container
    const results = {
      mirrored: [],
      errors: [],
      skipped: []
    };
    
    // 1. Find HR courses to mirror
    let hrCourses = [];
    
    if (courseId) {
      // Single course mode
      const { data, error } = await supabase
        .from('hr_courses')
        .select('*')
        .eq('id', courseId);
        
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: error.message
        });
      }
      
      hrCourses = data || [];
    } else if (employeeId) {
      // Employee's courses mode
      const { data, error } = await supabase
        .from('hr_course_enrollments')
        .select(`
          course_id,
          hr_courses (*)
        `)
        .eq('employee_id', employeeId);
        
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: error.message
        });
      }
      
      hrCourses = data?.map(enrollment => enrollment.hr_courses) || [];
    } else if (mirrorAll) {
      // All HR courses mode
      const { data, error } = await supabase
        .from('hr_courses')
        .select('*');
        
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: error.message
        });
      }
      
      hrCourses = data || [];
    } else {
      return res.status(400).json({
        success: false,
        error: 'Missing parameters',
        message: 'Please provide courseId, employeeId, or set mirrorAll=true'
      });
    }
    
    // 2. Mirror each HR course to the main courses table
    for (const hrCourse of hrCourses) {
      try {
        // First check if the course already exists in the main courses table
        const { data: existingCourse, error: checkError } = await supabase
          .from('courses')
          .select('id')
          .eq('id', hrCourse.id)
          .maybeSingle();
          
        if (checkError) {
          results.errors.push({
            courseId: hrCourse.id,
            title: hrCourse.title,
            error: 'Error checking for existing course',
            details: checkError.message
          });
          continue;
        }
        
        if (existingCourse) {
          results.skipped.push({
            courseId: hrCourse.id,
            title: hrCourse.title,
            reason: 'Course already exists in main courses table'
          });
          continue;
        }
        
        // Find a valid creator user ID to satisfy the foreign key constraint
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .limit(1);
          
        if (!users || users.length === 0) {
          results.errors.push({
            courseId: hrCourse.id,
            title: hrCourse.title,
            error: 'No valid user found for created_by field'
          });
          continue;
        }
        
        const creatorId = users[0].id;
        
        // Create the mirrored course in the main courses table
        const { data: newCourse, error: insertError } = await supabase
          .from('courses')
          .insert({
            id: hrCourse.id, // Keep the same ID to maintain references
            title: hrCourse.title,
            description: hrCourse.description || 'Course imported from HR system',
            target_audience: hrCourse.audience || 'HR course participants',
            estimated_duration: hrCourse.duration || '1-2 hours',
            learning_objectives: hrCourse.objectives || [],
            created_by: creatorId,
            is_published: true,
            status: 'published',
            skill_level: hrCourse.skill_level || 'beginner',
            version: 1,
            generation_prompt: null,
            generated_by: 'hr_course_mirror',
            generation_model: null,
            generation_config: {}
          })
          .select();
          
        if (insertError) {
          results.errors.push({
            courseId: hrCourse.id,
            title: hrCourse.title,
            error: 'Error creating mirrored course',
            details: insertError.message
          });
        } else {
          results.mirrored.push({
            courseId: hrCourse.id,
            title: hrCourse.title,
            success: true
          });
        }
      } catch (e) {
        results.errors.push({
          courseId: hrCourse.id,
          title: hrCourse.title,
          error: 'Exception during mirroring',
          details: e.message
        });
      }
    }
    
    // Return results
    return res.status(200).json({
      success: true,
      mode: courseId ? 'single_course' : (employeeId ? 'employee_courses' : 'all_courses'),
      results,
      summary: {
        total: hrCourses.length,
        mirrored: results.mirrored.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      }
    });
    
  } catch (error) {
    console.error('Error in mirror-courses endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error',
      message: error.message,
      stack: error.stack
    });
  }
} 