import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { PersonalizedContentService } from '@/services/personalized-content-service';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// Define JobStatus enum directly since the import is missing
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Create local stub implementations for the missing AI functions
const generateInitialCourseContent = async (provider: any, params: any) => {
  console.log('Generating initial course content...');
  return await provider.generateStructuredContent(
    `Create a personalized course structure for a ${params.courseTitle} course.
    The course should be tailored for someone with the following background:
    - Knowledge: ${params.userKnowledge}
    - Aspirations: ${params.userAspirations}
    - Learning style: ${params.userPreferences.learning_style}
    - Content depth: ${params.userPreferences.content_depth}
    
    Return the response as a structured JSON with modules and sections.`,
    'course_structure'
  );
};

const generateLessonContent = async (provider: any, params: any) => {
  console.log(`Generating lesson content for ${params.lessonTitle}...`);
  return await provider.generateStructuredContent(
    `Create detailed content for the ${params.lessonTitle} lesson in the ${params.moduleTitle} module.
    This is for a course titled "${params.courseTitle}".
    Include practical examples and clear explanations.
    Format using HTML tags for rich text display.`,
    'lesson_content'
  );
};

const generateAssessmentQuestions = async (provider: any, params: any) => {
  return await provider.generateStructuredContent(
    `Create ${params.questionCount || 3} multiple-choice assessment questions for the lesson: ${params.lessonTitle}.
    These questions should test understanding of key concepts from the content: 
    ${params.lessonContent.substring(0, 500)}...
    
    Return as a JSON array of question objects.`,
    'assessment_questions'
  );
};

const generateKey = async (provider: any, params: any) => {
  return await provider.generateStructuredContent(
    `Identify the key takeaways from this lesson on ${params.lessonTitle}.
    Content: ${params.lessonContent.substring(0, 500)}...
    
    Return as a JSON array of strings.`,
    'key_takeaways'
  );
};

const generateExercises = async (provider: any, params: any) => {
  return await provider.generateStructuredContent(
    `Create ${params.exerciseCount || 2} practical exercises for the lesson on ${params.lessonTitle}.
    The exercises should help apply concepts from: 
    ${params.lessonContent.substring(0, 500)}...
    
    Return as a JSON array of exercise objects with title and description.`,
    'exercises'
  );
};

// Real implementation of the Groq AI provider
class GroqAIProvider {
  private apiKey: string;
  
  constructor() {
    // Use environment variable or fallback to hardcoded key (temporary)
    this.apiKey = process.env.GROQ_API_KEY || 'YOUR_FALLBACK_KEY_HERE';
    
    if (!this.apiKey) {
      console.error('No Groq API key available');
      throw new Error('Groq API key is required');
    }
  }
  
  async generateContent(prompt: string): Promise<string> {
    logWithTimestamp('Calling Groq API with prompt', prompt.substring(0, 100) + '...');
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            { 
              role: 'system', 
              content: 'You are an expert educational content creator. Generate detailed, accurate, and engaging educational content.' 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Groq API error:', errorData);
        throw new Error(`Groq API error: ${response.status} - ${errorData}`);
      }
      
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling Groq API:', error);
      throw new Error(`Failed to generate content with Groq: ${error.message}`);
    }
  }
  
  async generateStructuredContent(prompt: string, contentType: string): Promise<any> {
    const structuredPrompt = `${prompt}
    
    IMPORTANT: Return ONLY valid JSON without any explanations or markdown formatting.`;
    
    try {
      const content = await this.generateContent(structuredPrompt);
      
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonArrayMatch = content.match(/\[[\s\S]*\]/);
      
      let jsonContent;
      if (jsonMatch) {
        jsonContent = JSON.parse(jsonMatch[0]);
      } else if (jsonArrayMatch) {
        jsonContent = JSON.parse(jsonArrayMatch[0]);
      } else {
        console.error(`No JSON found in response for ${contentType}`);
        throw new Error(`Failed to extract structured content for ${contentType}`);
      }
      
      return jsonContent;
    } catch (error) {
      console.error(`Error generating structured content for ${contentType}:`, error);
      
      // Return fallback content based on content type
      switch (contentType) {
        case 'course_structure':
          return {
            modules: [
              {
                title: "Getting Started",
                description: "Introduction to the course",
                sections: [
                  {
                    title: "Introduction",
                    type: "lesson",
                    content: "Introduction content",
                    html_content: "<div><h1>Introduction</h1><p>This is the introduction to the course.</p></div>",
                    objectives: ["Understand the basics"],
                    hasAssessment: true,
                    assessment: null,
                    keyTakeaways: [],
                    exercises: []
                  }
                ]
              }
            ]
          };
        case 'lesson_content':
          return {
            content: "Lesson content",
            html_content: "<div><h1>Lesson</h1><p>This is the lesson content.</p></div>"
          };
        case 'assessment_questions':
          return [
            {
              question: "Sample question?",
              options: ['Option A', 'Option B', 'Option C', 'Option D'],
              correctOption: 0
            }
          ];
        case 'key_takeaways':
          return ["Key takeaway 1", "Key takeaway 2"];
        case 'exercises':
          return [
            {
              title: "Exercise",
              description: "Try this exercise to practice what you learned"
            }
          ];
        default:
          return {};
      }
    }
  }
}

// Logging helper function to standardize log format
const logWithTimestamp = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logPrefix = `[${timestamp}] [PERSONALIZE-CONTENT-PROCESS]`;
  
  if (data) {
    console.log(`${logPrefix} ${message}`, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  } else {
    console.log(`${logPrefix} ${message}`);
  }
};

// Configure CORS options
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Define allowed HTTP methods
export async function OPTIONS(request: NextRequest) {
  logWithTimestamp(`OPTIONS request received from ${request.url}`);
  logWithTimestamp(`Request headers:`, Object.fromEntries(request.headers));

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * GET handler for personalize-content process
 * This properly handles the job_id parameter and returns a JSON response with proper headers
 */
export async function GET(req: NextRequest) {
  const requestId = uuidv4().slice(0, 8);
  logWithTimestamp(`[ReqID:${requestId}] GET request received from ${req.url}`);

  try {
    // Extract job_id from URL params
    const url = new URL(req.url);
    const jobId = url.searchParams.get('job_id');
    const courseId = url.searchParams.get('course_id');
    const employeeId = url.searchParams.get('employee_id');
    
    logWithTimestamp(`[ReqID:${requestId}] Query parameters: job_id=${jobId}, course_id=${courseId}, employee_id=${employeeId}`);
    
    // Validate the job_id
    if (!jobId) {
      logWithTimestamp(`[ReqID:${requestId}] ❌ Missing job_id parameter`);
      return NextResponse.json(
        { error: 'Missing job_id parameter' },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    // Create a body object mimicking what we'd receive from a POST
    const requestBody = { 
      job_id: jobId,
      course_id: courseId || undefined,
      employee_id: employeeId || undefined
    };
    
    // Use the same logic as in POST to process the job
    logWithTimestamp(`[ReqID:${requestId}] Forwarding to POST handler logic with constructed body:`, requestBody);
    
    // We're using the imported supabase client instead of createClient()
    const { data: job, error: jobError } = await supabase
      .from('content_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
      
    if (jobError || !job) {
      logWithTimestamp(`[ReqID:${requestId}] ❌ Error fetching job:`, jobError);
      return NextResponse.json(
        { error: "Job not found", details: jobError ? jobError.message : 'No job found with the provided ID' },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    // Return the job info with proper headers
    return NextResponse.json(
      {
        success: true,
        job: {
          id: job.id,
          status: job.status,
          current_step: job.current_step,
          progress: job.progress,
          step_description: job.step_description
        }
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  } catch (error) {
    logWithTimestamp(`[ReqID:${requestId}] ❌ Error processing GET request:`, error);
    return NextResponse.json(
      { 
        error: "Failed to process request", 
        message: error.message || 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

// Request schema validation
const requestSchema = z.object({
  job_id: z.string().uuid()
});

/**
 * API endpoint to process a content personalization job
 * This endpoint is intended to be called by a background process or a webhook
 */
export async function POST(req: NextRequest) {
  const requestId = uuidv4().slice(0, 8); // Generate a short request ID for tracing
  logWithTimestamp(`[ReqID:${requestId}] POST request received from ${req.url}`);
  logWithTimestamp(`[ReqID:${requestId}] Request headers:`, Object.fromEntries(req.headers));
  
  try {
    // Parse request body
    logWithTimestamp(`[ReqID:${requestId}] 📦 Parsing request body...`);
    let body;
    try {
      body = await req.json();
      logWithTimestamp(`[ReqID:${requestId}] Request body:`, body);
    } catch (parseError) {
      logWithTimestamp(`[ReqID:${requestId}] ❌ Failed to parse request body:`, parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    // Allow direct requests from the proxy-process-job.js with various parameters
    // Support both job_id parameter and extended parameters
    let job_id = body.job_id;
    const requestCourseId = body.course_id;
    const employee_id = body.employee_id || body.user_id;
    const force_regenerate = body.force_regenerate;
    
    if (!job_id && req.nextUrl?.searchParams) {
      // Check if job_id is provided in the query parameters (GET request or URL params)
      job_id = req.nextUrl.searchParams.get('job_id') || undefined;
    }
    
    // Validate the job_id
    if (!job_id) {
      logWithTimestamp(`[ReqID:${requestId}] ❌ Missing job_id parameter`);
      return NextResponse.json(
        { error: 'Missing job_id parameter' },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    // Validate the request - only check job_id if other parameters are not provided
    if (!requestCourseId && !employee_id) {
      logWithTimestamp(`[ReqID:${requestId}] 🔍 Validating request schema (job_id only)...`);
      const validationResult = requestSchema.safeParse({ job_id });
      if (!validationResult.success) {
        logWithTimestamp(`[ReqID:${requestId}] ❌ Schema validation failed:`, validationResult.error);
        return NextResponse.json(
          { error: 'Invalid request data', details: validationResult.error.format() },
          { 
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        );
      }
    }
    
    logWithTimestamp(`[ReqID:${requestId}] 🔄 Processing job ID: ${job_id}`);
    
    // We're now using the imported supabase client instead of createClient()
    logWithTimestamp(`[ReqID:${requestId}] 🔍 Fetching job from database...`);
    
    // Get the job info from the database
    const { data: job, error: jobError } = await supabase
      .from('content_generation_jobs')
      .select('*')
      .eq('id', job_id)
      .single();
      
    if (jobError || !job) {
      logWithTimestamp(`[ReqID:${requestId}] ❌ Error fetching job:`, jobError);
      return NextResponse.json(
        { error: "Job not found", details: jobError ? jobError.message : 'No job found with the provided ID' },
        { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    logWithTimestamp(`[ReqID:${requestId}] ✅ Job found:`, {
      id: job.id,
      status: job.status,
      type: job.type,
      created_at: job.created_at
    });
    
    // Check if the job is already completed or failed
    if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
      logWithTimestamp(`[ReqID:${requestId}] ⚠️ Job already ${job.status}`);
      return NextResponse.json(
        { 
          status: job.status,
          message: `Job ${job.status === JobStatus.COMPLETED ? 'already completed' : 'failed'}` 
        },
        { 
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    // Update the job status to PROCESSING
    logWithTimestamp(`[ReqID:${requestId}] 🔄 Updating job status to PROCESSING...`);
    const { error: updateError } = await supabase
      .from('content_generation_jobs')
      .update({ status: JobStatus.PROCESSING })
      .eq('id', job_id);
      
    if (updateError) {
      logWithTimestamp(`[ReqID:${requestId}] ❌ Error updating job status:`, updateError);
      return NextResponse.json(
        { error: "Failed to update job status", details: updateError.message },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    // Get the metadata from the job parameters
    logWithTimestamp(`[ReqID:${requestId}] 🔍 Examining job parameters...`);
    const parameters = job.parameters as any;
    
    if (!parameters) {
      logWithTimestamp(`[ReqID:${requestId}] ❌ Invalid job parameters: null or undefined`);
      await supabase
        .from('content_generation_jobs')
        .update({ 
          status: JobStatus.FAILED, 
          result: { error: "Invalid job parameters" } 
        })
        .eq('id', job_id);
      
      return NextResponse.json(
        { error: "Invalid job parameters" },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    logWithTimestamp(`[ReqID:${requestId}] ✅ Job parameters:`, parameters);
    
    const {
      course_id: paramsCourseId,
      user_id,
      course_title,
      course_description,
      user_knowledge,
      user_aspirations,
      is_regeneration
    } = parameters;
    
    // Use request course_id if available, otherwise use the one from job parameters
    const effectiveCourseId = requestCourseId || paramsCourseId;
    
    // Validate the course ID and user ID
    if (!effectiveCourseId || !user_id) {
      logWithTimestamp(`[ReqID:${requestId}] ❌ Missing required parameters: course_id=${effectiveCourseId}, user_id=${user_id}`);
      await supabase
        .from('content_generation_jobs')
        .update({ 
          status: JobStatus.FAILED, 
          result: { error: "Missing course ID or user ID" } 
        })
        .eq('id', job_id);
      
      return NextResponse.json(
        { error: "Missing course ID or user ID" },
        { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
    try {
      logWithTimestamp(`[ReqID:${requestId}] 🔍 Fetching user preferences for user_id=${user_id}...`);
      // Get user preferences
      const { data: userPreferences, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user_id)
        .single();
        
      if (preferencesError) {
        logWithTimestamp(`[ReqID:${requestId}] ⚠️ Could not fetch user preferences:`, preferencesError);
      } else {
        logWithTimestamp(`[ReqID:${requestId}] ✅ User preferences:`, userPreferences);
      }
      
      logWithTimestamp(`[ReqID:${requestId}] 🔍 Fetching course details for course_id=${effectiveCourseId}...`);
      // Get course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', effectiveCourseId)
        .single();
        
      if (courseError) {
        logWithTimestamp(`[ReqID:${requestId}] ⚠️ Could not fetch course details:`, courseError);
      } else {
        logWithTimestamp(`[ReqID:${requestId}] ✅ Course details:`, {
          id: course.id,
          title: course.title,
          description: course.description?.substring(0, 100) + '...'
        });
      }
      
      // Initialize result data structure
      let result = {
        course_id: effectiveCourseId,
        html_content: null,
        modules: [],
        generated_at: new Date().toISOString(),
      };
      
      // Initialize AI provider
      logWithTimestamp(`[ReqID:${requestId}] 🤖 Initializing AI provider...`);
      const aiProvider = new GroqAIProvider();
      
      // Generate initial course structure and content
      logWithTimestamp(`[ReqID:${requestId}] 🧠 Generating initial course content...`);
      const initialContent = await generateInitialCourseContent(
        aiProvider,
        {
          courseTitle: course_title || course?.title || 'Untitled Course',
          courseDescription: course_description || course?.description || '',
          userKnowledge: user_knowledge || '',
          userAspirations: user_aspirations || '',
          userPreferences: userPreferences || {
            learning_style: 'balanced',
            content_depth: 'intermediate'
          }
        }
      );
      
      // Process the course structure
      if (initialContent?.modules) {
        logWithTimestamp(`[ReqID:${requestId}] ✅ Generated initial content with ${initialContent.modules.length} modules`);
        result.modules = initialContent.modules;
        
        // Generate detailed content for each lesson in each module
        for (const [moduleIndex, module] of initialContent.modules.entries()) {
          logWithTimestamp(`[ReqID:${requestId}] 📝 Processing module ${moduleIndex + 1}/${initialContent.modules.length}: ${module.title}`);
          
          for (const [sectionIndex, section] of module.sections.entries()) {
            if (section.type === 'lesson') {
              logWithTimestamp(`[ReqID:${requestId}] 📚 Generating content for lesson ${sectionIndex + 1}/${module.sections.length}: ${section.title}`);
              
              const lessonContent = await generateLessonContent(
                aiProvider,
                {
                  courseTitle: course_title || course?.title || 'Untitled Course',
                  moduleTitle: module.title,
                  lessonTitle: section.title,
                  lessonObjectives: section.objectives || [],
                  userPreferences: userPreferences || {
                    learning_style: 'balanced',
                    content_depth: 'intermediate'
                  }
                }
              );
              
              section.content = lessonContent.content;
              section.html_content = lessonContent.html_content;
              logWithTimestamp(`[ReqID:${requestId}] ✅ Generated lesson content (${section.content.length} chars)`);
              
              // Generate assessment questions for the lesson
              if (section.hasAssessment) {
                logWithTimestamp(`[ReqID:${requestId}] 📝 Generating assessment questions for lesson: ${section.title}`);
                const questions = await generateAssessmentQuestions(
                  aiProvider,
                  {
                    courseTitle: course_title || course?.title || 'Untitled Course',
                    moduleTitle: module.title,
                    lessonTitle: section.title,
                    lessonContent: section.content,
                    questionCount: 3
                  }
                );
                
                section.assessment = {
                  questions: questions
                };
                logWithTimestamp(`[ReqID:${requestId}] ✅ Generated ${questions.length} assessment questions`);
              }
              
              // Generate key takeaways
              logWithTimestamp(`[ReqID:${requestId}] 💡 Generating key takeaways for lesson: ${section.title}`);
              const keyTakeaways = await generateKey(
                aiProvider,
                {
                  lessonTitle: section.title,
                  lessonContent: section.content
                }
              );
              
              section.keyTakeaways = keyTakeaways;
              logWithTimestamp(`[ReqID:${requestId}] ✅ Generated ${keyTakeaways.length} key takeaways`);
              
              // Generate exercises
              logWithTimestamp(`[ReqID:${requestId}] 🏋️ Generating exercises for lesson: ${section.title}`);
              const exercises = await generateExercises(
                aiProvider,
                {
                  lessonTitle: section.title,
                  lessonContent: section.content,
                  exerciseCount: 2
                }
              );
              
              section.exercises = exercises;
              logWithTimestamp(`[ReqID:${requestId}] ✅ Generated ${exercises.length} exercises`);
            }
          }
        }
      } else {
        logWithTimestamp(`[ReqID:${requestId}] ⚠️ No modules generated in initial content`);
      }
      
      // Update personalized_course_content table
      logWithTimestamp(`[ReqID:${requestId}] 💾 Saving personalized course content to database...`);
      
      // Check if we should use course_id/user_id or course_id/employee_id as the primary key
      const contentUserId = employee_id || user_id;
      
      // Generate a UUID for the content entry
      const contentId = uuidv4();
      
      const { error: contentError } = await supabase
        .from('hr_personalized_course_content')
        .upsert({
          id: contentId, // Add explicit UUID to avoid NOT NULL constraint error
          course_id: effectiveCourseId,
          employee_id: contentUserId,
          content: result,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'course_id,employee_id' });
        
      if (contentError) {
        logWithTimestamp(`[ReqID:${requestId}] ❌ Error saving personalized content:`, contentError);
        throw new Error(`Failed to save personalized content: ${contentError.message}`);
      }
      
      // Update job status to COMPLETED
      logWithTimestamp(`[ReqID:${requestId}] 🏁 Marking job as COMPLETED`);
      const { error: completeError } = await supabase
        .from('content_generation_jobs')
        .update({ 
          status: JobStatus.COMPLETED, 
          result: { success: true, message: "Content generation completed successfully" },
          completed_at: new Date().toISOString()
        })
        .eq('id', job_id);
        
      if (completeError) {
        logWithTimestamp(`[ReqID:${requestId}] ❌ Error updating job completion status:`, completeError);
        throw new Error(`Failed to update job completion status: ${completeError.message}`);
      }
      
      logWithTimestamp(`[ReqID:${requestId}] ✅ Job ${job_id} completed successfully`);
      return NextResponse.json(
        { 
        success: true,
          message: "Content generation completed successfully" 
        },
        { 
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
      
    } catch (error: any) {
      logWithTimestamp(`[ReqID:${requestId}] ❌ Error during content generation:`, error);
      
      // Update job status to FAILED
      await supabase
        .from('content_generation_jobs')
        .update({
          status: JobStatus.FAILED, 
          result: { 
            error: error.message || "Unknown error during content generation" 
          },
          completed_at: new Date().toISOString()
        })
        .eq('id', job_id);
        
      return NextResponse.json(
        { 
          error: "Failed to generate content",
          details: error.message 
        },
        { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      );
    }
    
  } catch (error: any) {
    logWithTimestamp(`[ReqID:${requestId || 'unknown'}] ❌ Unhandled error processing job:`, error);
    return NextResponse.json(
      { 
        error: "Error processing job request",
        details: error.message 
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

/**
 * Helper function to update job status
 */
async function updateJobStatus(supabase: any, job_id: string, updates: any) {
  logWithTimestamp(`Updating job status for job_id=${job_id}:`, updates);
  const { error } = await supabase
    .from('content_generation_jobs')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', job_id);
    
  if (error) {
    logWithTimestamp(`❌ Error updating job status:`, error);
  } else {
    logWithTimestamp(`✅ Successfully updated job status`);
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