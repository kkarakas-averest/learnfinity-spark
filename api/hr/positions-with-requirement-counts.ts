import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials for deployment
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.MZZMNbG8rpCLQ7sMGKXKQP1YL0dZ_PMVBKBrXL-k7IY';

// Create Supabase client
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
    console.log('Fetching positions with requirement counts...');
    
    // Fetch all positions with department info
    const { data: positions, error: posError } = await supabase
      .from('hr_positions')
      .select('id, title, department_id, hr_departments(name)')
      .order('title', { ascending: true });

    if (posError) {
      console.error('Error fetching positions:', posError);
      throw posError;
    }

    // Fetch all requirements
    const { data: requirements, error: reqError } = await supabase
      .from('position_skill_requirements')
      .select('id, position_id');

    if (reqError) {
      console.error('Error fetching requirements:', reqError);
      throw reqError;
    }

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

    console.log(`Successfully fetched ${result.length} positions`);
    
    return res.status(200).json({ 
      positions: result,
      success: true
    });
  } catch (error) {
    console.error('Error in positions with requirements count:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error fetching positions',
      detail: 'Check server logs for more information',
      success: false
    });
  }
} 