import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Always use the hardcoded Groq API key
// TODO: Move GROQ_API_KEY to environment variables as well for better security
const GROQ_API_KEY = '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';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Hardcoded Supabase credentials (SECURITY RISK - Use environment variables)
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co'; 
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';

// Initialize Supabase client with hardcoded keys
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Supabase client is initialized outside the handler now

  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    method: req.method,
    url: req.url,
    bodyType: typeof req.body,
    hasMessages: false,
    hasEmployeeContext: false
  };

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { messages, employeeContext } = body;
    debugInfo.hasMessages = !!messages && Array.isArray(messages);
    debugInfo.hasEmployeeContext = !!employeeContext;
    debugInfo.messageCount = messages?.length || 0;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required', debug: debugInfo });
    }

    const authHeader = req.headers.authorization;
    let userId: string = 'bec19c44-164f-4a0b-b63d-99697e15040a';
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) {
          console.warn('JWT validation error:', error.message);
        } else if (user) {
          userId = user.id;
        } else {
          console.warn('Valid token but user not found for the provided JWT.');
        }
      } catch (authError) {
        console.error('Auth processing error:', authError);
      }
    }

    const systemPrompt = generateSystemPrompt(employeeContext);
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role === 'system' ? 'assistant' : m.role,
        content: m.content
      }))
    ];
    debugInfo.userId = userId;
    debugInfo.groqModel = GROQ_MODEL;
    debugInfo.messageCount = messages.length;
    
    // Log the conversation for easier debugging
    console.log('Chat conversation request:', {
      userId: userId,
      messageCount: messages.length,
      hasEmployeeContext: !!employeeContext,
      groqModel: GROQ_MODEL
    });
    
    try {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
      debugInfo.groqStatusCode = groqResponse.status;
      debugInfo.groqStatusText = groqResponse.statusText;
      if (!groqResponse.ok) {
        let errorMessage = groqResponse.statusText;
        try {
          const errorData = await groqResponse.json();
          debugInfo.groqError = errorData;
          errorMessage = errorData.error?.message || groqResponse.statusText;
        } catch (parseError) {
          const errorText = await groqResponse.text();
          debugInfo.groqErrorText = errorText;
          errorMessage = errorText || groqResponse.statusText;
        }
        return res.status(500).json({ error: `AI service error: ${errorMessage}`, debug: debugInfo });
      }
      const result = await groqResponse.json();
      const aiResponse = result.choices?.[0]?.message?.content;
      debugInfo.hasResponse = !!aiResponse;
      debugInfo.responseLength = aiResponse?.length || 0;
      if (!aiResponse) {
        return res.status(500).json({ error: 'No response generated from AI', debug: debugInfo });
      }
      try {
        const { error: dbError } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: userId,
            employee_id: employeeContext?.employeeId || null,
            messages: apiMessages,
            response: aiResponse,
            created_at: new Date().toISOString()
          });
        if (dbError) {
          debugInfo.dbError = dbError.message;
        } else {
          debugInfo.savedToDb = true;
        }
      } catch (dbError: any) {
        debugInfo.dbError = dbError.message;
      }
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({ response: aiResponse, debug: debugInfo });
      } else {
        return res.status(200).json({ response: aiResponse });
      }
    } catch (groqError: any) {
      debugInfo.groqFetchError = groqError.message;
      return res.status(500).json({ error: `Error calling AI service: ${groqError.message}`, debug: debugInfo });
    }
  } catch (error: any) {
    debugInfo.fatalError = error.message;
    debugInfo.errorStack = error.stack;
    return res.status(500).json({ error: `Internal server error: ${error.message}`, debug: debugInfo });
  }
}

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
  if (employeeContext) {
    const { employeeName, skills = [], courses = [] } = employeeContext;
    prompt += `\nEmployee Context:\n- Name: ${employeeName}\n- Existing Skills: ${skills.join(', ')}\n- Current Courses: ${courses.map((c: any) => c.title).join(', ')}\n`;
    if (skills.length > 0) {
      prompt += `\nThis employee already has proficiency in the skills listed above. Focus on complementary skills or advanced topics that build on this foundation.`;
    }
    if (courses.length > 0) {
      prompt += `\nThe employee is currently enrolled in the courses listed above. Consider how your recommendations might complement or extend these existing courses.`;
    }
  }
  prompt += `\nYou can help with:\n1. Creating course outlines based on specific skills\n2. Developing learning objectives\n3. Structuring course content and modules\n4. Suggesting assessment methods\n5. Recommending learning resources\n6. Generating example course content`;
  return prompt;
} 