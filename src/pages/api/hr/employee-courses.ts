import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { employeeId } = req.query;
  if (!employeeId || typeof employeeId !== 'string') {
    return res.status(400).json({ error: 'Missing employeeId' });
  }
  // Join enrollments and courses, include skills
  const { data, error } = await supabase
    .from('hr_course_enrollments')
    .select('course:hr_courses(id, title, skills)')
    .eq('employee_id', employeeId);
  if (error) return res.status(500).json({ error: error.message });
  const courses = (data || []).map((row: any) => row.course);
  res.status(200).json({ courses });
} 