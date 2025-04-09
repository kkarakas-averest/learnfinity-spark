import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import formidable from 'formidable';
import fs from 'fs';

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data with formidable v3
    const form = formidable({
      keepExtensions: true,
      maxFiles: 1,
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });
    
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    // Get employee ID from form data (handle both string and string[] types)
    const employeeIdField = fields.employeeId;
    const employeeId = Array.isArray(employeeIdField) ? employeeIdField[0] : employeeIdField;
    
    if (!employeeId) {
      return res.status(400).json({ error: 'Employee ID is required' });
    }
    
    // Get the uploaded file (handle both object and array types)
    const fileField = files.file;
    const uploadedFile = Array.isArray(fileField) ? fileField[0] : fileField;
    
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Read file
    const fileContent = fs.readFileSync(uploadedFile.filepath);
    const timestamp = Date.now();
    const safeOriginalName = uploadedFile.originalFilename?.replace(/[^a-zA-Z0-9.]/g, '_') || 'unnamed.pdf';
    const fileName = `${timestamp}_${Math.random().toString(36).substring(2, 8)}_${safeOriginalName}`;
    
    // Create path with employee ID as the first folder (required by RLS)
    const filePath = `${employeeId}/resumes/${fileName}`;
    
    // Upload to Supabase Storage using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin.storage
      .from('employee-files')
      .upload(filePath, fileContent, {
        contentType: uploadedFile.mimetype || 'application/octet-stream',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ error: error.message });
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
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({ 
      success: true, 
      url: urlData.publicUrl 
    });
  } catch (error: any) {
    console.error('Error processing resume upload:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 