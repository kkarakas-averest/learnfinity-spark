// API endpoint to debug import issues in Vercel functions
// This imports dependencies but doesn't use them

import { getSupabase } from '../../src/lib/supabase.js';

export default function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Return basic success response with import info
    return res.status(200).json({
      success: true,
      message: 'Debug imports endpoint working correctly',
      imports: {
        getSupabase: typeof getSupabase === 'function' ? 'Imported successfully' : 'Import failed'
      },
      environment: process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in debug-imports endpoint:', error);
    return res.status(500).json({
      error: 'Error in debug-imports endpoint',
      message: error.message
    });
  }
} 