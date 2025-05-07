// @vercel/node
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Export config for Vercel
export const config = {
  // runtime: 'nodejs' - removed as per warning about semantics evolving soon
};

// Hardcoded Supabase credentials - environment variables aren't resolving correctly in Vercel
// Using only hardcoded values that don't rely on env vars
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';

// Create Supabase client with simple configuration
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

type PositionWithRequirementCount = {
  id: string;
  title: string;
  department_id: string;
  department_name: string;
  requirement_count: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('[positions-with-requirement-counts] API handler started', {
    method: req.method,
    url: req.url,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'x-vercel-deployment-url': req.headers['x-vercel-deployment-url'],
      host: req.headers.host
    }
  });

  // Set CORS headers for Vercel deployment
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[positions-with-requirement-counts] Fetching positions with requirement counts...');
    console.log('[positions-with-requirement-counts] Using Supabase URL:', SUPABASE_URL);
    console.log('[positions-with-requirement-counts] Service role key (first 10 chars):', SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...');
    
    // Check if Supabase client is properly initialized
    console.log('[positions-with-requirement-counts] Supabase client initialized:', {
      hasFrom: typeof supabase.from === 'function',
      hasAuth: !!supabase.auth
    });
    
    // Fetch all positions with department info
    console.log('[positions-with-requirement-counts] Fetching positions...');
    const { data: positions, error: posError } = await supabase
      .from('hr_positions')
      .select('id, title, department_id, hr_departments(name)')
      .order('title', { ascending: true });

    if (posError) {
      console.error('[positions-with-requirement-counts] Error fetching positions:', posError);
      throw posError;
    }

    console.log(`[positions-with-requirement-counts] Found ${positions?.length || 0} positions`);

    // Fetch all requirements
    console.log('[positions-with-requirement-counts] Fetching requirements...');
    const { data: requirements, error: reqError } = await supabase
      .from('position_skill_requirements')
      .select('id, position_id');

    if (reqError) {
      console.error('[positions-with-requirement-counts] Error fetching requirements:', reqError);
      throw reqError;
    }

    console.log(`[positions-with-requirement-counts] Found ${requirements?.length || 0} requirements`);

    // Count requirements per position in JS
    const countMap = new Map<string, number>();
    (requirements || []).forEach((row: any) => {
      countMap.set(row.position_id, (countMap.get(row.position_id) || 0) + 1);
    });

    const result: PositionWithRequirementCount[] = (positions || []).map((pos: any) => ({
      id: pos.id,
      title: pos.title,
      department_id: pos.department_id,
      department_name: pos.hr_departments?.name ?? '',
      requirement_count: countMap.get(pos.id) || 0,
    }));

    console.log(`[positions-with-requirement-counts] Successfully processed ${result.length} positions`);
    
    return res.status(200).json({ 
      positions: result,
      success: true
    });
  } catch (error) {
    console.error('[positions-with-requirement-counts] Error in positions with requirements count:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('[positions-with-requirement-counts] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    // Log the error in a format that will be easier to parse in Vercel logs
    console.error('[positions-with-requirement-counts] ERROR SUMMARY', JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
      errorObject: error
    }));
    
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error fetching positions',
      detail: 'Check server logs for more information',
      success: false
    });
  }
} 