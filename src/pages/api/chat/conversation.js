// @ts-check
/**
 * @param {import('next').NextApiRequest} req
 * @param {import('next').NextApiResponse} res
 */
const { createClient } = require('@supabase/supabase-js');

// Always use the hardcoded Groq API key
const GROQ_API_KEY = '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';
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Updated to the requested Groq model

// Hardcoded Supabase credentials for development
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.MZZMNbG8rpCLQ7sMGKXKQP1YL0dZ_PMVBKBrXL-k7IY';

/**
 * @typedef {Object} ApiResponse
 * @property {string=} response
 * @property {string=} error
 * @property {any=} debug
 */

async function handler(req, res) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Create debugging information
  const debugInfo = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
    method: req.method,
    url: req.url,
    bodyType: typeof req.body,
    hasMessages: false,
    hasEmployeeContext: false
  };

  try {
    // Parse body if it's a string (Edge function behavior)
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { messages, employeeContext } = body;
    
    // Add to debug info
    debugInfo.hasMessages = !!messages && Array.isArray(messages);
    debugInfo.hasEmployeeContext = !!employeeContext;
    debugInfo.messageCount = messages?.length || 0;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ 
        error: 'Messages array is required',
        debug: debugInfo
      });
    }

    // Create Supabase client directly with hardcoded credentials
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user from authorization header or fallback to a default user for testing
    const authHeader = req.headers.authorization;
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
          console.error('Auth error:', error);
          // For development - fall back to testing user ID instead of failing
          userId = 'bec19c44-164f-4a0b-b63d-99697e15040a'; // Example test user ID
        } else {
          userId = user.id;
        }
      } catch (authError) {
        console.error('Auth error:', authError);
        // For development - fall back to testing user ID instead of failing
        userId = 'bec19c44-164f-4a0b-b63d-99697e15040a'; // Example test user ID
      }
    } else {
      // For development - use test user ID
      userId = 'bec19c44-164f-4a0b-b63d-99697e15040a'; // Example test user ID
    }
    
    // Construct the prompt with context
    const systemPrompt = generateSystemPrompt(employeeContext);
    
    // Format messages for API request
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(function(m) {
        return {
          role: m.role === 'system' ? 'assistant' : m.role,
          content: m.content
        };
      })
    ];

    // Add request details to debugging
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
      // Call Groq API using global fetch
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
      
      // Handle Groq API errors
      if (!groqResponse.ok) {
        let errorMessage = groqResponse.statusText;
        try {
          const errorData = await groqResponse.json();
          debugInfo.groqError = errorData;
          errorMessage = errorData.error?.message || groqResponse.statusText;
        } catch (parseError) {
          // If we can't parse JSON from the error, use text
          const errorText = await groqResponse.text();
          debugInfo.groqErrorText = errorText;
          errorMessage = errorText || groqResponse.statusText;
        }
        
        // Log detailed error and return standardized error
        console.error('Groq API error:', { status: groqResponse.status, message: errorMessage, debug: debugInfo });
        return res.status(500).json({ 
          error: `AI service error: ${errorMessage}`,
          debug: debugInfo
        });
      }

      // Parse the response
      const result = await groqResponse.json();
      const aiResponse = result.choices && result.choices[0] && result.choices[0].message && result.choices[0].message.content;
      
      // Add response details to debugging
      debugInfo.hasResponse = !!aiResponse;
      debugInfo.responseLength = aiResponse ? aiResponse.length : 0;

      if (!aiResponse) {
        return res.status(500).json({ 
          error: 'No response generated from AI',
          debug: debugInfo 
        });
      }

      // Try to store the conversation in Supabase, but don't fail if this doesn't work
      try {
        const { error: dbError } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: userId,
            employee_id: employeeContext && employeeContext.employeeId ? employeeContext.employeeId : null,
            messages: apiMessages,
            response: aiResponse,
            created_at: new Date().toISOString()
          });

        if (dbError) {
          console.error('Error storing conversation:', dbError);
          // Non-fatal, continue anyway
          debugInfo.dbError = dbError.message;
        } else {
          debugInfo.savedToDb = true;
        }
      } catch (dbError) {
        console.error('Database error when storing conversation:', dbError);
        // Non-fatal, continue anyway
        debugInfo.dbError = dbError.message;
      }

      // Return the AI response (with debug info in development)
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({ 
          response: aiResponse,
          debug: debugInfo 
        });
      } else {
        return res.status(200).json({ response: aiResponse });
      }
    } catch (groqError) {
      // Handle fetch/network errors
      console.error('Error calling Groq API:', groqError);
      debugInfo.groqFetchError = groqError.message;
      
      return res.status(500).json({ 
        error: `Error calling AI service: ${groqError.message}`, 
        debug: debugInfo 
      });
    }
    
  } catch (error) {
    // Handle all other errors
    console.error('Chat API error:', error);
    debugInfo.fatalError = error.message;
    debugInfo.errorStack = error.stack;
    
    return res.status(500).json({ 
      error: `Internal server error: ${error.message}`,
      debug: debugInfo
    });
  }
}

/**
 * @param {any} employeeContext
 */
function generateSystemPrompt(employeeContext) {
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
    const employeeName = employeeContext.employeeName;
    const skills = employeeContext.skills || [];
    const courses = employeeContext.courses || [];
    
    prompt += `\nEmployee Context:\n- Name: ${employeeName}\n- Existing Skills: ${skills.join(', ')}\n- Current Courses: ${courses.map(function(c) { return c.title; }).join(', ')}\n`;

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
  prompt += `\nYou can help with:\n1. Creating course outlines based on specific skills\n2. Developing learning objectives\n3. Structuring course content and modules\n4. Suggesting assessment methods\n5. Recommending learning resources\n6. Generating example course content`;

  return prompt;
}

module.exports = handler; 