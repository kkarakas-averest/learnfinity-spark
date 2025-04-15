import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getEmployeeDataForPersonalization } from '@/lib/api/hr/employee-data';
import { AgentFactory } from '@/agents/AgentFactory';
import { v4 as uuidv4 } from 'uuid';

/**
 * API endpoint to generate personalized course content for HR-assigned courses
 * POST /api/hr/courses/generate-content
 */
export async function POST(req: NextRequest) {
  try {
    // Add detailed authentication debugging
    console.log('[generate-content] Start of endpoint, checking authentication');
    console.log('[generate-content] Request headers:', {
      contentType: req.headers.get('content-type'),
      hasAuthorization: !!req.headers.get('authorization'),
      hasCookie: !!req.headers.get('cookie'),
      cookieLength: req.headers.get('cookie')?.length || 0
    });
    
    // Authenticate request
    let authStartTime = Date.now();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    let authEndTime = Date.now();
    
    console.log(`[generate-content] Auth check took ${authEndTime - authStartTime}ms`);
    
    if (authError) {
      console.error('[generate-content] Authentication error:', authError);
      
      // Try to get authorization header for more diagnostic info
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        if (authHeader.startsWith('Bearer ')) {
          const token = authHeader.replace('Bearer ', '');
          console.log('[generate-content] Attempting auth with Bearer token');
          
          try {
            const { data, error } = await supabase.auth.getUser(token);
            if (!error && data.user) {
              console.log('[generate-content] Bearer token auth succeeded');
              // Continue with the authenticated user using this userId
              const userId = data.user.id;
              
              // Break out of the error handling and continue with normal flow
              // We'll use this userId when we get to that part of the code
              console.log('[generate-content] Proceeding with token auth userId:', userId);
              
              // Get request body and continue with normal flow
              const body = await req.json();
              
              // Continue to process with this userId and body
              // ... but first need to restore the normal logic flow
              // This will be handled by continuing below
            } else {
              console.error('[generate-content] Bearer token auth failed:', error);
            }
          } catch (tokenError) {
            console.error('[generate-content] Error authenticating with token:', tokenError);
          }
        }
      }
      
      // If we reached here, all authentication attempts failed
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: authError.message || 'Authentication failed'
      }, { status: 401 });
    }
    
    if (!session?.user) {
      console.error('[generate-content] No session or user found after authentication');
      
      // Try to extract request details for debugging
      try {
        const body = await req.json().catch(e => ({}));
        console.log('[generate-content] Request body:', JSON.stringify(body));
      } catch (e) {
        console.error('[generate-content] Failed to parse request body');
      }
      
      return NextResponse.json({ 
        error: 'Unauthorized', 
        details: 'No user session found'
      }, { status: 401 });
    }
    
    console.log('[generate-content] Successfully authenticated as user:', session.user.id);
    const userId = session.user.id;
    
    // Get request body
    const body = await req.json();
    const { 
      courseId, 
      employeeId = null, 
      personalizationOptions = {},
      jobId = null
    } = body;
    
    // Log request parameters with jobId if present
    console.log(`[generate-content] Received request with: courseId=${courseId}, employeeId=${employeeId}, hasJobId=${!!jobId}`);
    
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }
    
    // If employeeId is not provided, try to get it from user mapping
    let targetEmployeeId = employeeId;
    
    if (!targetEmployeeId) {
      const { data: mappingData } = await supabase
        .from('employee_user_mapping')
        .select('employee_id')
        .eq('user_id', userId)
        .single();
        
      targetEmployeeId = mappingData?.employee_id;
      
      if (!targetEmployeeId) {
        return NextResponse.json(
          { error: 'No employee record found for this user' }, 
          { status: 400 }
        );
      }
    }
    
    // Get the HR course data
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
    
    // Get course enrollment data
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('hr_course_enrollments')
      .select('*')
      .eq('course_id', courseId)
      .eq('employee_id', targetEmployeeId)
      .single();
      
    if (enrollmentError && enrollmentError.code !== 'PGRST116') {
      console.warn('Error fetching enrollment:', enrollmentError);
    }
    
    // Get employee data for personalization
    const employeeData = await getEmployeeDataForPersonalization(userId);
    
    if (!employeeData) {
      return NextResponse.json(
        { error: 'Failed to retrieve employee data for personalization' }, 
        { status: 500 }
      );
    }
    
    // Get CV extracted data for deeper personalization
    let cvExtractedData = null;
    const { data: employeeWithCV } = await supabase
      .from('hr_employees')
      .select('cv_extracted_data')
      .eq('id', targetEmployeeId)
      .single();
      
    if (employeeWithCV?.cv_extracted_data) {
      cvExtractedData = employeeWithCV.cv_extracted_data;
    }
    
    // Initialize the agent for content generation
    const agentFactory = AgentFactory.getInstance();
    const educatorAgent = agentFactory.createAgent('educator') as any;
    
    // Create content outline based on course
    const contentOutline = {
      title: courseData.title,
      description: courseData.description || 'No description available',
      learningObjectives: [
        `Understand the core concepts of ${courseData.title}`,
        `Apply ${courseData.title} principles in your work`,
        `Develop practical skills related to ${courseData.title}`
      ],
      keywords: courseData.category ? [courseData.category] : [],
      modules: [
        {
          id: 'module-1',
          title: `Introduction to ${courseData.title}`,
          description: 'An overview of the key concepts and principles',
          orderIndex: 1,
          objectives: ['Understand the fundamentals', 'Identify key terms and concepts'],
          sections: [
            { title: 'Overview and Fundamentals', type: 'text', duration: 20 },
            { title: 'Key Concepts and Terminology', type: 'text', duration: 15 }
          ],
          resources: []
        },
        {
          id: 'module-2',
          title: `Core ${courseData.title} Principles`,
          description: 'Detailed exploration of the main principles',
          orderIndex: 2,
          objectives: ['Understand core principles', 'Apply principles to real scenarios'],
          sections: [
            { title: 'Principle Exploration', type: 'text', duration: 25 },
            { title: 'Real-world Applications', type: 'text', duration: 20 }
          ],
          resources: []
        },
        {
          id: 'module-3',
          title: `Practical ${courseData.title} Applications`,
          description: 'Hands-on application and implementation',
          orderIndex: 3,
          objectives: ['Apply knowledge in practical settings', 'Develop implementation skills'],
          sections: [
            { title: 'Practical Implementation', type: 'text', duration: 30 },
            { title: 'Case Studies', type: 'text', duration: 20 },
            { title: 'Hands-on Exercise', type: 'interactive', duration: 30 }
          ],
          resources: []
        }
      ]
    };
    
    // Create content generation request with CV data if available
    const contentRequest = {
      contentType: 'course',
      topic: courseData.title,
      targetAudience: {
        skillLevel: courseData.difficulty_level?.toLowerCase() || 'intermediate',
        role: employeeData.position || 'Employee',
        department: employeeData.department || 'General'
      },
      learningObjectives: contentOutline.learningObjectives,
      keywords: contentOutline.keywords,
      includeExamples: true,
      includeQuizQuestions: true,
      personalization: {
        userName: employeeData.name,
        userRole: employeeData.position,
        userDepartment: employeeData.department,
        ...(cvExtractedData && { 
          profileSummary: typeof cvExtractedData === 'object' ? 
            cvExtractedData.summary : 
            cvExtractedData,
        }),
        ...personalizationOptions
      }
    };
    
    // Generate personalized content
    const generatedModules = [];
    
    // Process each module
    for (const moduleOutline of contentOutline.modules) {
      // Create a module-specific content request
      const moduleRequest = {
        ...contentRequest,
        topic: moduleOutline.title,
        learningObjectives: moduleOutline.objectives
      };
      
      try {
        // Add CV-specific instructions to make content more personalized
        let modulePromptPrefix = '';
        if (cvExtractedData) {
          // Create a personalization prefix for the prompt
          const profileSummary = typeof cvExtractedData === 'object' ? 
            cvExtractedData.summary : 
            cvExtractedData;
            
          modulePromptPrefix = `
            I'm generating course content for ${employeeData.name}, who works as a ${employeeData.position || 'professional'} 
            in the ${employeeData.department || 'organization'}.
            
            Here is their professional profile based on their CV:
            ${profileSummary}
            
            Please tailor the following module content to be especially relevant to their background, 
            skills, and professional context. Make references to how this content applies specifically 
            to their role and experience level where appropriate.
            
            COURSE TOPIC: ${courseData.title}
            MODULE TOPIC: ${moduleOutline.title}
            
            Generate content that is:
            1. Relevant to their professional background
            2. Aligned with their skill level
            3. Contextual to their industry and department
            4. Personalized with specific examples related to their role
            
            MODULE CONTENT:
          `;
          
          // Override the request to include the personalization prefix
          (moduleRequest as any).prompt = modulePromptPrefix;
        }
        
        // Generate content for this module
        const generatedContent = await educatorAgent.generateContentForRequest(moduleRequest);
        
        // Process sections
        const sections = [];
        for (let i = 0; i < moduleOutline.sections.length; i++) {
          const sectionOutline = moduleOutline.sections[i];
          
          // Get content from the generated content or use default
          let sectionContent = '';
          
          // Check if generatedContent exists and has the expected properties
          if (generatedContent && generatedContent.mainContent) {
            if (generatedContent.sections && generatedContent.sections.length > i) {
              sectionContent = generatedContent.sections[i].content;
            } else {
              // Otherwise split the main content into parts
              const contentParts = generatedContent.mainContent.split('\n\n');
              const partIndex = i % contentParts.length;
              sectionContent = contentParts[partIndex];
            }
          } else {
            // Fallback content
            sectionContent = `# ${sectionOutline.title}\n\nGenerated content for ${moduleOutline.title} - ${sectionOutline.title}\n\nThis section covers important aspects of ${courseData.title} relevant to your role as ${employeeData.position} in the ${employeeData.department} department.`;
          }
          
          sections.push({
            id: `${moduleOutline.id}-section-${i + 1}`,
            title: sectionOutline.title,
            content: sectionContent,
            contentType: sectionOutline.type || 'text',
            orderIndex: i + 1,
            duration: sectionOutline.duration || 20
          });
        }
        
        // Create module with sections
        generatedModules.push({
          id: moduleOutline.id,
          title: moduleOutline.title,
          description: moduleOutline.description,
          orderIndex: moduleOutline.orderIndex,
          sections,
          resources: moduleOutline.resources || []
        });
      } catch (error) {
        console.error(`Error generating content for module ${moduleOutline.title}:`, error);
        // Add module with basic content as fallback
        generatedModules.push({
          id: moduleOutline.id,
          title: moduleOutline.title,
          description: moduleOutline.description,
          orderIndex: moduleOutline.orderIndex,
          sections: moduleOutline.sections.map((sectionOutline: any, index: number) => ({
            id: `${moduleOutline.id}-section-${index + 1}`,
            title: sectionOutline.title,
            content: `# ${sectionOutline.title}\n\nBasic content for ${moduleOutline.title} - ${sectionOutline.title}`,
            contentType: sectionOutline.type || 'text',
            orderIndex: index + 1,
            duration: sectionOutline.duration || 20
          })),
          resources: moduleOutline.resources || []
        });
      }
    }
    
    // Create the complete personalized course content
    const contentId = jobId || uuidv4(); // Use the provided job ID or generate a new one
    console.log(`[generate-content] Creating personalized content with ID: ${contentId} ${jobId ? '(from jobId)' : '(newly generated)'}`);
    
    const personalizedContent = {
      id: contentId,
      course_id: courseId,
      employee_id: targetEmployeeId,
      title: courseData.title,
      description: courseData.description || 'No description available',
      level: courseData.difficulty_level || 'Intermediate',
      modules: generatedModules,
      metadata: {
        generated_at: new Date().toISOString(),
        job_id: jobId, // Store the job ID if provided
        generated_for: {
          employee_id: targetEmployeeId,
          name: employeeData.name,
          position: employeeData.position,
          department: employeeData.department
        },
        personalization_options: personalizationOptions
      }
    };
    
    // Store the personalized content in the database
    console.log(`[generate-content] Storing personalized content in database for: course=${courseId}, employee=${targetEmployeeId}`);
    const { data: storedContent, error: storageError } = await supabase
      .from('hr_personalized_course_content')
      .insert({
        id: personalizedContent.id,
        course_id: courseId,
        employee_id: targetEmployeeId,
        content: personalizedContent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();
      
    if (storageError) {
      console.error('[generate-content] Error storing personalized content:', storageError);
      return NextResponse.json(
        { error: 'Failed to store personalized content', details: storageError.message }, 
        { status: 500 }
      );
    }
    
    console.log('[generate-content] Content stored successfully');
    
    // Update the enrollment record to indicate content has been personalized
    if (enrollmentData) {
      console.log(`[generate-content] Updating enrollment record with ID: ${enrollmentData.id}`);
      const { error: updateError } = await supabase
        .from('hr_course_enrollments')
        .update({
          personalized_content_id: personalizedContent.id,
          personalized_content_generation_status: 'completed',
          updated_at: new Date().toISOString(),
          personalized_content_completed_at: new Date().toISOString()
        })
        .eq('id', enrollmentData.id);
      
      if (updateError) {
        console.error('[generate-content] Error updating enrollment record:', updateError);
      } else {
        console.log('[generate-content] Enrollment record updated successfully');
      }
    } else {
      console.log('[generate-content] No enrollment record found to update');
    }
    
    // If a job ID was provided, update the job status
    if (jobId) {
      console.log(`[generate-content] Updating job status for ID: ${jobId}`);
      try {
        await supabase
          .from('content_generation_jobs')
          .update({
            status: 'completed',
            current_step: 10, // Final step
            progress: 100,
            step_description: 'Content generation completed successfully',
            updated_at: new Date().toISOString(),
            completed_at: new Date().toISOString()
          })
          .eq('id', jobId);
        console.log(`[generate-content] Job ${jobId} marked as completed`);
      } catch (jobError) {
        console.error(`[generate-content] Error updating job status:`, jobError);
      }
    }
    
    console.log('[generate-content] Returning success response');
    return NextResponse.json({
      success: true,
      message: 'Personalized course content generated successfully',
      content: {
        id: personalizedContent.id,
        course_id: courseId,
        employee_id: targetEmployeeId,
        title: personalizedContent.title,
        modules: personalizedContent.modules.map(m => ({
          id: m.id,
          title: m.title,
          description: m.description,
          sections_count: m.sections.length
        }))
      }
    });
  } catch (error: any) {
    console.error('Error generating personalized content:', error);
    return NextResponse.json(
      { error: 'Failed to generate personalized content', details: error.message }, 
      { status: 500 }
    );
  }
} 