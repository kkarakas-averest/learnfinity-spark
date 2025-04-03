/**
 * Script to create a basic course entry in the database
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';

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

// Course content
const courseData = {
  id: uuidv4(),
  title: 'TypeScript Fundamentals',
  description: 'Learn the basics of TypeScript including types, interfaces, and advanced patterns.',
  level: 'Beginner',
  estimated_duration: 10, // hours
  is_published: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

async function createCourse() {
  try {
    console.log(`Creating course: ${courseData.title}`);
    
    // Create course record
    const { data, error } = await supabase
      .from('courses')
      .insert([courseData])
      .select();
    
    if (error) {
      console.error('Error creating course:', error);
      
      // Check if course already exists
      if (error.code === '23505') {
        console.log('Course may already exist. Checking...');
        
        const { data: existingCourse, error: fetchError } = await supabase
          .from('courses')
          .select('*')
          .eq('title', courseData.title)
          .single();
        
        if (fetchError) {
          console.error('Error checking for existing course:', fetchError);
          return null;
        }
        
        if (existingCourse) {
          console.log('Course already exists:', existingCourse);
          return existingCourse.id;
        }
      }
      
      // If we get here, it's another type of error
      throw error;
    }
    
    console.log('Course created successfully:', data);
    return data[0].id;
  } catch (error) {
    console.error('Error in createCourse:', error);
    process.exit(1);
  }
}

// Add simple modules and sections if course is created
async function addBasicContent(courseId) {
  try {
    console.log(`Adding basic content to course ${courseId}`);
    
    // Create Module 1
    const { data: module1, error: moduleError } = await supabase
      .from('course_modules')
      .insert({
        course_id: courseId,
        title: 'Getting Started with TypeScript',
        description: 'Introduction to TypeScript and setup',
        order_index: 1,
        duration: 60, // minutes
        content_type: 'text'
      })
      .select()
      .single();
    
    if (moduleError) {
      console.error('Error creating module:', moduleError);
      return;
    }
    
    console.log('Module created:', module1);
    
    // Create sections for Module 1
    const sections = [
      {
        module_id: module1.id,
        title: 'What is TypeScript?',
        content: '# What is TypeScript?\n\nTypeScript is a strongly typed programming language that builds on JavaScript. It adds static type definitions that can help catch errors early.',
        content_type: 'text',
        order_index: 1,
        duration: 15
      },
      {
        module_id: module1.id,
        title: 'Setting Up Your Environment',
        content: '# Setting Up Your Environment\n\n## Installing TypeScript\n\n```bash\nnpm install -g typescript\n```\n\n## Creating a TypeScript Project\n\n```bash\nmkdir my-ts-project\ncd my-ts-project\ntsc --init\n```',
        content_type: 'text',
        order_index: 2,
        duration: 20
      }
    ];
    
    for (const section of sections) {
      const { error: sectionError } = await supabase
        .from('module_sections')
        .insert(section);
      
      if (sectionError) {
        console.error('Error creating section:', sectionError);
      } else {
        console.log(`Created section: ${section.title}`);
      }
    }
    
    // Create a resource
    const { error: resourceError } = await supabase
      .from('course_resources')
      .insert({
        course_id: courseId,
        module_id: module1.id,
        title: 'TypeScript Documentation',
        description: 'Official TypeScript documentation',
        url: 'https://www.typescriptlang.org/docs/',
        type: 'link'
      });
    
    if (resourceError) {
      console.error('Error creating resource:', resourceError);
    } else {
      console.log('Created resource: TypeScript Documentation');
    }
    
    console.log('Basic content added successfully');
    return true;
  } catch (error) {
    console.error('Error adding basic content:', error);
    return false;
  }
}

// Run the script
async function run() {
  try {
    // Step 1: Create a course
    const courseId = await createCourse();
    
    if (!courseId) {
      console.error('Failed to create or find course');
      process.exit(1);
    }
    
    // Step 2: Add basic content
    await addBasicContent(courseId);
    
    console.log(`Course creation completed! Course ID: ${courseId}`);
    console.log('You can now view this course in the application');
  } catch (error) {
    console.error('Error in script execution:', error);
    process.exit(1);
  }
}

run()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 