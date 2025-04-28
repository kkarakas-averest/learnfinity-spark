import type { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
  regions: ['iad1'],
};

// Constants used for API calls
const GROQ_API_KEY = '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';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.MZZMNbG8rpCLQ7sMGKXKQP1YL0dZ_PMVBKBrXL-k7IY';

// Standard CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Edge API handler function
export default async function handler(req: NextRequest) {
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
  
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    hasMessages: false,
    hasEmployeeContext: false
  };
  
  try {
    // Parse request body
    const body = await req.json();
    const { messages, employeeContext } = body;
    
    debugInfo.hasMessages = !!messages && Array.isArray(messages);
    debugInfo.hasEmployeeContext = !!employeeContext;
    debugInfo.messageCount = messages?.length || 0;
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required', debug: debugInfo }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    // Extract and verify auth token
    let userId: string = 'bec19c44-164f-4a0b-b63d-99697e15040a'; // Default fallback user ID
    const authHeader = req.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        // Get user from Supabase (direct API call instead of SDK)
        const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.id) {
            userId = userData.id;
          } else {
            console.log('Valid token but user not found for the provided JWT.');
          }
        } else {
          console.log('JWT validation error:', await userResponse.text());
        }
      } catch (authError) {
        console.error('Auth processing error:', authError);
      }
    }
    
    // Generate prompt and prepare API messages
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
      // Call GROQ API (works in Edge functions)
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
        
        return new Response(
          JSON.stringify({ error: `AI service error: ${errorMessage}`, debug: debugInfo }),
          { 
            status: 500, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
      
      const result = await groqResponse.json();
      const aiResponse = result.choices?.[0]?.message?.content;
      
      debugInfo.hasResponse = !!aiResponse;
      debugInfo.responseLength = aiResponse?.length || 0;
      
      if (!aiResponse) {
        return new Response(
          JSON.stringify({ error: 'No response generated from AI', debug: debugInfo }),
          { 
            status: 500, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders
            }
          }
        );
      }
      
      try {
        // Store conversation in database via direct API call
        const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/chat_conversations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            user_id: userId,
            employee_id: employeeContext?.employeeId || null,
            messages: apiMessages,
            response: aiResponse,
            created_at: new Date().toISOString()
          })
        });
        
        if (!dbResponse.ok) {
          debugInfo.dbError = await dbResponse.text();
        } else {
          debugInfo.savedToDb = true;
        }
      } catch (dbError: any) {
        debugInfo.dbError = dbError.message;
      }
      
      // Return success response
      const isDev = process.env.NODE_ENV === 'development';
      const responseData = isDev 
        ? { response: aiResponse, debug: debugInfo }
        : { response: aiResponse };
        
      return new Response(
        JSON.stringify(responseData),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
      
    } catch (groqError: any) {
      debugInfo.groqFetchError = groqError.message;
      return new Response(
        JSON.stringify({ error: `Error calling AI service: ${groqError.message}`, debug: debugInfo }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
  } catch (error: any) {
    debugInfo.fatalError = error.message;
    debugInfo.errorStack = error.stack;
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}`, debug: debugInfo }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
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