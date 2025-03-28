// Script to add missing columns to existing tables in Supabase
// Run with: node src/scripts/add-missing-columns.js

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumnExists(table, column) {
  try {
    // Using Supabase's postgres function to execute raw SQL
    const { data, error } = await supabase
      .from(table)
      .select()
      .limit(1);
    
    if (error) {
      console.error(`Error checking table ${table}:`, error);
      return false;
    }
    
    // If we can fetch data, check if the column exists in the returned data structure
    if (data && data.length > 0) {
      const sampleRow = data[0];
      return column in sampleRow;
    }
    
    console.log(`Table ${table} exists but has no data to check column structure.`);
    return false;
  } catch (err) {
    console.error(`Exception checking column ${column} in ${table}:`, err);
    return false;
  }
}

async function updateLearningPathEnrollments() {
  console.log('Checking if estimated_completion_date column exists...');
  
  // Check if the column exists
  const columnExists = await checkColumnExists('hr_learning_path_enrollments', 'estimated_completion_date');
  
  if (!columnExists) {
    console.log('Column does not exist. We need to add it using SQL migration.');
    console.log(`
To add the missing column, run the following SQL in the Supabase SQL Editor:

ALTER TABLE hr_learning_path_enrollments 
ADD COLUMN estimated_completion_date TIMESTAMP WITH TIME ZONE;

For now, let's try to update the learning path enrollments with estimated dates:
    `);
  } else {
    console.log('estimated_completion_date column already exists.');
  }
  
  // Even if column doesn't exist yet, prepare update logic
  // This will be useful once the column is added
  console.log('Updating learning path enrollments with estimated completion dates...');
  
  try {
    // First, get all learning path enrollments
    const { data: enrollments, error: fetchError } = await supabase
      .from('hr_learning_path_enrollments')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching learning path enrollments:', fetchError);
      return;
    }
    
    console.log(`Found ${enrollments?.length || 0} learning path enrollments`);
    
    if (enrollments && enrollments.length > 0) {
      // For each enrollment, calculate an estimated completion date
      // based on enrollment date (if available) or current date + 30 days
      for (const enrollment of enrollments) {
        if (columnExists) {
          // Only proceed if we confirmed the column exists
          const enrollmentDate = enrollment.enrollment_date ? new Date(enrollment.enrollment_date) : new Date();
          const estimatedDate = new Date(enrollmentDate);
          estimatedDate.setDate(estimatedDate.getDate() + 30); // Set 30 days from enrollment
          
          // Update the enrollment with the estimated completion date
          const { error: updateError } = await supabase
            .from('hr_learning_path_enrollments')
            .update({ estimated_completion_date: estimatedDate.toISOString() })
            .eq('id', enrollment.id);
          
          if (updateError) {
            console.error(`Error updating enrollment ${enrollment.id}:`, updateError);
          } else {
            console.log(`Updated enrollment ${enrollment.id} with estimated date: ${estimatedDate.toISOString()}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('Exception updating learning path enrollments:', err);
  }
}

// Execute the function
updateLearningPathEnrollments()
  .then(() => {
    console.log('Script completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 