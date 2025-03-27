/**
 * Node.js test script for Groq API integration
 * This script demonstrates how to use the Groq API for personalization and content creation
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { GroqAPI } from './groq-api';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Set up import.meta.env for compatibility
if (typeof globalThis.import === 'undefined') {
  (globalThis as any).import = {
    meta: {
      env: {
        MODE: 'development',
        VITE_APP_NAME: 'Learnfinity Test',
        VITE_GROQ_API_KEY: process.env.VITE_GROQ_API_KEY,
        VITE_ENABLE_LLM: 'true',
        VITE_DEBUG: 'true'
      }
    }
  };
}

async function main() {
  console.log('Testing Groq API Integration for Personalization and Content Creation');
  
  // Step 1: Initialize Groq API directly
  console.log('\n1. Initializing Groq API directly...');
  const apiKey = process.env.VITE_GROQ_API_KEY;
  
  if (!apiKey) {
    console.error('ERROR: Groq API key not found');
    console.error('Make sure VITE_GROQ_API_KEY is set in your .env file');
    process.exit(1);
  }
  
  const groqApi = new GroqAPI(apiKey, 'llama3-8b-8192', { debug: true });
  
  if (!groqApi.isConfigured()) {
    console.error('ERROR: Groq API is not properly configured');
    process.exit(1);
  }
  
  console.log('✅ Groq API initialized successfully');
  
  // Step 2: Create a test employee profile data
  console.log('\n2. Creating a test employee profile data...');
  const employeeData = {
    id: 'emp-001',
    name: 'Alex Johnson',
    role: 'Data Scientist',
    department: 'Analytics',
    skills: ['Python', 'SQL', 'Machine Learning basics'],
    experience: 'mid-level',
    learningPreferences: {
      format: 'interactive',
      timeAvailable: '3 hours per week',
      interests: ['Deep Learning', 'MLOps', 'Data Visualization']
    }
  };
  
  console.log('Employee data:', employeeData);
  
  // Step 3: Generate an employee profile using Groq API
  console.log('\n3. Generating a detailed employee profile...');
  try {
    // Create profile generation prompt
    const profilePrompt = `
    Create a comprehensive employee profile based on the following information:
    
    ${JSON.stringify(employeeData, null, 2)}
    
    The profile should include:
    1. A summary of the employee's professional background
    2. An assessment of their likely skill level based on their role and experience
    3. Recommended learning areas based on their role and department
    4. Preferred learning styles (if information is available)
    5. Estimated time availability for learning (if information is available)
    
    Return the profile as a detailed JSON object.
    `;
    
    const profileResponse = await groqApi.complete(profilePrompt, {
      temperature: 0.3,
      maxTokens: 1000,
      system: 'You are an expert HR professional who creates detailed employee profiles. Always respond with valid JSON.'
    });
    
    // Parse the profile
    const profile = JSON.parse(profileResponse.text);
    console.log('Generated Profile:');
    console.log(JSON.stringify(profile, null, 2));
    
    // Save the profile to a file
    const profileDir = path.join(process.cwd(), 'data');
    fs.mkdirSync(profileDir, { recursive: true });
    fs.writeFileSync(
      path.join(profileDir, `employee_profile_${employeeData.id}.json`),
      JSON.stringify(profile, null, 2)
    );
    console.log(`Profile saved to: data/employee_profile_${employeeData.id}.json`);
    
    // Step 4: Create a learning path for the employee
    console.log('\n4. Creating a personalized learning path...');
    
    const learningPathPrompt = `
    Create a personalized learning path for an employee with the following profile:
    
    ${JSON.stringify(profile, null, 2)}
    
    The learning path should include:
    1. 3-5 recommended courses with a brief description of each
    2. The sequence in which they should be taken
    3. Estimated time commitment for each course
    4. Learning objectives for each course
    5. How each course contributes to their career development
    
    The learning path should be tailored to the employee's role, experience level,
    and career trajectory. It should also consider their learning preferences
    and time availability if specified in the profile.
    
    Return the learning path as a detailed JSON object with modules and courses.
    `;
    
    const learningPathResponse = await groqApi.complete(learningPathPrompt, {
      temperature: 0.5,
      maxTokens: 2000,
      system: 'You are an expert learning and development specialist. Always respond with valid JSON.'
    });
    
    // Parse the learning path
    const learningPath = JSON.parse(learningPathResponse.text);
    console.log('Generated Learning Path:');
    console.log(JSON.stringify(learningPath, null, 2));
    
    // Save the learning path to a file
    fs.writeFileSync(
      path.join(profileDir, `learning_path_${employeeData.id}.json`),
      JSON.stringify(learningPath, null, 2)
    );
    console.log(`Learning path saved to: data/learning_path_${employeeData.id}.json`);
    
    // Step 5: Create content for the first course in the learning path
    console.log('\n5. Creating content for the first course...');
    const course = learningPath.courses && learningPath.courses[0] ? learningPath.courses[0] : null;
    
    if (!course) {
      console.error('No courses found in the learning path');
      process.exit(1);
    }
    
    const courseContentPrompt = `
    Create detailed course content for the following course:
    
    ${JSON.stringify(course, null, 2)}
    
    The course is for an employee with this profile:
    ${JSON.stringify(profile, null, 2)}
    
    For this course, include:
    1. A comprehensive course overview
    2. 3-5 modules with detailed content
    3. For each module, include:
       - Introduction
       - Learning objectives
       - 3-4 sections of content
       - A summary
       - A quiz with 5 questions
    
    Return the course content as a detailed JSON object.
    `;
    
    const courseContentResponse = await groqApi.complete(courseContentPrompt, {
      temperature: 0.5,
      maxTokens: 4000,
      system: 'You are an expert course content creator who produces high-quality educational materials. Always respond with valid JSON.'
    });
    
    // Parse the course content
    const courseContent = JSON.parse(courseContentResponse.text);
    console.log('Generated Course Content:');
    console.log(JSON.stringify(courseContent, null, 2));
    
    // Save the course content to a file
    const courseId = course.id || `course_${Date.now()}`;
    fs.writeFileSync(
      path.join(profileDir, `course_content_${courseId}.json`),
      JSON.stringify(courseContent, null, 2)
    );
    console.log(`Course content saved to: data/course_content_${courseId}.json`);
    
    console.log('\n✅ All steps completed successfully');
    
  } catch (error) {
    console.error('Error during Groq API integration test:', error);
  }
}

// Run the test
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
}); 