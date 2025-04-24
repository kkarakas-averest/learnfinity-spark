import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { courseId } = req.query;
  if (!courseId || typeof courseId !== 'string') {
    return res.status(400).json({ error: 'Missing courseId' });
  }
  const { data, error } = await supabase
    .from('hr_courses')
    .select('id, title, skills')
    .eq('id', courseId)
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
} 