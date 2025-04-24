import { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';

// Your Groq API key - accessing GROQ_API_KEY env variable if available, otherwise using hardcoded key for demo
const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Response types
type ApiResponse = {
  response?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create Supabase server client for auth
    const supabase = createServerSupabaseClient({ req, res });
    
    // Get the session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Check if the user is authenticated
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse request data
    const { messages, employeeContext } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Construct the prompt with context
    const systemPrompt = generateSystemPrompt(employeeContext);
    
    // Format messages for API request
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'system' ? 'assistant' : m.role,
        content: m.content
      }))
    ];

    // Log the conversation for easier debugging
    console.log('Chat conversation request:', {
      userId: session.user.id,
      messageCount: messages.length,
      hasEmployeeContext: !!employeeContext
    });

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    // Handle Groq API errors
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error:', errorData);
      return res.status(500).json({ 
        error: `AI service error: ${errorData.error?.message || response.statusText}` 
      });
    }

    // Parse the response
    const result = await response.json();
    const aiResponse = result.choices[0]?.message?.content;

    if (!aiResponse) {
      return res.status(500).json({ error: 'No response generated from AI' });
    }

    // Store the conversation in Supabase for history/analytics (optional)
    const { error: dbError } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: session.user.id,
        employee_id: employeeContext?.employeeId || null,
        messages: apiMessages,
        response: aiResponse,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Error storing conversation:', dbError);
      // Non-fatal, continue anyway
    }

    // Return the AI response
    return res.status(200).json({ response: aiResponse });
    
  } catch (error: any) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: `Internal server error: ${error.message}` });
  }
}

// Generate a system prompt based on employee context
function generateSystemPrompt(employeeContext: any): string {
  let prompt = `
You are a Course Designer AI, specialized in helping HR professionals create personalized learning content.
Your goal is to help design courses that address specific skill gaps and learning needs.

Guidelines:
- Be concise but informative in your responses
- Ask clarifying questions when needed
- Focus on actionable, educational content
- Recommend specific learning modules and topics
- Provide clear structure for courses
- Consider learning objectives and outcomes
`;

  // Add employee context if available
  if (employeeContext) {
    const { employeeName, skills = [], courses = [] } = employeeContext;
    
    prompt += `\nEmployee Context:
- Name: ${employeeName}
- Existing Skills: ${skills.join(', ')}
- Current Courses: ${courses.map((c: any) => c.title).join(', ')}
`;

    // If employee has skills, add more context
    if (skills.length > 0) {
      prompt += `\nThis employee already has proficiency in the skills listed above. Focus on complementary skills or advanced topics that build on this foundation.`;
    }

    // If employee has courses, add more context
    if (courses.length > 0) {
      prompt += `\nThe employee is currently enrolled in the courses listed above. Consider how your recommendations might complement or extend these existing courses.`;
    }
  }

  // Add capabilities
  prompt += `\nYou can help with:
1. Creating course outlines based on specific skills
2. Developing learning objectives
3. Structuring course content and modules
4. Suggesting assessment methods
5. Recommending learning resources
6. Generating example course content`;

  return prompt;
} 