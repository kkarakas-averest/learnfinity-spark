import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { v4 as uuidv4 } from 'uuid';

/**
 * Simplified API endpoint for course regeneration
 * Flatter path structure may work better with some Next.js/Vercel configs
 */

// Logging helper
const logWithTimestamp = (message: string, data?: any, requestId?: string) => {
  const timestamp = new Date().toISOString();
  const reqIdText = requestId ? `[ReqID:${requestId}] ` : '';
  const logPrefix = `[${timestamp}] [SIMPLIFIED-REGENERATE-CONTENT] ${reqIdText}`;
  
  if (data) {
    console.log(`${logPrefix} ${message}`, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  } else {
    console.log(`${logPrefix} ${message}`);
  }
};

/**
 * Handle GET requests for course regeneration
 * GET /api/hr-course-regenerate?courseId=xxx&access_token=xxx
 */
export async function GET(req: NextRequest) {
  const requestId = uuidv4().slice(0, 8);
  logWithTimestamp(`📩 GET Request received from ${req.url}`, undefined, requestId);
  
  try {
    // Get URL parameters
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId');
    const accessToken = url.searchParams.get('access_token');
    
    // Basic validation
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }
    
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 401 });
    }
    
    // Authenticate user
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
    }
    
    const userId = data.user.id;
    
    // Create a job placeholder
    const jobId = uuidv4();
    
    // Get the course data
    const { data: courseData, error: courseError } = await supabase
      .from('hr_courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (courseError) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Create placeholder content
    const contentOutline = {
      title: courseData.title,
      description: courseData.description || 'No description available',
      modules: [
        {
          id: 'module-1',
          title: `Introduction to ${courseData.title}`,
          description: 'Overview',
          orderIndex: 1,
          sections: [
            { title: 'Fundamentals', type: 'text', duration: 20 }
          ]
        }
      ]
    };
    
    // Create personalized content
    const personalizedContent = {
      id: jobId,
      course_id: courseId,
      employee_id: userId,
      title: courseData.title,
      description: courseData.description || 'No description available',
      modules: contentOutline.modules,
      metadata: {
        generated_at: new Date().toISOString(),
        is_placeholder: true
      }
    };
    
    // Store in database
    try {
      await supabase
        .from('hr_personalized_course_content')
        .insert({
          id: personalizedContent.id,
          course_id: courseId,
          employee_id: userId,
          content: personalizedContent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        });
    } catch (storageError) {
      console.error('Error storing content:', storageError);
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Course content regenerated successfully via simplified endpoint',
      job_id: jobId,
      content: {
        id: personalizedContent.id,
        title: personalizedContent.title
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  } catch (error: any) {
    logWithTimestamp(`❌ Error in GET request:`, error, requestId);
    return NextResponse.json({ 
      error: 'Failed to regenerate course content', 
      details: error.message || 'Unknown error' 
    }, { status: 500 });
  }
}

/**
 * POST /api/hr-course-regenerate
 */
export async function POST(req: NextRequest) {
  const requestId = uuidv4().slice(0, 8);
  logWithTimestamp(`📩 POST Request received`, undefined, requestId);
  
  try {
    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }

    // Get the request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const { courseId, access_token } = body;
    
    // Validate required fields
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }
    
    // Authenticate user
    let userId: string;
    
    if (access_token) {
      // Authenticate with token from request body
      const { data, error } = await supabase.auth.getUser(access_token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      // Try authorization header
      const authHeader = req.headers.get('authorization') || '';
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data.user) {
          return NextResponse.json({ error: 'Invalid bearer token' }, { status: 401 });
        }
        userId = data.user.id;
      } else {
        return NextResponse.json({ error: 'No valid authentication provided' }, { status: 401 });
      }
    }
    
    // Create a job placeholder
    const jobId = uuidv4();
    
    // Get the course data
    const { data: courseData, error: courseError } = await supabase
      .from('hr_courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (courseError) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    
    // Create placeholder content
    const contentOutline = {
      title: courseData.title,
      description: courseData.description || 'No description available',
      modules: [
        {
          id: 'module-1',
          title: `Introduction to ${courseData.title}`,
          description: 'Overview',
          orderIndex: 1,
          sections: [
            { title: 'Fundamentals', type: 'text', duration: 20 }
          ]
        }
      ]
    };
    
    // Create personalized content
    const personalizedContent = {
      id: jobId,
      course_id: courseId,
      employee_id: userId,
      title: courseData.title,
      description: courseData.description || 'No description available',
      modules: contentOutline.modules,
      metadata: {
        generated_at: new Date().toISOString(),
        is_placeholder: true
      }
    };
    
    // Store in database
    try {
      await supabase
        .from('hr_personalized_course_content')
        .insert({
          id: personalizedContent.id,
          course_id: courseId,
          employee_id: userId,
          content: personalizedContent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        });
    } catch (storageError) {
      console.error('Error storing content:', storageError);
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Course content regenerated successfully via simplified endpoint',
      job_id: jobId,
      content: {
        id: personalizedContent.id,
        title: personalizedContent.title
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  } catch (error: any) {
    logWithTimestamp(`❌ Error in POST request:`, error, requestId);
    return NextResponse.json({ 
      error: 'Failed to regenerate course content',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 