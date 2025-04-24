import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { employeeId } = req.query;
  if (!employeeId || typeof employeeId !== 'string') {
    return res.status(400).json({ error: 'Missing employeeId' });
  }
  try {
    const { data, error } = await supabase
      .from('hr_course_enrollments')
      .select('course:hr_courses(id, title, skills)')
      .eq('employee_id', employeeId);

    if (error) {
      // Log the error for debugging
      console.error('Supabase error in employee-courses:', error);
      // If error is about missing related row, treat as empty
      if (
        error.message.includes('No rows found') ||
        error.message.includes('foreign key constraint') ||
        error.message.includes('null value in column')
      ) {
        return res.status(200).json({ courses: [] });
      }
      // Otherwise, return the error
      return res.status(500).json({ error: error.message });
    }
    const courses = (data || []).map((row: any) => row.course).filter(Boolean);
    return res.status(200).json({ courses });
  } catch (err) {
    console.error('Unexpected error in employee-courses:', err);
    return res.status(500).json({ error: 'Unexpected server error' });
  }
} 