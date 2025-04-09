import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const employeeId = formData.get('employeeId') as string;
    const file = formData.get('file') as File;

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Create a temporary directory to store the file
    const tempDir = join(os.tmpdir(), 'resume-uploads');
    await mkdir(tempDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Create a temporary file
    const tempFilePath = join(tempDir, `${uuidv4()}-${file.name}`);
    await writeFile(tempFilePath, buffer);

    // Generate a unique file name
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const fileName = `${timestamp}_${randomString}_${safeFileName}`;
    
    // Create path with employee ID as the first folder (required by RLS)
    const filePath = `${employeeId}/resumes/${fileName}`;
    
    // Upload to Supabase Storage using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from('employee-files')
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('employee-files')
      .getPublicUrl(filePath);

    // Update employee record with CV URL
    const { error: updateError } = await supabaseAdmin
      .from('hr_employees')
      .update({ 
        cv_file_url: urlData.publicUrl,
        resume_url: urlData.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', employeeId);

    if (updateError) {
      console.error('Error updating employee record:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      url: urlData.publicUrl 
    });
  } catch (error: any) {
    console.error('Error processing resume upload:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
} 