import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Debug endpoint to check API health and Supabase connection
 * This helps verify that API routes are returning JSON correctly and not HTML
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  console.log(`[DEBUG-API-HEALTH] Request received from ${req.url}`);
  
  // Prepare response object with detailed diagnostics
  const response = {
    status: 'ok',
    api: {
      status: 'ok',
      message: 'API endpoints are functioning correctly'
    },
    supabase: {
      status: 'unknown',
      connection: null,
      env_vars: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'missing',
        anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing',
        service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'present' : 'missing'
      }
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL || 'not set',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set'
    },
    request: {
      headers: {
        accept: req.headers.get('accept'),
        content_type: req.headers.get('content-type'),
        user_agent: req.headers.get('user-agent')
      }
    },
    timestamp: new Date().toISOString(),
    execution_time_ms: 0
  };
  
  try {
    // Test Supabase connection by making a simple query
    console.log('[DEBUG-API-HEALTH] Testing Supabase connection...');
    
    const { data, error, status } = await supabase
      .from('health_check')
      .select('id')
      .limit(1)
      .maybeSingle();
      
    if (error) {
      // Try another table if health_check doesn't exist
      console.log('[DEBUG-API-HEALTH] health_check table not found, trying content_generation_jobs...');
      
      const fallbackCheck = await supabase
        .from('content_generation_jobs')
        .select('count(*)', { count: 'exact', head: true });
        
      if (fallbackCheck.error) {
        response.supabase.status = 'error';
        response.supabase.connection = {
          error: fallbackCheck.error.message,
          code: fallbackCheck.error.code,
          status: fallbackCheck.status
        };
      } else {
        response.supabase.status = 'ok';
        response.supabase.connection = {
          status: fallbackCheck.status,
          message: 'Successfully connected to database'
        };
      }
    } else {
      response.supabase.status = 'ok';
      response.supabase.connection = {
        status,
        message: 'Successfully connected to database'
      };
    }
  } catch (error) {
    console.error('[DEBUG-API-HEALTH] Error testing Supabase connection:', error);
    response.supabase.status = 'error';
    response.supabase.connection = {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
    response.status = 'warning';
  }
  
  // Calculate execution time
  response.execution_time_ms = Date.now() - startTime;
  
  // Return response with proper headers to ensure it's treated as JSON
  return NextResponse.json(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
} 