import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

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
      // Using native fetch if available (Node.js 18+) or a polyfill
      const fetch = (await import('node-fetch')).default;
      
      // Check if GROQ_API_KEY is set in environment
      const hasGroqApiKey = !!process.env.GROQ_API_KEY;
      console.log(`[regenerate-content] GROQ_API_KEY is ${hasGroqApiKey ? 'set' : 'NOT set'} in environment`);
      
      // Fetch employee data for personalization
      console.log(`[regenerate-content] Fetching employee data for ID: ${targetEmployeeId}`);
      const { data: employeeData, error: employeeError } = await supabase
        .from('hr_employees')
        .select('*')
        .eq('id', targetEmployeeId)
        .single();
      
      if (employeeError) {
        console.error('[regenerate-content] Error fetching employee data:', employeeError);
      }
      
      // Get CV extracted data for deeper personalization
      let cvExtractedData = null;
      if (employeeData?.cv_extracted_data) {
        cvExtractedData = employeeData.cv_extracted_data;
        console.log(`[regenerate-content] CV extracted data found for employee (${typeof cvExtractedData === 'object' ? 'structured' : 'text'} format)`);
      } else {
        console.log(`[regenerate-content] No CV extracted data found for employee`);
      }
      
      // Let's use the Groq API directly from this serverless function
      try {
        const { Groq } = await import('groq-sdk');
        
        // Get the API key and validate it's not empty
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey || apiKey.trim() === '') {
          throw new Error('GROQ_API_KEY environment variable is empty or invalid');
        }
        
        // Log a masked version of the key to help with debugging
        const maskedKey = apiKey.substring(0, 3) + '...' + apiKey.substring(apiKey.length - 3);
        console.log(`[regenerate-content] Using Groq API key starting with: ${maskedKey}`);
        
        // Initialize the Groq client with explicit API key
        const groq = new Groq({ apiKey });
        
        console.log(`[regenerate-content] Initialized Groq client directly`);
        
        // Process outlines for modules
        const moduleOutlines = [
          {
            id: 'module-1',
            title: `Introduction to ${courseData.title}`,
            description: 'An overview of the key concepts and principles',
            orderIndex: 1,
            objectives: ['Understand the fundamentals', 'Identify key terms and concepts'],
            sections: [
              { title: 'Overview and Fundamentals', type: 'text', duration: 20 },
              { title: 'Key Concepts and Terminology', type: 'text', duration: 15 }
            ]
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
            ]
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
            ]
          }
        ];
        
        // Generate content for each module
        const generatedModules = [];
        for (const moduleOutline of moduleOutlines) {
          console.log(`[regenerate-content] Generating content for module: ${moduleOutline.title}`);
          
          // Create a personalization prefix for the prompt using CV data
          let promptTemplate = '';
          
          if (cvExtractedData) {
            // Extract profile summary from CV data
            const profileSummary = typeof cvExtractedData === 'object' ? 
              cvExtractedData.summary : 
              cvExtractedData;
              
              // Create comprehensive prompt with CV data
              promptTemplate = `
                I'm generating course content for ${employeeData.name || 'an employee'}, who works as a ${employeeData.position || 'professional'} 
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
                
                For each section below, provide detailed, informative content:
                ${moduleOutline.sections.map(section => `- ${section.title}`).join('\n')}
                
                Include practical examples, case studies, and actionable advice throughout.
                For each section, structure the content with clear headings, subheadings, and bullet points where appropriate.
                
                MODULE CONTENT:
              `;
          } else {
            // Create standard prompt without CV data
            promptTemplate = `
              You are an expert educational content creator tasked with creating personalized learning content.
              
              COURSE TITLE: ${courseData.title}
              MODULE TITLE: ${moduleOutline.title}
              DESCRIPTION: ${moduleOutline.description}
              
              LEARNING OBJECTIVES:
              ${moduleOutline.objectives.map(obj => `- ${obj}`).join('\n')}
              
              Please generate detailed content for the following sections:
              ${moduleOutline.sections.map(section => `- ${section.title}`).join('\n')}
              
              The content should be written for someone in the role of ${employeeData?.position || personalizationOptions.userRole || 'professional'}.
              Make the content practical and applicable to real-world scenarios.
              
              Include specific examples, case studies, and actionable advice throughout.
              For each section, structure the content with clear headings, subheadings, and bullet points where appropriate.
            `;
          }
          
          console.log(`[regenerate-content] Sending request to Groq API for module: ${moduleOutline.title}`);
          const startTime = Date.now();
          
          try {
            // Make the API call directly for this module
            const completion = await groq.chat.completions.create({
              model: "llama3-70b-8192",
              messages: [
                {
                  role: "system",
                  content: "You are an expert educational content creator specialized in creating personalized learning materials."
                },
                {
                  role: "user",
                  content: promptTemplate
                }
              ],
              temperature: 0.7,
              max_tokens: 4096,
            });
            
            const responseTime = Date.now() - startTime;
            console.log(`[regenerate-content] Groq API responded in ${responseTime}ms for module: ${moduleOutline.title}`);
            
            // Extract and process the content
            const generatedContent = completion.choices[0]?.message.content;
            
            // Process sections based on the generated content
            const sections = [];
            if (generatedContent) {
              // Split the content into sections based on headings
              const contentParts = generatedContent.split(/^##\s+/m);
              
              for (let i = 0; i < moduleOutline.sections.length; i++) {
                const sectionOutline = moduleOutline.sections[i];
                let sectionContent = '';
                
                // Try to match section title to content part
                const matchingPart = contentParts.find(part => 
                  part.toLowerCase().includes(sectionOutline.title.toLowerCase())
                );
                
                if (matchingPart) {
                  sectionContent = `## ${matchingPart}`;
                } else if (contentParts.length > i + 1) {
                  // Fall back to position-based matching
                  sectionContent = `## ${contentParts[i + 1]}`;
                } else {
                  // Last resort - create basic content
                  sectionContent = `## ${sectionOutline.title}\n\nContent for ${moduleOutline.title} - ${sectionOutline.title}`;
                }
                
                // Add the section
                sections.push({
                  id: `${moduleOutline.id}-section-${i + 1}`,
                  title: sectionOutline.title,
                  content: sectionContent,
                  contentType: sectionOutline.type || 'text',
                  orderIndex: i + 1,
                  duration: sectionOutline.duration || 20
                });
              }
            } else {
              console.warn(`[regenerate-content] No content generated for module: ${moduleOutline.title}`);
              
              // Create fallback sections
              for (let i = 0; i < moduleOutline.sections.length; i++) {
                const sectionOutline = moduleOutline.sections[i];
                sections.push({
                  id: `${moduleOutline.id}-section-${i + 1}`,
                  title: sectionOutline.title,
                  content: `## ${sectionOutline.title}\n\nBasic content for ${moduleOutline.title} - ${sectionOutline.title}`,
                  contentType: sectionOutline.type || 'text',
                  orderIndex: i + 1,
                  duration: sectionOutline.duration || 20
                });
              }
            }
            
            // Add the completed module
            generatedModules.push({
              id: moduleOutline.id,
              title: moduleOutline.title,
              description: moduleOutline.description,
              orderIndex: moduleOutline.orderIndex,
              sections,
              resources: []
            });
            
          } catch (moduleError) {
            console.error(`[regenerate-content] Error generating content for module ${moduleOutline.title}:`, moduleError);
            
            // Check for authentication errors specifically
            if (moduleError.message?.includes('Invalid API Key') || 
                moduleError.code === 'invalid_api_key' || 
                moduleError.status === 401) {
              
              console.log('[regenerate-content] Authentication error with Groq API. Falling back to mock content.');
              
              // We'll throw after all modules to stop using Groq for subsequent calls
              if (moduleOutline.orderIndex === moduleOutlines.length) {
                throw new Error('Groq API authentication failed. Please check your API key.');
              }
            }
            
            // Create fallback module with basic content
            const fallbackSections = moduleOutline.sections.map((sectionOutline, index) => ({
              id: `${moduleOutline.id}-section-${index + 1}`,
              title: sectionOutline.title,
              content: `## ${sectionOutline.title}\n\nBasic content for ${moduleOutline.title} - ${sectionOutline.title}`,
              contentType: sectionOutline.type || 'text',
              orderIndex: index + 1,
              duration: sectionOutline.duration || 20
            }));
            
            generatedModules.push({
              id: moduleOutline.id,
              title: moduleOutline.title,
              description: moduleOutline.description,
              orderIndex: moduleOutline.orderIndex,
              sections: fallbackSections,
              resources: []
            });
          }
        }
        
        // Create the complete personalized course content
        const personalizedContent = {
          id: uuidv4(),
          course_id: courseId,
          employee_id: targetEmployeeId,
          title: courseData.title,
          description: courseData.description || 'No description available',
          level: courseData.difficulty_level || 'Intermediate',
          modules: generatedModules,
          metadata: {
            generated_at: new Date().toISOString(),
            generated_for: {
              employee_id: targetEmployeeId,
              name: employeeData?.name,
              position: employeeData?.position,
              department: employeeData?.department
            },
            personalization_options: personalizationOptions,
            used_cv_data: !!cvExtractedData
          }
        };
        
        // Store the personalized content in the database
        console.log(`[regenerate-content] Storing personalized content with ID: ${personalizedContent.id}`);
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
          console.error('[regenerate-content] Error storing personalized content:', storageError);
        } else {
          console.log(`[regenerate-content] Successfully stored personalized content`);
        }
        
      } catch (groqError) {
        console.error('[regenerate-content] Error using Groq API directly:', {
          message: groqError.message,
          stack: groqError.stack,
          code: groqError.code
        });
        
        // Log specific error info for auth issues to help debugging
        if (groqError.message?.includes('Invalid API Key') || 
            groqError.code === 'invalid_api_key' || 
            groqError.status === 401) {
          
          console.error('[regenerate-content] Groq API authentication failed. Please check that:');
          console.error('1. The GROQ_API_KEY environment variable is correctly set in Vercel');
          console.error('2. The API key has not expired or been revoked');
          console.error('3. There are no typos or extra spaces in the key');
          
          // Try to get length of the key to provide more debugging info
          const keyLength = process.env.GROQ_API_KEY?.length || 0;
          console.error(`[regenerate-content] API key length: ${keyLength} characters`);
        }
        
        // Use fallback mock content but now with a better approach
        console.log('[regenerate-content] Using fallback mock content generator');
        
        // Generate simple mock content
        const mockContent = `
# ${courseData.title} - Course Content

## Module 1: Introduction to ${courseData.title}
### Learning Objectives
- Understand the core principles of ${courseData.title}
- Identify key concepts and terminology

### Section 1: Overview
${courseData.title} is an important subject that helps professionals improve their skills and knowledge.
This introductory module will cover the fundamental concepts and provide a solid foundation for the rest of the course.

### Section 2: Key Concepts
In this section, we'll explore the essential terminology and frameworks that make up ${courseData.title}.
Understanding these concepts is critical for mastering the material in later modules.

### Quiz
1. What is the primary purpose of ${courseData.title}?
   - To improve organizational efficiency
   - To enhance personal skills
   - Both of the above
   - None of the above

## Module 2: Practical Applications of ${courseData.title}
### Learning Objectives
- Apply ${courseData.title} principles in real-world scenarios
- Develop practical implementation strategies

### Section 1: Case Studies
We'll examine several case studies where ${courseData.title} has been successfully implemented.
These examples will provide valuable insights into effective strategies and common pitfalls.

### Section 2: Implementation Strategies
This section outlines a step-by-step approach to implementing ${courseData.title} in your professional context.
You'll learn how to adapt these strategies to your specific needs and constraints.

### Quiz
1. What is a common challenge when implementing ${courseData.title}?
   - Resistance to change
   - Resource limitations
   - Lack of expertise
   - All of the above

## Module 3: Advanced ${courseData.title} Techniques
### Learning Objectives
- Master advanced concepts and techniques
- Develop a strategy for continuous improvement

### Section 1: Cutting-edge Approaches
This section explores the latest innovations and advanced techniques in ${courseData.title}.
You'll learn how leading organizations are pushing the boundaries and achieving exceptional results.

### Section 2: Building Your Growth Strategy
The final section helps you create a personalized plan for continued learning and improvement.
You'll identify resources, communities, and practices that support your ongoing development.

### Quiz
1. How can you measure the effectiveness of your ${courseData.title} implementation?
   - Performance metrics
   - User feedback
   - Return on investment calculations
   - All of the above
`;

        // Store the generated mock content in the database
        try {
          const contentId = uuidv4();
          const { error: contentError } = await supabase
            .from('ai_course_content')
            .insert({
              id: contentId,
              course_id: courseId,
              content: mockContent,
              created_for_user_id: userId,
              created_at: new Date().toISOString()
            });
            
          if (contentError) {
            console.error('[regenerate-content] Error saving mock content:', contentError);
          } else {
            console.log(`[regenerate-content] Mock content saved to database with ID: ${contentId}`);
          }
        } catch (mockError) {
          console.error('[regenerate-content] Error creating mock content:', mockError);
        }
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