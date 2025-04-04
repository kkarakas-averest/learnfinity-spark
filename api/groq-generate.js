// Direct API endpoint for course generation with GROQ API
// Compatible with Vercel serverless functions

// The GROQ API URL
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// CORS headers helper
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

export default async function handler(req, res) {
  // Set CORS headers for all responses
  setCorsHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { topic, targetAudience } = body;
    
    if (!topic || !targetAudience) {
      return res.status(400).json({ error: 'Missing required fields: topic and targetAudience' });
    }

    // Check for API key
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY environment variable is missing');
      return res.status(500).json({ error: 'API configuration error' });
    }

    // Set up the prompt for the AI
    const systemPrompt = `You are an expert curriculum designer and educator. Create a comprehensive course structure.`;
    const userPrompt = `Create a detailed course on "${topic}" for ${targetAudience} audience.`;

    console.log(`Calling GROQ API to generate content for "${topic}" (${targetAudience})`);
    
    // Call the GROQ API
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    // Check if the API request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GROQ API error:', response.status, errorText);
      return res.status(500).json({ error: 'Error from AI service', details: errorText });
    }

    // Parse the API response
    const data = await response.json();
    const content = data.choices[0].message.content;

    // Return a simple success response with the generated content
    return res.status(200).json({
      success: true,
      content,
      courseId: `custom-${topic.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`
    });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
} 