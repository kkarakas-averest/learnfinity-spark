import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials for debugging (replace with your actual values if needed)
const SUPABASE_URL = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODA4MzIsImV4cCI6MjA1NjI1NjgzMn0.ed-wciIqkubS4f2T3UNnkgqwzLEdpC-SVZoVsP7-W1E';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch all positions with department info
    const { data: positions, error: posError } = await supabase
      .from('hr_positions')
      .select('id, title, department_id, hr_departments(name)')
      .order('title', { ascending: true });

    if (posError) throw posError;

    // Fetch all requirements
    const { data: requirements, error: reqError } = await supabase
      .from('position_skill_requirements')
      .select('id, position_id');

    if (reqError) throw reqError;

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

    return res.status(200).json({ positions: result });
  } catch (error) {
    console.error('Error in positions with requirements count:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error fetching positions'
    });
  }
} 