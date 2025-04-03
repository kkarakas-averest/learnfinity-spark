/**
 * Script to list existing courses in the database
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Print debug information
console.log('Environment variables loaded');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'exists (hidden)' : 'missing');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

console.log('Creating Supabase client with URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function listCourses() {
  try {
    console.log('Fetching courses...');
    
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .limit(10);
    
    if (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('No courses found in the database.');
    } else {
      console.log(`Found ${data.length} courses:`);
      data.forEach((course, index) => {
        console.log(`\n[Course ${index + 1}]`);
        console.log(`ID: ${course.id}`);
        console.log(`Title: ${course.title}`);
        console.log(`Description: ${course.description}`);
        console.log(`Level: ${course.level}`);
        console.log(`Status: ${course.is_published ? 'Published' : 'Draft'}`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error listing courses:', error);
    process.exit(1);
  }
}

// Run the script
listCourses()
  .then(() => {
    console.log('\nScript completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 