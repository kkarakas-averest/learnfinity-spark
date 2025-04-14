// GroqAPI integration utility
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Environment variables - access both browser and server environments
const getEnv = () => {
  // Client-side environment variables must start with VITE_
  const VITE_GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  const VITE_ENABLE_LLM = import.meta.env.VITE_ENABLE_LLM === 'true';

  // TEMPORARY FIX: Hardcoded API key (remove after troubleshooting)
  const HARDCODED_GROQ_API_KEY = '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';
  
  return {
    GROQ_API_KEY: HARDCODED_GROQ_API_KEY || VITE_GROQ_API_KEY,
    ENABLE_LLM: VITE_ENABLE_LLM
  };
};

/**
 * Send a request to GroqAPI for content generation
 */
export async function generateCourseWithGroq(
  topic: string,
  targetAudience: string,
  modules: number = 3,
  sectionsPerModule: number = 3,
  includeQuiz: boolean = true
): Promise<any> {
  console.log('GroqAPI function called with params:', { topic, targetAudience, modules, sectionsPerModule, includeQuiz });
  
  const apiKey = getEnv().GROQ_API_KEY || process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.error('GROQ_API_KEY is missing in environment variables');
    throw new Error('GROQ_API_KEY is not configured');
  } else {
    console.log('GROQ_API_KEY found:', apiKey.substring(0, 5) + '...');
  }

  // Create a structured prompt for course generation
  const systemPrompt = `You are an expert curriculum designer and educator. 
  Your task is to create a comprehensive, well-structured course on the requested topic.
  The content should be engaging, educational, and tailored to the specified audience.
  For each section, provide detailed, rich content with examples, key points, and practical applications.
  Format the content using HTML for rich text display, including h2, h3, p, ul, ol, li, blockquote tags as appropriate.`;

  const prompt = `Create a detailed course on "${topic}" for ${targetAudience} audience.
  
  Please structure the course with the following:
  
  1. Course title
  2. Brief course description (2-3 sentences)
  3. 5-7 learning objectives
  4. ${modules} modules, each containing:
     - Module title
     - Module description
     - ${sectionsPerModule} sections per module, each with:
       - Section title
       - Detailed section content (300-500 words with examples)
  ${includeQuiz ? '5. A quiz with 5 multiple choice questions for each module' : ''}
  
  Format everything as a valid JSON object with the following structure:
  {
    "title": "Course Title",
    "description": "Course description...",
    "learningObjectives": ["objective 1", "objective 2", ...],
    "modules": [
      {
        "title": "Module 1 Title",
        "description": "Module 1 description...",
        "sections": [
          {
            "title": "Section 1.1 Title",
            "content": "<div class='prose max-w-none'>Section 1.1 content with HTML formatting...</div>"
          },
          ...
        ]
      },
      ...
    ],
    "quizzes": [
      {
        "moduleIndex": 0,
        "questions": [
          {
            "question": "Question text?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0
          },
          ...
        ]
      },
      ...
    ]
  }
  
  Ensure all content is professionally written and educational.`;

  console.log('Preparing to call GroqAPI with prompts');

  try {
    // Call GroqAPI with the structured prompt
    console.log('Sending request to GroqAPI...');
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192', // Using Llama 3 70B model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GroqAPI error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`GroqAPI request failed: ${response.status} ${errorText}`);
    }

    console.log('GroqAPI response received with status:', response.status);
    const data = await response.json();
    console.log('GroqAPI response data received:', { 
      choices: data.choices?.length,
      model: data.model,
      usage: data.usage
    });
    
    // Parse the generated content
    try {
      // Extract the content from the response
      const generatedContent = data.choices[0].message.content;
      console.log('Generated content received, length:', generatedContent.length);
      
      // Find the JSON object in the text
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        console.log('JSON match found, attempting to parse');
        try {
          const courseData = JSON.parse(jsonMatch[0]);
          console.log('Successfully parsed course data:', {
            title: courseData.title,
            moduleCount: courseData.modules?.length,
            objectivesCount: courseData.learningObjectives?.length
          });
          return courseData;
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          console.log('Problem JSON snippet (first 100 chars):', jsonMatch[0].substring(0, 100));
          throw new Error('Failed to parse JSON structure - invalid JSON format');
        }
      } else {
        console.error('No JSON match found in content');
        console.log('Content (first 100 chars):', generatedContent.substring(0, 100));
        throw new Error('Failed to extract JSON from GroqAPI response - no JSON object found');
      }
    } catch (parseError) {
      console.error('Error parsing GroqAPI response:', parseError);
      console.log('Raw GroqAPI response (first 100 chars):', 
        data.choices[0].message.content.substring(0, 100));
      throw new Error('Failed to parse course data from GroqAPI: ' + parseError.message);
    }
  } catch (error) {
    console.error('Error in GroqAPI call:', error);
    throw error;
  }
}

/**
 * Generate personalized course content for an employee based on their profile data
 */
export async function generatePersonalizedCourse(
  employeeId: string,
  employeeName: string,
  position: string,
  department: string,
  profileData: any,
  modules: number = 3,
  sectionsPerModule: number = 3,
  includeQuiz: boolean = true
): Promise<any> {
  console.log('Generating personalized course for employee:', { employeeId, employeeName, position, department });
  
  // TEMPORARY FIX: Hardcoded API key (remove after troubleshooting)
  const HARDCODED_GROQ_API_KEY = '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';
  
  const apiKey = HARDCODED_GROQ_API_KEY || getEnv().GROQ_API_KEY || process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.error('GROQ_API_KEY is missing in environment variables');
    throw new Error('GROQ_API_KEY is not configured');
  }

  // Extract key information from profile data
  const skills = Array.isArray(profileData?.skills) ? profileData.skills : [];
  const experience = Array.isArray(profileData?.experience) ? profileData.experience : [];
  const education = Array.isArray(profileData?.education) ? profileData.education : [];
  const certifications = Array.isArray(profileData?.certifications) ? profileData.certifications : [];
  const personalInsights = profileData?.personalInsights || {};
  
  // Create title based on position and top skills
  const topSkills = skills.slice(0, 3).join(", ");
  const courseTopic = `Advanced ${position} Skills${topSkills ? ': ' + topSkills : ''}`;

  // Create a structured prompt for personalized course generation
  const systemPrompt = `You are an expert curriculum designer and educator specializing in personalized professional development.
  Your task is to create a comprehensive, tailored course for the employee based on their profile data.
  The content should directly address their current position, skills, and growth opportunities.`;

  const prompt = `Create a personalized professional development course for:

  Employee Name: ${employeeName}
  Position: ${position}
  Department: ${department}
  
  EMPLOYEE PROFILE DATA:
  - Skills: ${skills.join(", ") || "Not specified"}
  - Experience: ${experience.map(e => `${e.title || ''} at ${e.company || ''}`).join("; ") || "Not specified"}
  - Education: ${education.map(e => `${e.degree || ''} from ${e.institution || ''}`).join("; ") || "Not specified"}
  - Certifications: ${certifications.join(", ") || "Not specified"}
  - Years of Experience: ${personalInsights.yearsOfExperience || "Not specified"}
  - Tools & Technologies: ${personalInsights.toolsAndTechnologies?.join(", ") || "Not specified"}
  
  Please structure the course to help this employee advance in their current position, addressing skill gaps and advancing their expertise.
  
  Create a detailed course with the following:
  
  1. Course title (related to their position and department)
  2. Brief course description focusing on their professional growth needs
  3. 5-7 learning objectives tailored to their profile
  4. ${modules} modules, each containing:
     - Module title
     - Module description
     - ${sectionsPerModule} sections per module, each with:
       - Section title
       - Detailed section content (300-500 words)
  ${includeQuiz ? '5. A personalized quiz with 5 multiple choice questions for each module' : ''}
  
  Format everything as a valid JSON object with the following structure:
  {
    "title": "Course Title",
    "description": "Course description...",
    "learningObjectives": ["objective 1", "objective 2", ...],
    "modules": [
      {
        "title": "Module 1 Title",
        "description": "Module 1 description...",
        "sections": [
          {
            "title": "Section 1.1 Title",
            "content": "<div class='prose max-w-none'>Section 1.1 content with HTML formatting...</div>"
          },
          ...
        ]
      },
      ...
    ],
    "quizzes": [
      {
        "moduleIndex": 0,
        "questions": [
          {
            "question": "Question text?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0
          },
          ...
        ]
      },
      ...
    ]
  }
  
  Ensure the content is professional, directly relevant to ${employeeName}'s career path, and helps them grow in their ${position} role.`;

  try {
    console.log('Calling Groq API for personalized course generation');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Course generation response received:', {
      model: data.model,
      usage: data.usage
    });
    
    // Parse the generated content
    try {
      // Extract the content from the response
      const generatedContent = data.choices[0].message.content;
      console.log('Generated content received, length:', generatedContent.length);
      
      // Find the JSON object in the text
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        console.log('JSON match found, attempting to parse');
        try {
          const courseData = JSON.parse(jsonMatch[0]);
          console.log('Successfully parsed personalized course data:', {
            title: courseData.title,
            moduleCount: courseData.modules?.length,
            objectivesCount: courseData.learningObjectives?.length
          });
          return courseData;
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          throw new Error('Failed to parse JSON structure - invalid JSON format');
        }
      } else {
        console.error('No JSON match found in content');
        throw new Error('Failed to extract JSON from GroqAPI response - no JSON object found');
      }
    } catch (parseError) {
      console.error('Error parsing GroqAPI response:', parseError);
      throw new Error('Failed to parse course data from GroqAPI: ' + parseError.message);
    }
  } catch (error) {
    console.error('Error in personalized course generation:', error);
    throw error;
  }
}

/**
 * Generate personalized content for an existing course based on employee profile data
 */
export async function enhanceCourseContent(
  courseId: string,
  courseTitle: string,
  courseDescription: string,
  employeeId: string,
  employeeName: string,
  position: string,
  department: string,
  profileData: any,
  modules: number = 3,
  sectionsPerModule: number = 3,
  includeQuiz: boolean = true
): Promise<any> {
  console.log('Generating personalized content for existing course:', { 
    courseId, 
    courseTitle, 
    employeeId, 
    employeeName 
  });
  
  // TEMPORARY FIX: Hardcoded API key (remove after troubleshooting)
  const HARDCODED_GROQ_API_KEY = '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';
  
  const apiKey = HARDCODED_GROQ_API_KEY || getEnv().GROQ_API_KEY || process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.error('GROQ_API_KEY is missing in environment variables');
    throw new Error('GROQ_API_KEY is not configured');
  }

  // Extract key information from profile data
  const skills = Array.isArray(profileData?.skills) ? profileData.skills : [];
  const experience = Array.isArray(profileData?.experience) ? profileData.experience : [];
  const education = Array.isArray(profileData?.education) ? profileData.education : [];
  const certifications = Array.isArray(profileData?.certifications) ? profileData.certifications : [];
  const personalInsights = profileData?.personalInsights || {};
  
  // Create a structured prompt for enhancing existing course content
  const systemPrompt = `You are an expert curriculum designer and educator specializing in personalizing existing course content.
  Your task is to create enhanced, tailored course content for an employee based on:
  1. The course's original title and description
  2. The employee's profile data from their CV/resume
  
  The content should directly relate to the course topic while being personalized to the employee's role, experience, and skills.`;

  const prompt = `Enhance the following existing course with personalized content for:

  EMPLOYEE INFO:
  Name: ${employeeName}
  Position: ${position}
  Department: ${department}
  
  COURSE INFO:
  Title: ${courseTitle}
  Description: ${courseDescription}
  
  EMPLOYEE PROFILE DATA:
  - Skills: ${skills.join(", ") || "Not specified"}
  - Experience: ${experience.map(e => `${e.title || ''} at ${e.company || ''}`).join("; ") || "Not specified"}
  - Education: ${education.map(e => `${e.degree || ''} from ${e.institution || ''}`).join("; ") || "Not specified"}
  - Certifications: ${certifications.join(", ") || "Not specified"}
  - Years of Experience: ${personalInsights.yearsOfExperience || "Not specified"}
  - Tools & Technologies: ${personalInsights.toolsAndTechnologies?.join(", ") || "Not specified"}
  
  TASK:
  Create personalized content for this course that will be MOST RELEVANT to ${employeeName}'s current position as a ${position} in the ${department} department.
  Focus on how the course topic applies specifically to their role, background, and career progression.
  
  Create content with the following:
  
  1. Enhanced course description that relates to their professional profile
  2. 5-7 learning objectives tailored to their skills and career needs
  3. ${modules} modules, each containing:
     - Module title (relevant to the course topic AND the employee's position)
     - Module description focusing on how it applies to their role
     - ${sectionsPerModule} sections per module, each with:
       - Section title
       - Detailed section content (300-500 words with HTML formatting)
  ${includeQuiz ? '4. Personalized quiz questions that test knowledge relevant to their position' : ''}
  
  Format everything as a valid JSON object with the following structure:
  {
    "enhancedDescription": "Personalized description that connects course content to employee's profile...",
    "learningObjectives": ["objective 1", "objective 2", ...],
    "modules": [
      {
        "title": "Module 1 Title",
        "description": "Module description explaining relevance to employee...",
        "sections": [
          {
            "title": "Section 1.1 Title",
            "content": "<div class='prose max-w-none'>Section content with HTML formatting...</div>"
          },
          ...
        ]
      },
      ...
    ],
    "quizzes": [
      {
        "moduleIndex": 0,
        "questions": [
          {
            "question": "Question text relevant to their role?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0
          },
          ...
        ]
      },
      ...
    ]
  }
  
  IMPORTANT: Do NOT change the original course topic or purpose. ENHANCE and PERSONALIZE the content to the employee while staying true to the course's original focus.`;

  try {
    console.log('Calling Groq API for course content enhancement');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      throw new Error(`Groq API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Course enhancement response received:', {
      model: data.model,
      usage: data.usage
    });
    
    // Parse the generated content
    try {
      // Extract the content from the response
      const generatedContent = data.choices[0].message.content;
      console.log('Generated content received, length:', generatedContent.length);
      
      // Find the JSON object in the text
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        console.log('JSON match found, attempting to parse');
        try {
          const courseData = JSON.parse(jsonMatch[0]);
          console.log('Successfully parsed enhanced course data:', {
            enhancedDescription: courseData.enhancedDescription?.substring(0, 50) + '...',
            moduleCount: courseData.modules?.length,
            objectivesCount: courseData.learningObjectives?.length
          });
          return courseData;
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          throw new Error('Failed to parse JSON structure - invalid JSON format');
        }
      } else {
        console.error('No JSON match found in content');
        throw new Error('Failed to extract JSON from GroqAPI response - no JSON object found');
      }
    } catch (parseError) {
      console.error('Error parsing GroqAPI response:', parseError);
      throw new Error('Failed to parse course data from GroqAPI: ' + parseError.message);
    }
  } catch (error) {
    console.error('Error in course content enhancement:', error);
    throw error;
  }
} 