import { env } from '@/env.mjs';

// GroqAPI integration utility
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
  const apiKey = env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
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

  try {
    // Call GroqAPI with the structured prompt
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
      const errorData = await response.text();
      throw new Error(`GroqAPI request failed: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    
    // Parse the generated content
    try {
      // Extract the content from the response
      const generatedContent = data.choices[0].message.content;
      
      // Find the JSON object in the text
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const courseData = JSON.parse(jsonMatch[0]);
        return courseData;
      } else {
        throw new Error('Failed to parse JSON from GroqAPI response');
      }
    } catch (parseError) {
      console.error('Error parsing GroqAPI response:', parseError);
      console.log('Raw GroqAPI response:', data.choices[0].message.content);
      throw new Error('Failed to parse course data from GroqAPI');
    }
  } catch (error) {
    console.error('Error calling GroqAPI:', error);
    throw error;
  }
} 