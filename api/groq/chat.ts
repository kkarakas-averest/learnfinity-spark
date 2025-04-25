import { createClient } from '@supabase/supabase-js';

// Always use the hardcoded Groq API key
const GROQ_API_KEY = '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';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.MZZMNbG8rpCLQ7sMGKXKQP1YL0dZ_PMVBKBrXL-k7IY';

// Define the FetchEvent interface for Edge runtime
interface FetchEvent extends Event {
  request: Request;
  respondWith(response: Response | Promise<Response>): void;
}

// Setup proper fetch event listener for the Edge runtime
addEventListener('fetch', ((event: FetchEvent) => {
  event.respondWith(handleRequest(event.request));
}) as EventListener);

// System prompt generator for personalized context
function generateSystemPrompt(employeeContext: any): string {
  let basePrompt = `You are an AI assistant specialized in HR and course content creation for Learnfinity, a corporate learning platform.
  
  Your role is to help HR professionals create personalized learning content and answer questions about employee development.
  
  - Be professional, supportive, and concise in your responses
  - Focus on providing practical, actionable advice for employee development
  - When suggesting courses or content, consider the employee's skills, experience, and career path`;
  
  // If employee context is provided, add personalized information
  if (employeeContext) {
    basePrompt += `\n\nYou are currently assisting with content for employee: ${employeeContext.name || 'Unknown'}, who works as ${employeeContext.position || 'Unknown'} in the ${employeeContext.department || 'Unknown'} department.`;
    
    if (employeeContext.skills && employeeContext.skills.length > 0) {
      basePrompt += `\n\nThe employee has the following skills: ${employeeContext.skills.map((s: any) => `${s.skill_name} (${s.proficiency_level})`).join(', ')}.`;
    }
    
    if (employeeContext.missingSkills && employeeContext.missingSkills.length > 0) {
      basePrompt += `\n\nSkill gaps that need development: ${employeeContext.missingSkills.map((s: any) => s.skill_name).join(', ')}.`;
    }
    
    if (employeeContext.career && employeeContext.career.goals) {
      basePrompt += `\n\nCareer goals: ${employeeContext.career.goals}`;
    }
  }
  
  return basePrompt;
}

// Main request handler function
async function handleRequest(req: Request): Promise<Response> {
  // Set CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  // Create debugging information
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
    
    // Add to debug info
    debugInfo.hasMessages = !!messages && Array.isArray(messages);
    debugInfo.hasEmployeeContext = !!employeeContext;
    debugInfo.messageCount = messages?.length || 0;
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ 
          error: 'Messages array is required', 
          debug: debugInfo 
        }),
        { 
          status: 400, 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Create Supabase client directly with hardcoded credentials
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user from authorization header or fallback to a default user for testing
    const authHeader = req.headers.get('authorization');
    let userId: string = 'bec19c44-164f-4a0b-b63d-99697e15040a'; // Default test user ID
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
          userId = user.id;
        }
      } catch {} // Fallback to default on error
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
    
    // Add request details to debugging
    debugInfo.userId = userId;
    debugInfo.groqModel = GROQ_MODEL;
    debugInfo.messageCount = messages.length;
    
    console.log(`[GroqChat] Processing chat request with ${messages.length} messages`);
    
    // Call Groq API using fetch
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
    
    // Add response status to debugging
    debugInfo.groqStatusCode = groqResponse.status;
    debugInfo.groqStatusText = groqResponse.statusText;
    
    console.log(`[GroqChat] Received response with status: ${groqResponse.status}`);
    
    // Handle Groq API errors
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
      
      console.error(`[GroqChat] Error from Groq API: ${errorMessage}`);
      
      return new Response(
        JSON.stringify({ 
          error: `AI service error: ${errorMessage}`, 
          debug: debugInfo 
        }),
        { 
          status: 500, 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    // Parse the response
    const result = await groqResponse.json();
    const aiResponse = result.choices?.[0]?.message?.content;
    
    // Add response details to debugging
    debugInfo.hasResponse = !!aiResponse;
    debugInfo.responseLength = aiResponse?.length || 0;
    
    if (!aiResponse) {
      console.error(`[GroqChat] No response content received from Groq API`);
      return new Response(
        JSON.stringify({ 
          error: 'No response generated from AI', 
          debug: debugInfo 
        }),
        { 
          status: 500, 
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    console.log(`[GroqChat] Successfully generated response (${aiResponse.length} chars)`);
    
    // Try to save conversation to database
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
        console.warn(`[GroqChat] Failed to save conversation to database: ${dbError.message}`);
        debugInfo.dbError = dbError.message;
      } else {
        debugInfo.savedToDb = true;
      }
    } catch (dbError: any) {
      console.warn(`[GroqChat] Exception saving conversation: ${dbError.message}`);
      debugInfo.dbError = dbError.message;
    }
    
    // Return successful response
    const responseObj = process.env.NODE_ENV === 'development'
      ? { response: aiResponse, debug: debugInfo }
      : { response: aiResponse };
    
    return new Response(
      JSON.stringify(responseObj),
      { 
        status: 200, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error: any) {
    debugInfo.fatalError = error.message;
    debugInfo.errorStack = error.stack;
    
    console.error(`[GroqChat] Fatal error: ${error.message}`);
    
    return new Response(
      JSON.stringify({ 
        error: `Internal server error: ${error.message}`, 
        debug: debugInfo 
      }),
      { 
        status: 500, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Export the handler for compatibility with Vercel Functions
export default handleRequest; 