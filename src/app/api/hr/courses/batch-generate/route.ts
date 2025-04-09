import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * API endpoint to generate personalized course content for multiple employees in batch
 * POST /api/hr/courses/batch-generate
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate request
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await req.json();
    const { courseId, employeeIds, personalizationOptions = {} } = body;
    
    if (!courseId || !employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return NextResponse.json(
        { error: 'Course ID and at least one employee ID are required' }, 
        { status: 400 }
      );
    }
    
    // Check if course exists
    const { data: courseData, error: courseError } = await supabase
      .from('hr_courses')
      .select('*')
      .eq('id', courseId)
      .single();
      
    if (courseError || !courseData) {
      return NextResponse.json(
        { error: 'Course not found', details: courseError?.message }, 
        { status: 404 }
      );
    }
    
    // Create a queue of content generation requests
    const generationQueue = employeeIds.map(employeeId => {
      return fetch(new URL('/api/hr/courses/generate-content', req.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': req.headers.get('cookie') || '' // Pass auth cookie for session
        },
        body: JSON.stringify({
          courseId,
          employeeId,
          personalizationOptions: {
            ...personalizationOptions,
            batchGenerated: true
          }
        })
      }).then(response => {
        if (!response.ok) {
          return { employeeId, success: false, error: 'Failed to generate content', contentId: null };
        }
        return response.json().then(data => ({ employeeId, success: true, contentId: data.content?.id, error: null }));
      }).catch(error => {
        console.error(`Error generating content for employee ${employeeId}:`, error);
        return { employeeId, success: false, error: error.message, contentId: null };
      });
    });
    
    // Execute all requests (this will run them in parallel, which may need to be limited for large batches)
    const results = await Promise.all(generationQueue);
    
    // Count successful and failed generations
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return NextResponse.json({
      success: true,
      message: `Content generation initiated for ${successful} employees${failed > 0 ? ` (${failed} failed)` : ''}`,
      results
    });
  } catch (error: any) {
    console.error('Error in batch content generation:', error);
    return NextResponse.json(
      { error: 'Failed to process batch content generation', details: error.message }, 
      { status: 500 }
    );
  }
} 