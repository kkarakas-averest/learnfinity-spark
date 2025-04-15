import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { PersonalizedContentService } from '@/services/personalized-content-service';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { GroqAPI } from '@/lib/llm/groq-api';  // Correct import path

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
      
      // Fetch employee data - trying first in hr_employees
      const { data: employee, error: employeeError } = await supabase
        .from('hr_employees')
        .select(`
          *,
          hr_departments(id, name),
          hr_positions(id, title)
        `)
        .eq('id', job.employee_id)
        .single();
      
      // If no employee record, check users table
      let employeeInfo: any = employee;
      if (employeeError || !employee) {
        // Try getting user data as fallback
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', job.employee_id)
          .single();
          
        if (userError || !userData) {
          console.log('Could not find employee or user record, using placeholder data');
          employeeInfo = {
            name: "User",
            email: "user@example.com",
            position: "Learner"
          };
        } else {
          employeeInfo = userData;
        }
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
        step_description: 'Generating module content with AI',
        progress: 40
      });
      
      // Setup for AI content generation
      const groq = new GroqAPI(process.env.GROQ_API_KEY || '');
      
      // Extract personalization options from job
      const personalizationOptions = job.options || {};
      
      // Prepare employee profile for the AI
      const employeeProfile = {
        name: employeeInfo.name || 'User',
        position: employeeInfo.position || employeeInfo.hr_positions?.title || 'Learner',
        department: employeeInfo.department || employeeInfo.hr_departments?.name || 'General',
        experience_level: 'intermediate'
      };
      
      // Define module structure
      const moduleTopics = [
        'Introduction and Fundamentals',
        'Core Concepts and Principles',
        'Advanced Applications and Case Studies'
      ];
      
      // Generate content for each module using Groq
      const generatedModules = [];
      
      for (let i = 0; i < moduleTopics.length; i++) {
        const moduleId = `module-${i + 1}`;
        const moduleTitle = `Module ${i + 1}: ${moduleTopics[i]}`;
        
        await updateJobStatus(supabase, job_id, {
          step_description: `Generating content for ${moduleTitle}`,
          progress: 40 + (i * 20 / moduleTopics.length)
        });
        
        // Generate module content with Groq
        const modulePrompt = `
          Generate educational content for a module titled "${moduleTitle}" 
          for course "${course.title}" with description "${course.description}".
          
          The content should be tailored for ${employeeProfile.name} who is a ${employeeProfile.position} 
          in the ${employeeProfile.department} department with ${employeeProfile.experience_level} level experience.
          
          Personalization preferences:
          - Adapt to learning style: ${personalizationOptions.adaptToLearningStyle ? 'Yes' : 'No'}
          - Include employee experience context: ${personalizationOptions.includeEmployeeExperience ? 'Yes' : 'No'}
          - Use simplified language: ${personalizationOptions.useSimplifiedLanguage ? 'Yes' : 'No'}
          - Include extra challenges: ${personalizationOptions.includeExtraChallenges ? 'Yes' : 'No'}
          
          Create content for three sections:
          1. Overview - Introduction to the topic
          2. Key Points - Main concepts and theories
          3. Application - Practical examples and exercises
          
          Format the content as structured HTML with headings, paragraphs, lists, and blockquotes.
          Include specific examples relevant to ${employeeProfile.position} role.
        `;
        
        try {
          // Call Groq API
          const aiResponse = await groq.complete(modulePrompt, {
            system: "You are an expert educational content creator specialized in creating personalized learning materials.",
            temperature: 0.7,
            maxTokens: 4000
          });
          
          // Extract content from the response
          const moduleContent = aiResponse.text;
          
          if (!moduleContent) {
            throw new Error('Empty response from AI service');
          }
          
          // Process AI response to extract sections
          const sectionContents = extractSectionsFromAIResponse(moduleContent, moduleTitle);
          
          // Insert each section
          for (let j = 0; j < sectionContents.length; j++) {
            const section = sectionContents[j];
            const sectionId = `section-${j + 1}`;
            
            // Insert section content
            const { error: sectionError } = await supabase
              .from('ai_course_content_sections')
              .insert({
                id: uuidv4(),
                content_id: aiContentId,
                title: section.title,
                content: section.content,
                module_id: moduleId,
                section_id: sectionId,
                order_index: j
              });
              
            if (sectionError) {
              console.error(`Error creating section ${sectionId}:`, sectionError);
              // Continue with other sections
            }
          }
          
          generatedModules.push({
            id: moduleId,
            title: moduleTitle,
            sections: sectionContents
          });
          
        } catch (aiError) {
          console.error(`Error generating content with AI for module ${moduleTitle}:`, aiError);
          
          // Fallback content if AI fails
          const fallbackSections = createFallbackSections(moduleTitle, employeeProfile, course.title);
          
          for (let j = 0; j < fallbackSections.length; j++) {
            const section = fallbackSections[j];
            const sectionId = `section-${j + 1}`;
            
            // Insert fallback section content
            const { error: sectionError } = await supabase
              .from('ai_course_content_sections')
              .insert({
                id: uuidv4(),
                content_id: aiContentId,
                title: section.title,
                content: section.content,
                module_id: moduleId,
                section_id: sectionId,
                order_index: j
              });
              
            if (sectionError) {
              console.error(`Error creating fallback section ${sectionId}:`, sectionError);
            }
          }
          
          generatedModules.push({
            id: moduleId,
            title: moduleTitle,
            sections: fallbackSections
          });
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
    console.error('Error processing job:', error);
    return NextResponse.json({
      success: false,
      message: 'Error processing job',
      error: error.message
    }, { status: 500 });
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

/**
 * Extract sections from AI-generated content
 */
function extractSectionsFromAIResponse(aiResponse: string, moduleTitle: string): Array<{title: string, content: string}> {
  try {
    // Try to identify sections in the content
    const overviewMatch = aiResponse.match(/<h[23]>.*?overview.*?<\/h[23]>/i);
    const keyPointsMatch = aiResponse.match(/<h[23]>.*?key points.*?<\/h[23]>/i);
    const applicationMatch = aiResponse.match(/<h[23]>.*?application.*?<\/h[23]>/i);
    
    if (overviewMatch && keyPointsMatch) {
      // We can split the content into sections
      const overviewStart = aiResponse.indexOf(overviewMatch[0]);
      const keyPointsStart = aiResponse.indexOf(keyPointsMatch[0]);
      let applicationStart = applicationMatch ? aiResponse.indexOf(applicationMatch[0]) : aiResponse.length;
      
      // Extract sections
      const overview = aiResponse.substring(overviewStart, keyPointsStart);
      const keyPoints = applicationMatch 
        ? aiResponse.substring(keyPointsStart, applicationStart)
        : aiResponse.substring(keyPointsStart);
      const application = applicationMatch 
        ? aiResponse.substring(applicationStart)
        : '';
      
      return [
        { 
          title: `${moduleTitle}: Overview`, 
          content: `<div class="prose max-w-none">${overview}</div>` 
        },
        { 
          title: `${moduleTitle}: Key Points`, 
          content: `<div class="prose max-w-none">${keyPoints}</div>` 
        },
        { 
          title: `${moduleTitle}: Application`, 
          content: application ? `<div class="prose max-w-none">${application}</div>` : null
        }
      ].filter(section => section.content !== null) as Array<{title: string, content: string}>;
    } else {
      // Can't easily split, treat as a single section
      return [
        { 
          title: `${moduleTitle}: Complete Content`, 
          content: `<div class="prose max-w-none">${aiResponse}</div>` 
        }
      ];
    }
  } catch (error) {
    console.error('Error parsing AI response into sections:', error);
    // Return the entire content as one section
    return [
      { 
        title: `${moduleTitle}: Content`, 
        content: `<div class="prose max-w-none">${aiResponse}</div>` 
      }
    ];
  }
}

/**
 * Create fallback sections if AI generation fails
 */
function createFallbackSections(
  moduleTitle: string, 
  employeeProfile: any, 
  courseTitle: string
): Array<{title: string, content: string}> {
  const overview = `
    <div class="prose max-w-none">
      <h2>Overview</h2>
      <p>This is a personalized section for ${employeeProfile.name} in the role of ${employeeProfile.position}.</p>
      <p>This overview introduces the key concepts of ${moduleTitle} as part of the course on ${courseTitle}.</p>
      <p>The content is tailored to your experience level and role requirements.</p>
    </div>
  `;
  
  const keyPoints = `
    <div class="prose max-w-none">
      <h2>Key Points</h2>
      <ul>
        <li>Important concept 1 relevant to ${employeeProfile.position} in ${employeeProfile.department}</li>
        <li>Critical understanding of ${courseTitle} principles and their application</li>
        <li>Best practices for implementing these concepts in your role</li>
      </ul>
      <blockquote>
        <p>"Mastering these concepts will enhance your effectiveness as a ${employeeProfile.position}."</p>
      </blockquote>
    </div>
  `;
  
  const application = `
    <div class="prose max-w-none">
      <h2>Application</h2>
      <p>This section provides practical examples and exercises to apply the concepts from ${moduleTitle}.</p>
      <h3>Exercise 1: Applying to Your Role</h3>
      <p>Consider how you would implement these concepts in your daily work as a ${employeeProfile.position}.</p>
      <h3>Case Study</h3>
      <p>Review this case study relevant to the ${employeeProfile.department} department.</p>
      <h3>Next Steps</h3>
      <p>After completing this module, you'll be ready to put these concepts into practice.</p>
    </div>
  `;
  
  return [
    { title: `${moduleTitle}: Overview`, content: overview },
    { title: `${moduleTitle}: Key Points`, content: keyPoints },
    { title: `${moduleTitle}: Application`, content: application }
  ];
} 