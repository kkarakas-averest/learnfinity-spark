import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const employeeId = searchParams.get('employeeId');
  const fileName = searchParams.get('fileName');

  if (!employeeId) {
    return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
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
      return NextResponse.json({ error: employeeError.message }, { status: 500 });
    }

    if (!employee || (!employee.cv_file_url && !employee.resume_url)) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    // Get the URL from either cv_file_url or resume_url
    const fileUrl = employee.cv_file_url || employee.resume_url;

    // If we already have a public URL, just return it
    if (fileUrl) {
      return NextResponse.json({ url: fileUrl });
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
        return NextResponse.json({ url: signedUrl.signedUrl });
      }
    }

    // If we reached here, we couldn't find a valid URL
    return NextResponse.json({ error: 'Could not generate a valid URL for the resume' }, { status: 404 });
  } catch (error: any) {
    console.error('Error processing resume URL request:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 