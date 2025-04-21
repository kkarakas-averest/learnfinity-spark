// import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Vercel provides dynamic route params in req.query
  const { courseId, employeeId } = req.query;

  if (!courseId || typeof courseId !== 'string' || !employeeId || typeof employeeId !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid courseId or employeeId' });
  }

  const { data, error } = await supabase
    .from('hr_course_enrollments')
    .select('*')
    .eq('course_id', courseId)
    .eq('employee_id', employeeId)
    .single();

  if (error) {
    return res.status(500).json({ error: 'Failed to fetch enrollment', details: error.message });
  }

  if (!data) {
    return res.status(404).json({ error: 'Enrollment not found' });
  }

  return res.status(200).json(data);
}
