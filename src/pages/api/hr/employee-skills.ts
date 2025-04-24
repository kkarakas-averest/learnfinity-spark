import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { employeeId } = req.query;
  if (!employeeId || typeof employeeId !== 'string') {
    return res.status(400).json({ error: 'Missing employeeId' });
  }
  // Assume skills are stored as a JSON array in hr_employee_skills table
  const { data, error } = await supabase
    .from('hr_employee_skills')
    .select('skills')
    .eq('employee_id', employeeId)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ skills: data?.skills || [] });
} 