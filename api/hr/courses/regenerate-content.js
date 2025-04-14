import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract authentication token with fallbacks for different methods
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.query.access_token || req.body.access_token;
    
    if (!accessToken) {
      console.log('[regenerate-content] No access token found in request');
      return res.status(401).json({ 
        error: 'Unauthorized', 
        details: 'No access token provided. Please log in again.' 
      });
    }
    
    // Authenticate using the token directly
    console.log('[regenerate-content] Authenticating with token...');
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    
    if (userError || !userData?.user) {
      console.error('[regenerate-content] Auth error:', userError);
      return res.status(401).json({ 
        error: 'Unauthorized', 
        details: userError?.message || 'Invalid authentication token' 
      });
    }
    
    const userId = userData.user.id;
    console.log('[regenerate-content] Authentication successful for user:', userId);
    
    // Extract request data
    const { courseId, forceRegenerate = true, personalizationOptions = {} } = req.body;
    
    if (!courseId) {
      return res.status(400).json({ error: 'Course ID is required' });
    }
    
    // Process the request directly here instead of forwarding
    // This avoids any potential authentication issues with internal redirects
    
    // 1. Update learner profile if needed
    if (personalizationOptions) {
      const { error: profileError } = await supabase
        .from('learner_profiles')
        .upsert({
          user_id: userId,
          ...personalizationOptions
        });
      
      if (profileError) {
        console.error('[regenerate-content] Error updating learner profile:', profileError);
      }
    }
    
    // 2. Get employee ID from mapping
    let targetEmployeeId = userId;
    const { data: mappingData } = await supabase
      .from('employee_user_mapping')
      .select('employee_id')
      .eq('user_id', userId)
      .single();
      
    if (mappingData?.employee_id) {
      targetEmployeeId = mappingData.employee_id;
    }
    
    // 3. Verify course exists
    const { data: courseData, error: courseError } = await supabase
      .from('hr_courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (courseError || !courseData) {
      return res.status(404).json({
        error: 'Course not found',
        details: courseError?.message
      });
    }
    
    // 4. Clean up existing content if regeneration is requested
    if (forceRegenerate) {
      // Clear from hr_personalized_course_content
      const { data: personalizedContent } = await supabase
        .from('hr_personalized_course_content')
        .select('id')
        .eq('course_id', courseId)
        .eq('employee_id', targetEmployeeId);
      
      if (personalizedContent?.length > 0) {
        console.log(`[regenerate-content] Removing ${personalizedContent.length} entries from hr_personalized_course_content`);
        for (const content of personalizedContent) {
          await supabase
            .from('hr_personalized_course_content')
            .delete()
            .eq('id', content.id);
        }
      }
      
      // Clear from ai_generated_course_content
      const { data: legacyContent } = await supabase
        .from('ai_generated_course_content')
        .select('id')
        .eq('course_id', courseId)
        .eq('created_by', userId);
      
      if (legacyContent?.length > 0) {
        console.log(`[regenerate-content] Removing ${legacyContent.length} entries from ai_generated_course_content`);
        
        // Delete related data first
        for (const content of legacyContent) {
          await supabase
            .from('course_content_sections')
            .delete()
            .eq('content_id', content.id);
            
          await supabase
            .from('course_module_quizzes')
            .delete()
            .eq('content_id', content.id);
        }
        
        // Then delete main content
        for (const content of legacyContent) {
          await supabase
            .from('ai_generated_course_content')
            .delete()
            .eq('id', content.id);
        }
      }
      
      // Clear from ai_course_content
      const { data: aiContent } = await supabase
        .from('ai_course_content')
        .select('id')
        .eq('course_id', courseId)
        .eq('created_for_user_id', userId);
      
      if (aiContent?.length > 0) {
        console.log(`[regenerate-content] Removing ${aiContent.length} entries from ai_course_content`);
        
        // Delete sections first
        for (const content of aiContent) {
          await supabase
            .from('ai_course_content_sections')
            .delete()
            .eq('content_id', content.id);
        }
        
        // Then delete main content
        for (const content of aiContent) {
          await supabase
            .from('ai_course_content')
            .delete()
            .eq('id', content.id);
        }
      }
    }
    
    // 5. Trigger content generation via generate-content endpoint
    // We'll use node-fetch directly from the server
    // This eliminates browser CORS issues
    try {
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;
        
      // Using native fetch if available (Node.js 18+) or a polyfill
      const fetch = (await import('node-fetch')).default;
      
      // Check if GROQ_API_KEY is set in environment
      const hasGroqApiKey = !!process.env.GROQ_API_KEY;
      console.log(`[regenerate-content] GROQ_API_KEY is ${hasGroqApiKey ? 'set' : 'NOT set'} in environment`);
      
      const generateContentEndpoint = `${baseUrl}/api/hr/courses/generate-content`;
      console.log(`[regenerate-content] Triggering content generation at ${generateContentEndpoint}`, {
        courseId,
        employeeId: targetEmployeeId,
        hasGroqApiKey
      });
      
      const startTime = Date.now();
      const response = await fetch(generateContentEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          courseId,
          employeeId: targetEmployeeId,
          personalizationOptions,
          access_token: accessToken
        })
      });
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[regenerate-content] Generation service error:', {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorText,
          responseTime: `${responseTime}ms`,
          headers: Array.from(response.headers.entries())
            .filter(([key]) => !key.toLowerCase().includes('authorization'))
            .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {})
        });
        
        // We'll continue and not fail the request if generation fails
        // The user can try regenerating again
        console.log('[regenerate-content] Continuing despite generation service error');
      } else {
        const responseData = await response.json();
        console.log('[regenerate-content] Successfully triggered content generation', {
          responseTime: `${responseTime}ms`,
          responseData: {
            success: responseData.success,
            message: responseData.message,
            contentId: responseData.content?.id,
            generatedModules: responseData.content?.modules?.length
          }
        });
      }
    } catch (generationError) {
      // Log but don't fail the request
      console.error('[regenerate-content] Error calling generation service:', {
        error: generationError.message,
        stack: generationError.stack,
        code: generationError.code
      });
    }
    
    // 6. Return success with course data
    return res.status(200).json({
      success: true,
      message: 'Course content regeneration started successfully',
      course: courseData
    });
  } catch (error) {
    console.error('[regenerate-content] Unhandled error:', error);
    return res.status(500).json({ 
      error: 'Server error', 
      details: error.message || 'An unexpected error occurred'
    });
  }
} 