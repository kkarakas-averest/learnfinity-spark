// Ultra simplified test endpoint for Groq API

// Import libraries directly with require
const axios = require('axios');

// Hard-coded API key for testing
const API_KEY = "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";

// GROQ API URL
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

module.exports = async (req, res) => {
  try {
    // Add basic CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Basic validation
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    // Parse request body - handle both string and object formats
    const requestBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { prompt = 'Say hello' } = requestBody;
    
    console.log('Making request to Groq API with prompt:', prompt);
    
    // Make request to Groq API using axios
    const response = await axios({
      method: 'post',
      url: GROQ_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      data: {
        model: 'llama3-70b-8192',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      }
    });
    
    // Success case
    const content = response.data.choices[0].message.content;
    return res.status(200).json({ success: true, content });
  } catch (error) {
    // Detailed error response
    console.error('Error in Groq test endpoint:', error);
    
    // Format axios error response
    let errorDetails = error.message;
    if (error.response) {
      errorDetails = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      };
      console.error('Axios error response:', errorDetails);
    }
    
    return res.status(500).json({
      error: 'Failed to connect to Groq API',
      details: errorDetails
    });
  }
}; 