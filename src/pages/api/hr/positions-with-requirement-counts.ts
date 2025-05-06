import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

type PositionWithRequirementCount = {
  id: string;
  title: string;
  department_id: string;
  department_name: string;
  requirement_count: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; data?: PositionWithRequirementCount[]; error?: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
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

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error fetching positions',
    });
  }
} 