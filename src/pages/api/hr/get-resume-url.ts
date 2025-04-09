import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role credentials to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { employeeId, fileName } = req.query;

  if (!employeeId) {
    return res.status(400).json({ error: 'Employee ID is required' });
  }

  try {
    // Look up the employee to get their resume URL
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('hr_employees')
      .select('cv_file_url, resume_url')
      .eq('id', employeeId)
      .single();

    if (employeeError) {
      console.error('Error fetching employee:', employeeError);
      return res.status(500).json({ error: employeeError.message });
    }

    if (!employee || (!employee.cv_file_url && !employee.resume_url)) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Get the URL from either cv_file_url or resume_url
    const fileUrl = employee.cv_file_url || employee.resume_url;

    // If we already have a public URL, just return it
    if (fileUrl) {
      return res.status(200).json({ url: fileUrl });
    }

    // If we have a fileName but no URL in the database, try to create a signed URL
    if (fileName) {
      // Try the standard pattern: {employeeId}/resumes/{fileName}
      const possiblePath = `${employeeId}/resumes/${fileName}`;
      
      // Generate a signed URL (valid for 1 hour)
      const { data: signedUrl, error: signedUrlError } = await supabaseAdmin.storage
        .from('employee-files')
        .createSignedUrl(possiblePath, 3600);

      if (signedUrlError) {
        console.error('Error creating signed URL:', signedUrlError);
      } else if (signedUrl) {
        return res.status(200).json({ url: signedUrl.signedUrl });
      }
    }

    // If we reached here, we couldn't find a valid URL
    return res.status(404).json({ error: 'Could not generate a valid URL for the resume' });
  } catch (error: any) {
    console.error('Error processing resume URL request:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 