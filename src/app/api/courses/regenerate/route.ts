import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { v4 as uuidv4 } from 'uuid';

/**
 * Alternate API endpoint for regenerating course content
 * This serves as a fallback for the main regenerate-content endpoint
 * POST /api/courses/regenerate
 */
export async function POST(req: NextRequest) {
  const requestId = uuidv4().slice(0, 8);
  console.log(`[${requestId}] ⚠️ [ALTERNATE-ENDPOINT] Using fallback course regeneration endpoint`);
  
  try {
    // Get authentication token
    let userId: string | undefined;
    const authHeader = req.headers.get('authorization') || '';
    
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data.user) {
        userId = data.user.id;
        console.log(`[${requestId}] ✅ Auth successful for user: ${userId}`);
      } else {
        console.log(`[${requestId}] ❌ Auth header present but invalid`);
      }
    }
    
    // Last resort: try to extract auth from request URL
    if (!userId) {
      const url = new URL(req.url);
      const accessToken = url.searchParams.get('access_token');
      
      if (accessToken) {
        const { data, error } = await supabase.auth.getUser(accessToken);
        if (!error && data.user) {
          userId = data.user.id;
          console.log(`[${requestId}] ✅ URL token auth successful for user: ${userId}`);
        }
      }
    }
    
    if (!userId) {
      console.log(`[${requestId}] ❌ Authentication failed`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await req.json();
    const { courseId, forceRegenerate = true } = body;
    
    if (!courseId) {
      console.log(`[${requestId}] ❌ Missing courseId in request`);
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }
    
    console.log(`[${requestId}] 🚀 Starting alternate content regeneration for course: ${courseId}`);
    
    // Get employee ID
    let employeeId = userId; // Default fallback
    let mappingMethod = 'user_id_fallback';
    
    try {
      // Using admin client to bypass RLS
      const client = supabaseAdmin || supabase;
      
      // First approach: Try employee_user_mapping table
      const { data: mappingData, error: mappingError } = await client
        .from('employee_user_mapping')
        .select('employee_id')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!mappingError && mappingData?.employee_id) {
        employeeId = mappingData.employee_id;
        mappingMethod = 'mapping_table';
        console.log(`[${requestId}] ✅ Found mapping: ${employeeId}`);
      } else {
        // Second approach: Try employees table
        const { data: employeeData, error: employeeError } = await client
          .from('employees')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (!employeeError && employeeData?.id) {
          employeeId = employeeData.id;
          mappingMethod = 'employees_table';
          console.log(`[${requestId}] ✅ Found employee via direct lookup: ${employeeId}`);
        } else {
          console.log(`[${requestId}] ℹ️ No mapping found, using user ID as fallback: ${userId}`);
        }
      }
    } catch (mappingError) {
      console.error(`[${requestId}] ❌ Error getting employee mapping:`, mappingError);
      // Continue with user ID as fallback
    }
    
    // Create a job record
    const jobId = uuidv4();
    console.log(`[${requestId}] 📝 Creating job with ID: ${jobId} (mapping method: ${mappingMethod})`);
    
    try {
      // Using admin client to bypass RLS
      const client = supabaseAdmin || supabase;
      
      // Insert job record
      const { error: jobError } = await client
        .from('content_generation_jobs')
        .insert({
          id: jobId,
          course_id: courseId,
          employee_id: employeeId,
          status: 'in_progress',
          total_steps: 10,
          current_step: 1,
          progress: 0,
          step_description: 'Initializing content generation process',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            requested_by: userId,
            alternate_endpoint: true
          }
        });
        
      if (jobError) {
        console.error(`[${requestId}] ❌ Error creating job:`, jobError);
        return NextResponse.json(
          { error: 'Failed to create job', details: jobError.message },
          { status: 500 }
        );
      }
      
      console.log(`[${requestId}] ✅ Successfully created job`);
      
      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Content regeneration job created successfully',
        job_id: jobId,
        employee_id: employeeId
      });
      
    } catch (error) {
      console.error(`[${requestId}] 💥 Unexpected error:`, error);
      return NextResponse.json(
        { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`[${requestId}] 💥 Critical error:`, error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 