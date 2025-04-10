// Fixed API endpoint that uses direct Supabase import
// Using the client directly instead of getSupabase helper

import { createClient } from '@supabase/supabase-js';

// Direct Supabase configuration - same as in client.ts
const SUPABASE_URL = "https://ujlqzkkkfatehxeqtbdl.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODA4MzIsImV4cCI6MjA1NjI1NjgzMn0.ed-wciIqkubS4f2T3UNnkgqwzLEdpC-SVZoVsP7-W1E";

// Create Supabase client directly
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export default async function handler(req, res) {
  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Test supabase connection with a simple query
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);
        
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Supabase query error',
          error: error.message
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Direct Supabase connection successful',
        data: {
          queryResult: data,
          client: {
            initialized: !!supabase,
            hasAuth: !!supabase.auth,
            hasFrom: typeof supabase.from === 'function'
          }
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (dbError) {
      return res.status(500).json({
        success: false,
        message: 'Supabase error',
        error: dbError.message
      });
    }
    
  } catch (error) {
    console.error('Error in direct-test endpoint:', error);
    return res.status(500).json({
      error: 'General error',
      message: error.message
    });
  }
} 