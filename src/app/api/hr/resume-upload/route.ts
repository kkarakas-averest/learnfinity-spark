import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client initialization with admin key for storage operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration missing' }, 
        { status: 500 }
      );
    }

    // Initialize Supabase client with admin privileges
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const employeeId = formData.get('employeeId') as string;

    if (!file || !employeeId) {
      return NextResponse.json(
        { error: 'Missing file or employee ID' }, 
        { status: 400 }
      );
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filePath = `resumes/${employeeId}/${timestamp}_${randomString}_${safeFileName}`;
    
    // Convert File to Buffer for Supabase storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('employee-files')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      // If the error is about the bucket not existing, try to create it
      if (error.message.includes('bucket') && error.message.includes('not found')) {
        try {
          const { error: bucketError } = await supabase.storage.createBucket('employee-files', {
            public: true,
            fileSizeLimit: 10485760, // 10MB
          });

          if (bucketError) {
            return NextResponse.json(
              { error: `Failed to create bucket: ${bucketError.message}` }, 
              { status: 500 }
            );
          }

          // Try upload again after creating bucket
          const { data: retryData, error: retryError } = await supabase.storage
            .from('employee-files')
            .upload(filePath, buffer, {
              contentType: file.type,
              cacheControl: '3600',
              upsert: true
            });

          if (retryError) {
            return NextResponse.json(
              { error: `Upload failed after bucket creation: ${retryError.message}` }, 
              { status: 500 }
            );
          }
        } catch (e) {
          return NextResponse.json(
            { error: `Failed to create bucket: ${e instanceof Error ? e.message : String(e)}` }, 
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Upload failed: ${error.message}` }, 
          { status: 500 }
        );
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('employee-files')
      .getPublicUrl(filePath);

    // Update employee record with CV URL
    const { error: updateError } = await supabase
      .from('hr_employees')
      .update({ 
        cv_file_url: urlData.publicUrl,
        resume_url: urlData.publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', employeeId);

    if (updateError) {
      console.error('Error updating employee record:', updateError);
      // Still return success since the file was uploaded
      return NextResponse.json({ 
        success: true, 
        url: urlData.publicUrl,
        warning: 'File uploaded but employee record not updated'
      });
    }

    return NextResponse.json({ 
      success: true, 
      url: urlData.publicUrl 
    });
  } catch (error) {
    console.error('Error processing resume upload:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
} 