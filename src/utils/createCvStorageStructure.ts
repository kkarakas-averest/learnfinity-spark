import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

/**
 * Sets up the database structure for CV storage and extractions
 */
export async function setupCvStorageStructure() {
  console.log('Setting up CV storage structure...');
  
  let client = supabase;
  
  // If supabase client doesn't have environment variables, try creating a new client
  try {
    if (!client || typeof client.from !== 'function') {
      console.log('Supabase client not initialized, creating new client from environment variables...');
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL or key not found in environment variables');
      }
      
      client = createClient(supabaseUrl, supabaseKey);
    }
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return { success: false, error };
  }
  
  try {
    // First, add the CV-related columns to the hr_employees table
    const { error: alterError } = await client.rpc('execute_sql', {
      sql: `
        ALTER TABLE hr_employees 
        ADD COLUMN IF NOT EXISTS cv_file_url TEXT,
        ADD COLUMN IF NOT EXISTS cv_extracted_data JSONB,
        ADD COLUMN IF NOT EXISTS cv_extraction_date TIMESTAMP WITH TIME ZONE;
      `
    });
    
    if (alterError) {
      throw new Error(`Failed to alter hr_employees table: ${alterError.message}`);
    }
    
    // Create the CV extractions table for logging
    const { error: createError } = await client.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS hr_employee_cv_extractions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
          original_file_url TEXT,
          extracted_data JSONB,
          extraction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          extraction_status VARCHAR(20) DEFAULT 'pending'
        );
      `
    });
    
    if (createError) {
      throw new Error(`Failed to create hr_employee_cv_extractions table: ${createError.message}`);
    }
    
    // Create a storage bucket (if it doesn't exist already) using Supabase Storage API
    try {
      const { data: buckets } = await client.storage.listBuckets();
      const employeeFilesBucket = buckets?.find(bucket => bucket.name === 'employee-files');
      
      if (!employeeFilesBucket) {
        const { error: bucketError } = await client.storage.createBucket('employee-files', {
          public: false,
          fileSizeLimit: 10485760, // 10MB limit
          allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        });
        
        if (bucketError) {
          console.warn('Error creating storage bucket (might already exist):', bucketError);
        }
      }
    } catch (storageError) {
      console.warn('Error setting up storage (might not have storage admin rights):', storageError);
    }
    
    console.log('CV storage structure setup completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to setup CV storage structure:', error);
    return { success: false, error };
  }
}

/**
 * This function can be called from the client to set up the CV storage structure
 */
export async function createCvStorageStructure() {
  const { success, error } = await setupCvStorageStructure();
  
  if (!success) {
    console.error('Error setting up CV storage structure:', error);
    return { success: false, error };
  }
  
  return { success: true };
} 