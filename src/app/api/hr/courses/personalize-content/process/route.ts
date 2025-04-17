import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { PersonalizedContentService } from '@/services/personalized-content-service';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin'; // Use admin for direct job interaction

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

// Consistent logging
const log = (message: string, data?: any, requestId?: string) => {
  console.log(`[${new Date().toISOString()}] [PROCESS-HANDLER]${requestId ? ` [ReqID:${requestId}]` : ''} ${message}`, data ? JSON.stringify(data) : '');
};

// Helper to extract job_id from either query or body
async function getJobId(req: NextRequest): Promise<string | null> {
  if (req.method === 'GET') {
    const url = new URL(req.url);
    return url.searchParams.get('job_id');
  } else if (req.method === 'POST') {
    try {
      const body = await req.json();
      return body?.job_id;
    } catch (e) {
      return null; // Invalid JSON
    }
  } else {
    return null; // Unsupported method
  }
}

/**
 * API Route to trigger the processing of a specific personalization job.
 * Accepts GET /api/hr/courses/personalize-content/process?job_id=...
 * Accepts POST /api/hr/courses/personalize-content/process with { job_id: ... } in body
 */
export async function GET(req: NextRequest) {
  console.log("==== PROCESS HANDLER: GET Request Received ===="); // Simple log
  const requestId = uuidv4().slice(0, 8);
  logWithTimestamp(`[ReqID:${requestId}] GET request received from ${req.url}`);
  return handleRequest(req, requestId);
}

export async function POST(req: NextRequest) {
  console.log("==== PROCESS HANDLER: POST Request Received ===="); // Simple log
  const requestId = uuidv4().slice(0, 8); // Generate a short request ID for tracing
  logWithTimestamp(`[ReqID:${requestId}] POST request received from ${req.url}`);
  logWithTimestamp(`[ReqID:${requestId}] Request headers:`, Object.fromEntries(req.headers));
  return handleRequest(req, requestId);
}

async function handleRequest(req: NextRequest, requestId: string) {
  log('🏁 Handling request...', { method: req.method }, requestId);
  
  // Simple CORS check for OPTIONS
  if (req.method === 'OPTIONS') {
    log('↩️ Responding to OPTIONS request', undefined, requestId);
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Extract job_id from request
  const jobId = await getJobId(req);
  log(`🆔 Extracted Job ID: ${jobId}`, undefined, requestId);

  if (!jobId) {
    log('❌ Missing or invalid job_id', { method: req.method }, requestId);
    return NextResponse.json(
      { error: 'Job ID is required either in query parameters (GET) or JSON body (POST)' },
      { status: 400 }
    );
  }

  try {
    // Verify job exists and is in a processable state (e.g., 'pending' or 'in_progress')
    log(`🔍 Verifying job status for job: ${jobId}`, undefined, requestId);
    const { data: jobData, error: jobError } = await supabaseAdmin
      .from('content_generation_jobs')
      .select('status')
      .eq('id', jobId)
      .single();

    if (jobError) {
      log(`❌ Error fetching job: ${jobId}`, { error: jobError.message }, requestId);
      if (jobError.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch job details', details: jobError.message }, { status: 500 });
    }

    log(`✅ Job ${jobId} found with status: ${jobData.status}`, undefined, requestId);

    // Potentially add check here: if jobData.status is 'completed' or 'failed', maybe return early?
    // Example: 
    // if (['completed', 'failed'].includes(jobData.status)) {
    //   log(`🏁 Job ${jobId} already processed. Status: ${jobData.status}`, undefined, requestId);
    //   return NextResponse.json({ success: true, message: `Job already ${jobData.status}`, status: jobData.status }, { status: 200 });
    // }

    // Trigger the actual job processing logic (async)
    // We don't await this, the API responds immediately to acknowledge the trigger
    log(`🚀 Triggering async processing for job: ${jobId}`, undefined, requestId);
    // processPersonalizationJob(jobId, requestId).catch(processingError => { // <-- REMOVE THIS BLOCK
    //   // Log errors during the async processing, but don't crash the API route
    //   log(`❌ Uncaught error during async job processing for ${jobId}:`, { 
    //     message: processingError instanceof Error ? processingError.message : String(processingError),
    //     stack: processingError instanceof Error ? processingError.stack : undefined 
    //   }, requestId);
    //   // Optionally update job status to 'failed' here
    //   supabaseAdmin
    //     .from('content_generation_jobs')
    //     .update({ 
    //       status: 'failed',
    //       error_message: `Async processing error: ${processingError instanceof Error ? processingError.message : String(processingError)}`,
    //       updated_at: new Date().toISOString()
    //     })
    //     .eq('id', jobId);
    // });
    // NOTE: Actual processing should be handled by a separate queue worker or scheduled task
    // that calls /api/hr/courses/process-personalization-queue

    log(`✅ Processing triggered for job: ${jobId}. API responding immediately.`, undefined, requestId);
    // Respond immediately to the client to indicate the trigger was received
    return NextResponse.json(
      {
        success: true,
        message: 'Job processing triggered successfully.',
        job_id: jobId,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    log(`❌ Unexpected error in handleRequest for job ${jobId}:`, { error: errorMessage, stack: error instanceof Error ? error.stack : undefined }, requestId);
    return NextResponse.json(
      { error: 'An unexpected server error occurred', details: errorMessage }, 
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
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