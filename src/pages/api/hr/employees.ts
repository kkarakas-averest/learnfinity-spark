import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('hr_employees')
    .select('id, name, email');
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ employees: data });
} 