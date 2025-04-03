/**
 * Script to generate course content using Groq LLM API
 * 
 * This script:
 * 1. Creates a new course in the database
 * 2. Uses Groq to generate structured content for the course
 * 3. Inserts modules, sections, and resources using the generated content
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Groq API key
const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  console.error('Missing GROQ_API_KEY. Please add it to your .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Course details - you can customize these or make them parameters
const COURSE_TITLE = "Advanced TypeScript for Modern Web Development";
const COURSE_DESCRIPTION = "Master TypeScript for building robust, scalable, and maintainable web applications with advanced type safety and modern design patterns.";
const COURSE_LEVEL = "Intermediate";
const COURSE_ESTIMATED_DURATION = 15; // hours

async function generateWithGroq(prompt) {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are an expert course content creator specialized in technical education. You create detailed, accurate, and engaging learning materials.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error generating content with Groq:', error);
    throw error;
  }
}

async function createCourse() {
  try {
    console.log(`Creating course: ${COURSE_TITLE}`);
    
    // Create a course record
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .insert({
        id: uuidv4(),
        title: COURSE_TITLE,
        description: COURSE_DESCRIPTION,
        level: COURSE_LEVEL,
        estimated_duration: COURSE_ESTIMATED_DURATION,
        is_published: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (courseError) {
      throw courseError;
    }
    
    console.log(`Course created with ID: ${courseData.id}`);
    return courseData.id;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
}

async function generateCourseOutline(courseId) {
  try {
    console.log('Generating course outline with Groq...');
    
    const prompt = `
    Create a detailed course outline for a course titled "${COURSE_TITLE}" with the description: "${COURSE_DESCRIPTION}".
    
    The course should have 5 modules. For each module, include:
    1. A descriptive title
    2. A brief description
    3. 3-4 sections within each module (with titles and brief descriptions)
    4. 2-3 resources to accompany each module (PDFs, videos, links)
    
    Format your response as a JSON object that can be directly parsed in JavaScript. Use the following structure:
    
    {
      "modules": [
        {
          "title": "Module title",
          "description": "Module description",
          "order_index": 1,
          "duration": 120, // in minutes
          "content_type": "text",
          "sections": [
            {
              "title": "Section title",
              "content": "Detailed markdown content for this section...",
              "content_type": "text",
              "order_index": 1,
              "duration": 30 // in minutes
            }
          ],
          "resources": [
            {
              "title": "Resource title",
              "description": "Resource description",
              "url": "https://example.com/resource",
              "type": "pdf" // pdf, video, link, or file
            }
          ]
        }
      ]
    }
    
    For the section content, please provide rich markdown content with headings, bullet points, code examples (focusing on TypeScript), and explanations. Make each section substantial enough for a 15-45 minute lesson.
    
    For resources, generate realistic but fictional URLs that might point to documentation, articles, or videos. Make them relevant to the section topics.
    `;
    
    const outlineJson = await generateWithGroq(prompt);
    
    // Try to parse the JSON response
    try {
      // Find the JSON content if it's wrapped in markdown code blocks
      const jsonMatch = outlineJson.match(/```json\n([\s\S]*?)\n```/) || 
                        outlineJson.match(/```\n([\s\S]*?)\n```/) || 
                        outlineJson.match(/({[\s\S]*})/);
      
      const jsonContent = jsonMatch ? jsonMatch[1] : outlineJson;
      const outline = JSON.parse(jsonContent);
      
      console.log('Successfully generated course outline');
      return outline;
    } catch (parseError) {
      console.error('Error parsing JSON from Groq response:', parseError);
      console.log('Raw response:', outlineJson);
      throw parseError;
    }
  } catch (error) {
    console.error('Error generating course outline:', error);
    throw error;
  }
}

async function populateCourseContent(courseId, outline) {
  try {
    console.log('Populating course content...');
    
    for (const module of outline.modules) {
      console.log(`Creating module: ${module.title}`);
      
      // Create the module
      const { data: moduleData, error: moduleError } = await supabase
        .from('course_modules')
        .insert({
          course_id: courseId,
          title: module.title,
          description: module.description,
          order_index: module.order_index,
          duration: module.duration,
          content_type: module.content_type
        })
        .select()
        .single();
      
      if (moduleError) {
        console.error(`Error creating module ${module.title}:`, moduleError);
        continue;
      }
      
      // Create the module sections
      for (const section of module.sections) {
        console.log(`  Creating section: ${section.title}`);
        
        const { error: sectionError } = await supabase
          .from('module_sections')
          .insert({
            module_id: moduleData.id,
            title: section.title,
            content: section.content,
            content_type: section.content_type,
            order_index: section.order_index,
            duration: section.duration
          });
        
        if (sectionError) {
          console.error(`  Error creating section ${section.title}:`, sectionError);
        }
      }
      
      // Create the module resources
      for (const resource of module.resources) {
        console.log(`  Creating resource: ${resource.title}`);
        
        const { error: resourceError } = await supabase
          .from('course_resources')
          .insert({
            course_id: courseId,
            module_id: moduleData.id,
            title: resource.title,
            description: resource.description,
            url: resource.url,
            type: resource.type
          });
        
        if (resourceError) {
          console.error(`  Error creating resource ${resource.title}:`, resourceError);
        }
      }
    }
    
    console.log('Course content population completed!');
  } catch (error) {
    console.error('Error populating course content:', error);
    throw error;
  }
}

async function enrollTestUser(courseId) {
  try {
    // Get a user to enroll (you can specify a particular user ID here)
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1)
      .single();
      
    if (userError) {
      console.log('Could not find a user to enroll, skipping enrollment step');
      return;
    }
    
    const userId = userData.id;
    
    // Check if enrollment already exists
    const { data: existingEnrollment, error: checkError } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();
      
    if (existingEnrollment) {
      console.log(`User ${userId} is already enrolled in course ${courseId}`);
      return;
    }
    
    // Create enrollment
    const { error: enrollError } = await supabase
      .from('course_enrollments')
      .insert({
        user_id: userId,
        course_id: courseId,
        progress: 0,
        enrolled_date: new Date().toISOString(),
        rag_status: 'green'
      });
      
    if (enrollError) {
      console.error('Error enrolling test user:', enrollError);
      return;
    }
    
    console.log(`Successfully enrolled user ${userId} in course ${courseId}`);
  } catch (error) {
    console.error('Error enrolling test user:', error);
  }
}

async function run() {
  try {
    // Step 1: Create a new course
    const courseId = await createCourse();
    
    // Step 2: Generate course outline with Groq
    const outline = await generateCourseOutline(courseId);
    
    // Step 3: Populate course content
    await populateCourseContent(courseId, outline);
    
    // Step 4: Enroll a test user (optional)
    await enrollTestUser(courseId);
    
    console.log(`✅ Course generation completed! Course ID: ${courseId}`);
    console.log('You can now view this course in the application');
    
    return courseId;
  } catch (error) {
    console.error('Error in course generation process:', error);
    process.exit(1);
  }
}

// Execute the script
run()
  .then((courseId) => {
    console.log(`Script completed successfully. Course ID: ${courseId}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 