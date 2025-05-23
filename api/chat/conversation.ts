import type { VercelRequest, VercelResponse } from '@vercel/node';

// Constants used for API calls - use hardcoded values as requested
const GROQ_API_KEY = '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';
const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Keep the original model
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';
const DEV_TOKEN = 'dev-hr-dashboard-token';
const DEV_USER_ID = '5deffe9c-dc0f-4371-9809-abdc82d74f6c';

// Standard CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
};

// Serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Serverless function executed:', req.url);
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    console.log('OPTIONS request received');
    Object.entries(corsHeaders).forEach(([key, value]) => res.setHeader(key, value));
    res.status(200).end();
    return;
  }
  
  // Set CORS headers on the response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('Invalid method:', req.method);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  
  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    hasMessages: false,
    hasEmployeeContext: false
  };
  
  try {
    const { messages, employeeContext } = req.body;
    
    debugInfo.hasMessages = !!messages && Array.isArray(messages);
    debugInfo.hasEmployeeContext = !!employeeContext;
    debugInfo.messageCount = messages?.length || 0;
    
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages array is required', debug: debugInfo });
      return;
    }
    
    // Extract and verify auth token
    const authHeader = req.headers.authorization;
    let userId: string | null = null;

    if (authHeader && authHeader === `Bearer ${DEV_TOKEN}`) {
      // Dev mode: accept hardcoded token and use known user
      userId = DEV_USER_ID;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      // Normal JWT validation
      const token = authHeader.replace('Bearer ', '');
      const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_SERVICE_ROLE_KEY
        }
      });
      if (!userResponse.ok) {
        res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
        return;
      }
      const userData = await userResponse.json();
      userId = userData.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized: User not found' });
        return;
      }
    } else {
      res.status(401).json({ error: 'Unauthorized: No access token provided' });
      return;
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
      // Call GROQ API
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
        
        res.status(500).json({ error: `AI service error: ${errorMessage}`, debug: debugInfo });
        return;
      }
      
      const result = await groqResponse.json();
      const aiResponse = result.choices?.[0]?.message?.content;
      
      debugInfo.hasResponse = !!aiResponse;
      debugInfo.responseLength = aiResponse?.length || 0;
      
      if (!aiResponse) {
        res.status(500).json({ error: 'No response generated from AI', debug: debugInfo });
        return;
      }
      
      // Create response data first to ensure we can return it even if DB save fails
      const isDev = process.env.NODE_ENV === 'development';
      const responseData = isDev 
        ? { response: aiResponse, debug: debugInfo }
        : { response: aiResponse };
      
      // Try to save to database, but don't let failures block the response
      try {
        // Store conversation in database via direct API call
        const dbPayload = {
          user_id: userId,
          employee_id: employeeContext?.employeeId || null,
          messages: apiMessages,
          response: aiResponse,
          created_at: new Date().toISOString()
        };
        
        console.log('Saving to database with payload:', JSON.stringify(dbPayload));
        
        // Only try if it makes sense to do so
        if (SUPABASE_SERVICE_ROLE_KEY) {
          try {
            const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/chat_conversations`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify(dbPayload)
            });
            
            console.log('Database response status:', dbResponse.status);
            
            if (!dbResponse.ok) {
              const dbErrorText = await dbResponse.text();
              console.error('Database error:', dbErrorText);
              debugInfo.dbError = dbErrorText;
            } else {
              debugInfo.savedToDb = true;
              console.log('Successfully saved to database');
            }
          } catch (innerDbError: any) {
            console.error('Database connection error:', innerDbError.message);
            debugInfo.dbConnectionError = innerDbError.message;
          }
        } else {
          console.log('Skipping database save - missing API key');
          debugInfo.dbSkipped = true;
        }
      } catch (dbError: any) {
        console.error('Database save error (non-fatal):', dbError.message);
        debugInfo.dbError = dbError.message;
      }
      
      // Return success response regardless of database save success
      console.log('Sending response:', JSON.stringify(responseData).substring(0, 200) + '...');
      res.status(200).json(responseData);
      
    } catch (error: any) {
      console.error('Error calling AI service:', error);
      res.status(500).json({ 
        error: `Error calling AI service: ${error.message}`, 
        debug: { ...debugInfo, errorMessage: error.message }
      });
    }
  } catch (error: any) {
    console.error('Request processing error:', error);
    res.status(500).json({ 
      error: `Internal server error: ${error.message}`,
      debug: { timestamp: new Date().toISOString(), errorMessage: error.message }
    });
  }
}

function generateSystemPrompt(employeeContext: any): string {
  // Base prompt with LLM instructions
  let systemPrompt = `You are Course Designer AI, an expert educational content creator specialized in corporate and professional training. 
  
Your goal is to assist human HR managers and learning specialists in creating personalized learning experiences for employees.

Guidelines:
- Provide detailed, actionable responses that are tailored to the specific employee context when provided
- Create learning content that addresses skill gaps and aligns with career growth
- Present information clearly with sections, bullet points, and emphasis on key points
- Courses should focus on practical knowledge and workplace application
- Be respectful, professional, and inclusive in your language
- If asked for a full course design, format it properly with modules and sections
- When addressing specific employee skill gaps, be specific about how learning content will help
- Do not fabricate complex technical concepts - be accurate and educational`;

  // Add employee context if available
  if (employeeContext) {
    systemPrompt += `\n\nEmployee Context:`;
    
    if (employeeContext.employeeName) {
      systemPrompt += `\nName: ${employeeContext.employeeName}`;
    }
    
    if (employeeContext.position) {
      systemPrompt += `\nPosition: ${employeeContext.position}`;
    }
    
    if (employeeContext.department) {
      systemPrompt += `\nDepartment: ${employeeContext.department}`;
    }
    
    if (employeeContext.skills && employeeContext.skills.length > 0) {
      systemPrompt += `\n\nExisting Skills: ${employeeContext.skills.join(', ')}`;
    }
    
    if (employeeContext.missingSkills && employeeContext.missingSkills.length > 0) {
      systemPrompt += `\n\nSkill Gaps: ${employeeContext.missingSkills.join(', ')}`;
    }
    
    if (employeeContext.knowledgeAreas && employeeContext.knowledgeAreas.length > 0) {
      systemPrompt += `\n\nKnowledge Areas: ${employeeContext.knowledgeAreas.join(', ')}`;
    }
    
    if (employeeContext.knowledgeGaps && employeeContext.knowledgeGaps.length > 0) {
      systemPrompt += `\n\nKnowledge Gaps: ${employeeContext.knowledgeGaps.join(', ')}`;
    }
    
    if (employeeContext.courses && employeeContext.courses.length > 0) {
      systemPrompt += `\n\nCurrent Courses: ${employeeContext.courses.map((c: any) => c.title).join(', ')}`;
    }
    
    if (employeeContext.cvData) {
      systemPrompt += `\n\nCV Data: ${JSON.stringify(employeeContext.cvData).substring(0, 500)}...`;
    }
  }

  return systemPrompt;
} 