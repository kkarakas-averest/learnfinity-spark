import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { PersonalizedContentService } from '@/services/personalized-content-service';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Request schema validation
const requestSchema = z.object({
  job_id: z.string().uuid()
});

/**
 * API endpoint to process a content personalization job
 * This endpoint is intended to be called by a background process or a webhook
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate the request
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { job_id } = validationResult.data;
    
    console.log(`Processing content generation job ${job_id}`);
    
    // Get supabase client
    const supabase = getSupabase();
    
    // Fetch the job details
    const { data: job, error: jobError } = await supabase
      .from('content_generation_jobs')
      .select('*')
      .eq('id', job_id)
      .single();
      
    if (jobError || !job) {
      console.error('Error fetching job data:', jobError);
      return NextResponse.json(
        { error: 'Job not found', details: jobError?.message },
        { status: 404 }
      );
    }
    
    if (job.status === 'completed' || job.status === 'failed') {
      return NextResponse.json({
        success: true,
        message: `Job is already in ${job.status} state`,
        status: job.status
      });
    }
    
    try {
      // Update job status to processing
      await updateJobStatus(supabase, job_id, {
        current_step: 2,
        step_description: 'Retrieving course and employee data',
        progress: 10
      });
      
      // Fetch course data
      const { data: course, error: courseError } = await supabase
        .from('hr_courses')
        .select('*')
        .eq('id', job.course_id)
        .single();
        
      if (courseError || !course) {
        throw new Error(`Course not found: ${courseError?.message || 'Unknown error'}`);
      }
      
      // Fetch employee data
      const { data: employee, error: employeeError } = await supabase
        .from('hr_employees')
        .select(`
          *,
          hr_departments(id, name),
          hr_positions(id, title)
        `)
        .eq('id', job.employee_id)
        .single();
        
      if (employeeError || !employee) {
        throw new Error(`Employee not found: ${employeeError?.message || 'Unknown error'}`);
      }
      
      // Update job status
      await updateJobStatus(supabase, job_id, {
        current_step: 3,
        step_description: 'Analyzing course content',
        progress: 20
      });
      
      // Fetch existing course content
      const { data: courseContent, error: contentError } = await supabase
        .from('course_content')
        .select('*')
        .eq('course_id', job.course_id)
        .single();
        
      if (contentError && contentError.code !== 'PGRST116') { // Not found is ok
        throw new Error(`Error retrieving course content: ${contentError.message}`);
      }
      
      await updateJobStatus(supabase, job_id, {
        current_step: 4,
        step_description: 'Generating personalized content structure',
        progress: 30
      });
      
      // Create AI content record
      const aiContentId = uuidv4();
      
      const { error: aiContentError } = await supabase
        .from('ai_course_content')
        .insert({
          id: aiContentId,
          course_id: job.course_id,
          created_for_user_id: job.employee_id,
          title: course.title,
          description: course.description,
          is_personalized: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (aiContentError) {
        throw new Error(`Failed to create AI content record: ${aiContentError.message}`);
      }
      
      await updateJobStatus(supabase, job_id, {
        current_step: 5,
        step_description: 'Generating module content',
        progress: 40
      });
      
      // Create placeholder content for modules
      // This would typically be done by an AI service in a real implementation
      // For now, we'll create basic placeholder content that will be replaced later
      
      // Assume we'll create 3 modules with 3 sections each
      const moduleCount = 3;
      const sectionsPerModule = 3;
      
      for (let i = 0; i < moduleCount; i++) {
        const moduleId = `module-${i + 1}`;
        const moduleTitle = `Module ${i + 1}: ${['Introduction', 'Core Concepts', 'Advanced Topics'][i]}`;
        
        await updateJobStatus(supabase, job_id, {
          step_description: `Generating content for ${moduleTitle}`,
          progress: 40 + (i * 20 / moduleCount)
        });
        
        for (let j = 0; j < sectionsPerModule; j++) {
          const sectionId = `section-${j + 1}`;
          const sectionTitle = `${moduleTitle}: ${['Overview', 'Key Points', 'Application'][j]}`;
          
          // Create placeholder content
          const contentHtml = `
            <div class="prose max-w-none">
              <h2>${sectionTitle}</h2>
              <p>This is a personalized section for ${employee.name} in the role of ${employee.hr_positions?.title || 'Employee'}.</p>
              <p>The content will be tailored to your experience level and role requirements.</p>
              <ul>
                <li>Personalized learning point 1</li>
                <li>Role-specific examples</li>
                <li>Experience-based insights</li>
              </ul>
              <blockquote>
                <p>This content will be regenerated with more specific information tailored to your profile.</p>
              </blockquote>
            </div>
          `;
          
          // Insert section content
          const { error: sectionError } = await supabase
            .from('ai_course_content_sections')
            .insert({
              id: uuidv4(),
              content_id: aiContentId,
              title: sectionTitle,
              content: contentHtml,
              module_id: moduleId,
              section_id: sectionId,
              order_index: j
            });
            
          if (sectionError) {
            console.error(`Error creating section ${sectionId}:`, sectionError);
            // Continue with other sections
          }
        }
      }
      
      await updateJobStatus(supabase, job_id, {
        current_step: 9,
        step_description: 'Finalizing personalized content',
        progress: 90
      });
      
      // Update enrollment with completed status
      const { error: updateError } = await supabase
        .from('hr_course_enrollments')
        .update({
          personalized_content_generation_status: 'completed',
          has_personalized_content: true,
          personalized_content_id: aiContentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', job.enrollment_id);
        
      if (updateError) {
        throw new Error(`Failed to update enrollment status: ${updateError.message}`);
      }
      
      // Mark job as completed
      await updateJobStatus(supabase, job_id, {
        current_step: 10,
        step_description: 'Personalization completed successfully',
        progress: 100,
        status: 'completed'
      });
      
      return NextResponse.json({
        success: true,
        message: 'Content personalization completed successfully',
        content_id: aiContentId
      });
      
    } catch (processingError: any) {
      console.error('Error during content personalization:', processingError);
      
      // Update job as failed
      await updateJobStatus(supabase, job_id, {
        status: 'failed',
        error_message: processingError.message
      });
      
      // Update enrollment record
      await supabase
        .from('hr_course_enrollments')
        .update({
          personalized_content_generation_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', job.enrollment_id);
        
      return NextResponse.json({
        success: false,
        message: 'Content personalization failed',
        error: processingError.message
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Error in personalization process:', error);
    return NextResponse.json(
      { error: 'Failed to process content personalization', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper function to update job status
 */
async function updateJobStatus(supabase: any, job_id: string, updates: any) {
  const { error } = await supabase
    .from('content_generation_jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', job_id);
    
  if (error) {
    console.error('Error updating job status:', error);
  }
} 