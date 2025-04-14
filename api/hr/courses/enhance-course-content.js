// API endpoint for enhancing HR course content with personalized data
// Using Groq API to generate personalized content for enrolled courses

import { getSupabase } from '../../../src/lib/supabase.js';
import { z } from 'zod';
import crypto from 'crypto';

// Alternative UUID generation for environments where crypto might not be available
function generateUUID() {
  try {
    // Try native crypto.randomUUID first (Node.js 14.17.0+ and 16.7.0+)
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback to manual UUID creation
    const rnd = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    return [
      Array.from({length: 4}, () => rnd()).join(''),
      Array.from({length: 2}, () => rnd()).join(''),
      Array.from({length: 2}, () => rnd()).join(''),
      Array.from({length: 2}, () => rnd()).join(''),
      Array.from({length: 6}, () => rnd()).join('')
    ].join('-');
  } catch (e) {
    // Final fallback if all else fails
    return `generated-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

// Groq API configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.1-70b-8192';

// TEMPORARY FIX: Hardcoded API key (remove after troubleshooting)
const HARDCODED_GROQ_API_KEY = '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';

// Import GROQ API key from environment
const GROQ_API_KEY = HARDCODED_GROQ_API_KEY || process.env.GROQ_API_KEY;

// Request validation schema
const requestSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID format"),
  employeeProfile: z.object({
    // Basic employee data
    name: z.string(),
    role: z.string().optional(),
    department: z.string().optional(),
    
    // Optional fields from profile data
    skills: z.array(z.string()).optional(),
    experience: z.array(z.any()).optional(),
    education: z.array(z.any()).optional(),
    certifications: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    
    // Any additional extracted data
    cv_extracted_data: z.any().optional()
  }).optional(),
  
  // Optional course ID to enhance a specific course (otherwise enhance all enrolled courses)
  courseId: z.string().optional(),
});

// CORS headers helper
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  // Set CORS headers
  setCorsHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    // Parse request body
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
    
    console.log('Request received for employee data:', body.employeeId);
    
    // Validate request
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.format());
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error.format() 
      });
    }
    
    const { employeeId, employeeProfile, courseId } = validationResult.data;
    
    // Get Supabase instance
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ error: 'Failed to initialize database connection' });
    }
    
    // 1. Fetch employee data if profile wasn't provided
    let profile = employeeProfile;
    if (!profile) {
      const { data: employeeData, error: employeeError } = await supabase
        .from('hr_employees')
        .select(`
          *,
          hr_departments(id, name),
          hr_positions(id, title)
        `)
        .eq('id', employeeId)
        .single();
        
      if (employeeError) {
        console.error('Error fetching employee data:', employeeError);
        return res.status(404).json({ error: 'Employee not found', details: employeeError.message });
      }
      
      profile = {
        name: employeeData.name,
        role: employeeData.hr_positions?.title || '',
        department: employeeData.hr_departments?.name || '',
        cv_extracted_data: employeeData.cv_extracted_data || null
      };
    }
    
    // 2. Fetch enrolled courses
    let enrolledCoursesQuery = supabase
      .from('hr_course_enrollments')
      .select(`
        id,
        course_id,
        status,
        progress,
        hr_courses(
          id,
          title,
          description,
          category,
          skill_level,
          duration,
          status
        )
      `)
      .eq('employee_id', employeeId);
    
    // If specific courseId provided, filter by it
    if (courseId) {
      enrolledCoursesQuery = enrolledCoursesQuery.eq('course_id', courseId);
    }
    
    const { data: enrolledCourses, error: coursesError } = await enrolledCoursesQuery;
    
    if (coursesError) {
      console.error('Error fetching enrolled courses:', coursesError);
      return res.status(500).json({ error: 'Failed to fetch enrolled courses' });
    }
    
    if (!enrolledCourses || enrolledCourses.length === 0) {
      return res.status(404).json({ 
        error: 'No enrolled courses found',
        details: courseId ? 'Specified course not found or not enrolled' : 'Employee has no enrolled courses'
      });
    }
    
    console.log(`Found ${enrolledCourses.length} enrolled courses for enhancement`);
    
    // Check GROQ API key - similar to the implementation in Profile Summary feature
    if (!GROQ_API_KEY && !HARDCODED_GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not configured in process.env and no hardcoded key is available');
      
      // Print all available environment variables (excluding sensitive values)
      const safeEnvVars = Object.keys(process.env)
        .filter(key => !key.toLowerCase().includes('key') && !key.toLowerCase().includes('secret') && !key.toLowerCase().includes('token'))
        .reduce((obj, key) => {
          obj[key] = process.env[key];
          return obj;
        }, {});
      
      console.log('Available environment variables:', safeEnvVars);
      
      return res.status(500).json({ 
        error: 'GROQ API is not configured on the server',
        details: 'The GROQ_API_KEY environment variable is missing'
      });
    }
    
    console.log('GROQ_API_KEY found with prefix:', GROQ_API_KEY?.substring(0, 5) + '...');
    
    // 3. Process each enrolled course to enhance content
    const results = [];
    for (const enrollment of enrolledCourses) {
      const course = enrollment.hr_courses;
      if (!course) continue;
      
      try {
        console.log(`Enhancing course "${course.title}" (${course.id}) for ${profile.name}`);
        
        // Generate personalized content for this course using Groq
        let enhancedContent;
        try {
          enhancedContent = await generatePersonalizedCourseContent(
            GROQ_API_KEY,
            course,
            profile,
            enrollment
          );
          
          if (!enhancedContent || !enhancedContent.course_content) {
            throw new Error('Failed to generate personalized content - invalid response structure');
          }
        } catch (contentGenError) {
          console.error('Content generation error:', contentGenError);
          // Generate minimal fallback content
          enhancedContent = generateFallbackContent(course, profile);
        }
        
        // Save the enhanced content to the database
        let contentRecord;
        try {
          // Create personalization context
          const personalizationContext = {
            userProfile: {
              role: profile.role || 'Employee',
              department: profile.department || 'Department',
              preferences: profile.cv_extracted_data?.personalInsights || {}
            },
            courseContext: {
              title: course.title,
              level: course.skill_level || 'intermediate',
              learningObjectives: enhancedContent.course_content.course_overview?.learning_objectives || []
            },
            employeeContext: {
              department: profile.department || 'Department',
              position: profile.role || 'Position',
              skills: profile.cv_extracted_data?.skills || []
            }
          };
          
          // Insert content record
          const insertResult = await supabase
            .from('ai_course_content')
            .insert({
              course_id: course.id,
              version: `v1-${Date.now()}`,
              created_for_user_id: employeeId,
              metadata: {
                title: course.title || 'Course',
                description: course.description || 'Course description',
                level: course.skill_level || 'intermediate'
              },
              personalization_context: personalizationContext,
              is_active: true
            })
            .select();
            
          if (insertResult.error) {
            console.error('Error creating content record:', insertResult.error);
            throw new Error(`Failed to save AI course content: ${insertResult.error.message}`);
          }
          
          if (!insertResult.data || insertResult.data.length === 0) {
            throw new Error('No content record returned after insert');
          }
          
          contentRecord = insertResult.data[0];
          console.log('Created content record with ID:', contentRecord.id);
          
        } catch (dbError) {
          console.error('Database error saving content:', dbError);
          console.log('Detailed error:', JSON.stringify(dbError, Object.getOwnPropertyNames(dbError)));
          throw dbError;
        }
        
        const contentId = contentRecord.id;
        console.log('Saving sections and quizzes for content ID:', contentId);
        
        // Save module and section content
        const modules = enhancedContent.course_content.modules || [];
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i];
          
          // Generate proper UUID for module
          const moduleUuid = generateUUID();
          console.log(`Generated module UUID: ${moduleUuid} for module ${i+1}`);
          
          // Save module sections
          const sections = module.sections || [];
          for (let j = 0; j < sections.length; j++) {
            const section = sections[j];
            
            // Format content as HTML
            let sectionHtml = section.content || '<p>Section content</p>';
            if (!sectionHtml.startsWith('<div') && !sectionHtml.startsWith('<p')) {
              sectionHtml = `<div class="prose max-w-none">${sectionHtml}</div>`;
            }
            
            try {
              const sectionResult = await supabase
                .from('ai_course_content_sections')
                .insert({
                  content_id: contentId,
                  module_id: moduleUuid, // Use UUID instead of string ID
                  section_id: section.id || `section-${i+1}-${j+1}`,
                  title: section.title || `Section ${j+1}`,
                  content: sectionHtml,
                  order_index: j
                });
                
              if (sectionResult.error) {
                console.error(`Error saving section ${j} for module ${i}:`, sectionResult.error);
                // Continue with other sections
              }
            } catch (sectionError) {
              console.error(`Exception saving section ${j} for module ${i}:`, sectionError);
              // Continue with other sections
            }
          }
          
          // Save quiz questions if available
          if (module.quiz && Array.isArray(module.quiz.questions)) {
            for (let k = 0; k < module.quiz.questions.length; k++) {
              try {
                const question = module.quiz.questions[k];
                
                // Ensure options is a valid JSONB array
                const questionOptions = question.options || question.answers || ['Option A', 'Option B', 'Option C', 'Option D'];
                const correctAnswer = question.correctAnswer || question.correct_answer || questionOptions[0] || 'Option A';
                
                // Create proper quiz question record
                const questionResult = await supabase
                  .from('ai_course_quiz_questions')
                  .insert({
                    content_id: contentId,
                    module_id: moduleUuid, // Use UUID instead of string ID
                    question: question.question || `Quiz question ${k+1}`,
                    options: JSON.stringify(questionOptions),
                    correct_answer: correctAnswer,
                    explanation: question.explanation || '',
                    difficulty: 'intermediate'
                  });
                  
                if (questionResult.error) {
                  console.error(`Error saving quiz question ${k}:`, questionResult.error);
                  console.log('Question data:', {
                    content_id: contentId,
                    module_id: moduleUuid,
                    question: question.question || `Quiz question ${k+1}`,
                    optionsType: typeof questionOptions,
                    correctAnswer: correctAnswer
                  });
                }
              } catch (quizError) {
                console.error('Exception saving quiz question:', quizError);
                // Continue with other questions
              }
            }
          }
        }
        
        results.push({
          courseId: course.id,
          title: course.title,
          success: true,
          contentId: contentId,
          moduleCount: modules.length
        });
        
      } catch (courseError) {
        console.error(`Error enhancing course ${course.id}:`, courseError);
        console.log('Detailed error:', JSON.stringify(courseError, Object.getOwnPropertyNames(courseError)));
        results.push({
          courseId: course.id,
          title: course.title || 'Course',
          success: false,
          error: courseError.message
        });
      }
    }
    
    return res.status(200).json({
      success: true,
      processed: enrolledCourses.length,
      results
    });
    
  } catch (error) {
    console.error('Error enhancing course content:', error);
    console.log('Detailed error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return res.status(500).json({ 
      error: 'Failed to enhance course content', 
      details: error.message 
    });
  }
}

/**
 * Generate personalized course content for an employee using Groq API
 */
async function generatePersonalizedCourseContent(apiKey, course, profile, enrollment) {
  console.log('----------- GROQ DIRECT CALL START -----------');
  
  // TEMPORARY: Force use of hardcoded key
  apiKey = HARDCODED_GROQ_API_KEY || apiKey;
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };
  
  console.log('----------- GROQ DIRECT CALL START -----------');
  console.log(`Course: "${course.title}" (${course.id})`);
  console.log(`Employee: ${profile.name}, Department: ${profile.department || 'Unknown'}, Role: ${profile.role || 'Unknown'}`);
  
  // Create a rich prompt that includes employee profile and course details
  const systemPrompt = `You are an expert curriculum designer and educator who specializes in creating personalized learning content. 
Your task is to create a detailed, personalized course structure based on an employee's profile and an existing course.
Format your response as a JSON object with the structure specified below.`;

  // Build a detailed user prompt with all relevant information
  const userPrompt = `
Create a personalized version of the following course for this specific employee:

COURSE DETAILS:
- Title: ${course.title}
- Description: ${course.description || 'No description provided'}
- Category: ${course.category || 'General'}
- Skill Level: ${course.skill_level || 'Intermediate'}
- Duration: ${course.duration || '2-3 hours'} minutes

EMPLOYEE PROFILE:
- Name: ${profile.name}
- Role: ${profile.role || 'Not specified'}
- Department: ${profile.department || 'Not specified'}
${profile.cv_extracted_data ? `
- Skills: ${(profile.cv_extracted_data.skills || []).join(', ')}
- Experience: ${formatExperienceForPrompt(profile.cv_extracted_data.experience)}
- Education: ${formatEducationForPrompt(profile.cv_extracted_data.education)}
- Certifications: ${(profile.cv_extracted_data.certifications || []).join(', ')}
- Key Achievements: ${(profile.cv_extracted_data.keyAchievements || []).join(', ')}
- Years of Experience: ${profile.cv_extracted_data.personalInsights?.yearsOfExperience || 'Not specified'}
- Industries: ${(profile.cv_extracted_data.personalInsights?.industries || []).join(', ')}
- Tools & Technologies: ${(profile.cv_extracted_data.personalInsights?.toolsAndTechnologies || []).join(', ')}
- Soft Skills: ${(profile.cv_extracted_data.personalInsights?.softSkills || []).join(', ')}
` : ''}

ENROLLMENT DETAILS:
- Current Progress: ${enrollment.progress || 0}%
- Status: ${enrollment.status || 'enrolled'}

PERSONALIZATION GUIDELINES:
1. Adapt the content to be directly relevant to the employee's role, industry, and experience level
2. Incorporate examples that relate to their department and responsibilities
3. Reference technologies or tools they already know, when applicable
4. Structure content to build on their existing skills and knowledge
5. Include practical exercises that would be valuable in their specific role
6. Highlight how course concepts apply specifically to their industry
7. Make connections to their educational background where relevant
8. The content should feel tailored specifically for this individual

CREATE A COMPLETE COURSE with:
- A personalized overview highlighting why this course is valuable for this specific employee
- 3-5 modules (depending on course size)
- 3-4 sections per module
- Each module should include at least one quiz with 3-5 questions
- All content should be directly relevant and appropriately challenging for this individual

Format your response as valid JSON matching this structure:
{
  "course_content": {
    "course_overview": {
      "title": "personalized course title",
      "description": "personalized course description",
      "learning_objectives": ["objective 1", "objective 2", ...],
      "relevance_to_employee": "paragraph explaining specific relevance to this employee"
    },
    "modules": [
      {
        "id": "module-1",
        "title": "Module 1: Title",
        "description": "Module description",
        "sections": [
          {
            "id": "section-1-1",
            "title": "Section Title",
            "type": "text/video/exercise",
            "content": "Detailed section content with personalized examples",
            "duration": 20
          },
          ...more sections...
        ],
        "quiz": {
          "questions": [
            {
              "question": "Question text?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correct_answer": "Option B",
              "explanation": "Explanation for why this is correct"
            },
            ...more questions...
          ]
        }
      },
      ...more modules...
    ]
  }
}

Respond ONLY with the JSON object, no additional text.`;

  console.log("Calling Groq API with model:", GROQ_MODEL);
  console.log("Prompt excerpt:", userPrompt.substring(0, 200) + "...");

  try {
    // Call the Groq API
    let retries = 2;
    let response;
    
    while (retries >= 0) {
      try {
        console.log(`Groq API attempt ${2-retries+1} of 3`);
        response = await fetch(GROQ_API_URL, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
            max_tokens: 4000
          })
        });
        
        // If success, break out of retry loop
        if (response.ok) {
          console.log("Groq API responded successfully");
          break;
        }
        
        console.error(`Groq API responded with error status: ${response.status}`);
        
        // If error is not retriable, also break
        if (response.status !== 429 && response.status !== 500 && response.status !== 503) break;
        
        // Otherwise, retry after short delay
        retries--;
        if (retries >= 0) {
          const delay = (2 - retries) * 1000; // Incremental backoff
          console.log(`Retrying Groq API call after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (fetchError) {
        console.error("Network error calling Groq API:", fetchError);
        console.log("Fetch error details:", fetchError.message);
        retries--;
        if (retries < 0) throw fetchError;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (!response || !response.ok) {
      const errorData = response ? await response.json().catch(() => ({})) : {};
      console.error("Groq API error:", errorData);
      console.log("Groq API error status:", response?.status);
      console.log("Groq API error details:", errorData?.error?.message || "Unknown error");
      throw new Error(`Groq API error (${response?.status}): ${errorData.error?.message || 'Unknown error'}`);
    }

    // Parse the response
    const data = await response.json();
    console.log("Received response from Groq API");
    console.log("Response metadata:", {
      model: data.model,
      usage: data.usage,
      choices: data.choices?.length || 0
    });
    
    const content = data.choices[0].message.content;
    
    console.log("Content received, length:", content.length);
    console.log("Content preview:", content.substring(0, 150) + "...");
    
    // Try to parse the content as JSON
    try {
      // First try direct parse
      const parsedData = JSON.parse(content);
      console.log('Successfully parsed response JSON directly');
      console.log('----------- GROQ DIRECT CALL COMPLETE -----------');
      return parsedData;
    } catch (parseError) {
      console.error('Error parsing JSON from Groq response:', parseError);
      
      // Try to extract JSON from the response if it contains text
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/```\s*([\s\S]*?)\s*```/) ||
                       content.match(/\{[\s\S]*\}/);
                       
      if (jsonMatch) {
        try {
          const jsonString = jsonMatch[1] || jsonMatch[0];
          console.log('Extracted potential JSON:', jsonString.substring(0, 100) + '...');
          const extractedData = JSON.parse(jsonString);
          console.log('Successfully parsed JSON from extracted content');
          console.log('----------- GROQ DIRECT CALL COMPLETE -----------');
          return extractedData;
        } catch (extractError) {
          console.error('Error parsing extracted JSON:', extractError);
          console.log('Full content:', content);
          console.log('----------- GROQ DIRECT CALL FAILED -----------');
          throw new Error('Failed to parse JSON from Groq response');
        }
      }
      
      console.log('Full content:', content);
      console.log('----------- GROQ DIRECT CALL FAILED -----------');
      throw new Error('Failed to extract JSON from Groq response');
    }
  } catch (error) {
    console.error('Error in Groq API call:', error);
    console.log('Error details:', error.message);
    console.log('----------- GROQ DIRECT CALL FAILED -----------');
    throw error;
  }
}

/**
 * Format experience entries for the prompt
 */
function formatExperienceForPrompt(experience) {
  if (!experience || !Array.isArray(experience) || experience.length === 0) {
    return 'Not specified';
  }
  
  return experience.map(exp => 
    `${exp.title || 'Role'} at ${exp.company || 'Company'} (${exp.duration || 'Unknown duration'})`
  ).join('; ');
}

/**
 * Format education entries for the prompt
 */
function formatEducationForPrompt(education) {
  if (!education || !Array.isArray(education) || education.length === 0) {
    return 'Not specified';
  }
  
  return education.map(edu => 
    `${edu.degree || 'Degree'} from ${edu.institution || 'Institution'} (${edu.year || ''})`
  ).join('; ');
}

/**
 * Generate fallback content if GROQ API fails
 */
function generateFallbackContent(course, profile) {
  console.log('Generating fallback content for course:', course.title);
  
  const courseTitle = course.title || 'Course';
  const courseDesc = course.description || 'Course description';
  const employeeName = profile.name || 'Employee';
  const employeeRole = profile.role || 'Employee';
  const employeeDept = profile.department || 'Department';
  
  return {
    course_content: {
      course_overview: {
        title: `${courseTitle} for ${employeeRole}s`,
        description: `This course on ${courseTitle} has been customized for ${employeeName} in the ${employeeDept} department.`,
        learning_objectives: [
          "Understand core concepts relevant to your role",
          "Apply key principles to your department's challenges", 
          "Develop skills relevant to your position"
        ],
        relevance_to_employee: `As a ${employeeRole} in the ${employeeDept} department, this course will help you develop skills directly applicable to your daily responsibilities.`
      },
      modules: [
        {
          id: "module-1",
          title: "Module 1: Introduction",
          description: "An introduction to the core concepts",
          sections: [
            {
              id: "section-1-1",
              title: "Overview",
              type: "text",
              content: `<div class="prose max-w-none"><p>Welcome to this course. As a ${employeeRole} in ${employeeDept}, you'll find these concepts particularly useful in your daily work.</p><p>${courseDesc}</p></div>`,
              duration: 15
            },
            {
              id: "section-1-2",
              title: "Getting Started",
              type: "text",
              content: "<div class=\"prose max-w-none\"><p>In this section, we'll introduce the fundamental concepts of the course and how they apply to your specific role.</p></div>",
              duration: 20
            }
          ],
          quiz: {
            questions: [
              {
                question: "Which department will find this content most relevant?",
                options: ["Sales", "Marketing", "Engineering", employeeDept],
                correct_answer: employeeDept,
                explanation: `This content has been customized specifically for the ${employeeDept} department.`
              },
              {
                question: "What is the main benefit of personalized learning?",
                options: ["It's faster", "It's more relevant to your role", "It's easier", "It's more comprehensive"],
                correct_answer: "It's more relevant to your role",
                explanation: "Personalized learning provides content that is directly applicable to your specific job responsibilities."
              }
            ]
          }
        },
        {
          id: "module-2",
          title: "Module 2: Core Concepts",
          description: "Explore the essential concepts of the course",
          sections: [
            {
              id: "section-2-1",
              title: "Key Principles",
              type: "text",
              content: "<div class=\"prose max-w-none\"><p>These key principles form the foundation of the subject and will be particularly relevant to your role.</p></div>",
              duration: 25
            },
            {
              id: "section-2-2",
              title: "Practical Applications",
              type: "exercise",
              content: `<div class="prose max-w-none"><p>Let's explore how these concepts apply specifically to your work in the ${employeeDept} department.</p></div>`,
              duration: 30
            }
          ],
          quiz: {
            questions: [
              {
                question: "How can you apply these concepts in your daily work?",
                options: ["They aren't applicable", "Only in special cases", "In most of your daily tasks", "Only in team meetings"],
                correct_answer: "In most of your daily tasks",
                explanation: "The concepts taught in this course are designed to be directly applicable to your regular responsibilities."
              }
            ]
          }
        },
        {
          id: "module-3",
          title: "Module 3: Advanced Applications",
          description: "Take your skills to the next level",
          sections: [
            {
              id: "section-3-1",
              title: "Advanced Techniques",
              type: "text",
              content: "<div class=\"prose max-w-none\"><p>These advanced techniques will help you excel in your specific role.</p></div>",
              duration: 35
            }
          ],
          quiz: {
            questions: [
              {
                question: "What's the best way to implement these advanced techniques?",
                options: ["All at once", "Gradually in relevant situations", "Only when required", "Delegate to others"],
                correct_answer: "Gradually in relevant situations",
                explanation: "Implementing these techniques gradually in situations where they're most relevant will help you master them over time."
              }
            ]
          }
        }
      ]
    }
  };
} 