// API endpoint to debug Supabase connection issues in Vercel functions
// This connects to Supabase but doesn't run any queries

import { getSupabase } from '../../src/lib/supabase.js';

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
    
    // Try to get Supabase client
    let connectionStatus = 'Not attempted';
    let supabaseInfo = {};
    
    try {
      const supabase = getSupabase();
      connectionStatus = supabase ? 'Connection successful' : 'Connection failed';
      
      // Get limited info about the connection object (without exposing secrets)
      if (supabase) {
        supabaseInfo = {
          auth: !!supabase.auth,
          rest: !!supabase.rest,
          functions: !!supabase.functions,
          from: typeof supabase.from === 'function'
        };
      }
    } catch (dbError) {
      connectionStatus = 'Connection error';
      supabaseInfo = {
        error: dbError.message
      };
    }
    
    // Return basic success response with connection info
    return res.status(200).json({
      success: true,
      message: 'Debug Supabase endpoint working correctly',
      supabase: {
        connectionStatus,
        ...supabaseInfo
      },
      environment: process.env.NODE_ENV || 'unknown',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in debug-supabase endpoint:', error);
    return res.status(500).json({
      error: 'Error in debug-supabase endpoint',
      message: error.message
    });
  }
} 