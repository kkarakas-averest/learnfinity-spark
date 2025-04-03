/**
 * Script to insert sample course content for testing
 * 
 * This script creates sample course content including:
 * - Course modules
 * - Module sections
 * - Course resources
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample course content
const SAMPLE_COURSE_ID = process.env.SAMPLE_COURSE_ID || ''; // Set this to an existing course ID

// Define the sample content structure
const sampleModules = [
  {
    title: 'Introduction to the Course',
    description: 'An overview of what you will learn in this course',
    order_index: 1,
    duration: 30,
    content_type: 'text',
    sections: [
      {
        title: 'Welcome & Course Overview',
        content: `
# Welcome to the Course!

This course is designed to introduce you to the key concepts and techniques in the field.

## What You Will Learn

Throughout the course, you will:
- Understand the fundamental principles
- Learn practical techniques
- Apply your knowledge to real-world problems
- Develop critical thinking skills

Let's get started on this exciting journey!
        `,
        content_type: 'text',
        order_index: 1,
        duration: 10
      },
      {
        title: 'Course Structure & Learning Approach',
        content: `
# Course Structure

This course is divided into several modules, each focusing on a specific aspect of the subject.

## Learning Approach

The course uses a blend of:
- Theoretical concepts
- Practical examples
- Hands-on exercises
- Self-assessment quizzes

This approach ensures a comprehensive understanding of the material.

## Learning Tips

- Take notes during each section
- Complete all practice exercises
- Participate in discussions
- Review concepts regularly
        `,
        content_type: 'text',
        order_index: 2,
        duration: 10
      },
      {
        title: 'Introduction Video',
        content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        content_type: 'video',
        order_index: 3,
        duration: 10
      }
    ],
    resources: [
      {
        title: 'Course Syllabus',
        description: 'Detailed outline of the course content',
        url: 'https://example.com/syllabus.pdf',
        type: 'pdf'
      },
      {
        title: 'Welcome Video',
        description: 'Introduction by the course instructor',
        url: 'https://example.com/welcome-video',
        type: 'video'
      }
    ]
  },
  {
    title: 'Core Concepts',
    description: 'Understanding the fundamental principles',
    order_index: 2,
    duration: 45,
    content_type: 'text',
    sections: [
      {
        title: 'Key Terminology',
        content: `
# Key Terminology

Understanding the terminology is crucial for mastering any subject. Here are the key terms you should know:

## Important Terms

### Term 1
The first important concept in our field.

### Term 2
Another crucial concept that builds upon Term 1.

### Term 3
A more advanced concept that integrates previous knowledge.

## Why Terminology Matters

Having a strong grasp of terminology allows you to:
- Communicate effectively with peers
- Understand technical documentation
- Follow industry discussions
- Build a solid foundation for advanced topics
        `,
        content_type: 'text',
        order_index: 1,
        duration: 15
      },
      {
        title: 'Fundamental Principles',
        content: `
# Fundamental Principles

This section covers the core principles that govern our field of study.

## Principle 1: Consistency
Everything must be consistent and follow established patterns.

## Principle 2: Modularity
Breaking down complex systems into manageable components.

## Principle 3: Scalability
Ensuring solutions can grow with increasing demands.

## Principle 4: Efficiency
Optimizing resource usage without compromising effectiveness.

These principles will guide your decision-making throughout your career.
        `,
        content_type: 'text',
        order_index: 2,
        duration: 15
      },
      {
        title: 'Practical Application',
        content: `
# Practical Application

Now let's see how these principles apply in real-world scenarios.

## Case Study 1

A medium-sized company needed to implement a new system. By applying our principles:

1. They ensured consistency across all components
2. They broke down the project into modular parts
3. They designed for future growth
4. They optimized resource usage

The result was a successful implementation that continues to serve their needs.

## Your Turn

Think about how you might apply these principles to a project you're familiar with.
        `,
        content_type: 'text',
        order_index: 3,
        duration: 15
      }
    ],
    resources: [
      {
        title: 'Core Concepts Cheat Sheet',
        description: 'Quick reference guide for key concepts',
        url: 'https://example.com/cheatsheet.pdf',
        type: 'pdf'
      },
      {
        title: 'Recommended Reading',
        description: 'Additional articles and papers on core concepts',
        url: 'https://example.com/reading-list',
        type: 'link'
      }
    ]
  },
  {
    title: 'Advanced Topics',
    description: 'Exploring complex concepts and techniques',
    order_index: 3,
    duration: 60,
    content_type: 'text',
    sections: [
      {
        title: 'Advanced Concept 1',
        content: `
# Advanced Concept 1

This advanced topic builds upon the foundation we've established in previous modules.

## Key Points

1. Integration with core principles
2. Extended applications
3. Limitations and considerations
4. Future developments

Understanding this concept will significantly enhance your capabilities.
        `,
        content_type: 'text',
        order_index: 1,
        duration: 20
      },
      {
        title: 'Advanced Concept 2',
        content: `
# Advanced Concept 2

This concept represents the cutting edge of our field.

## Recent Developments

The last few years have seen remarkable progress in this area:

- Breakthrough 1 (2020)
- Breakthrough 2 (2021)
- Breakthrough 3 (2022)

## Practical Applications

These breakthroughs have enabled new applications such as:

1. Application A - Transforming industry X
2. Application B - Solving previously impossible problems
3. Application C - Creating new opportunities

## Challenges

Despite the progress, challenges remain:

- Challenge 1: Needs to be addressed
- Challenge 2: Active research area
- Challenge 3: Theoretical limitations
        `,
        content_type: 'text',
        order_index: 2,
        duration: 20
      },
      {
        title: 'Interactive Exercise',
        content: 'This would be an interactive component in a real course.',
        content_type: 'interactive',
        order_index: 3,
        duration: 20
      }
    ],
    resources: [
      {
        title: 'Advanced Topics Workbook',
        description: 'Exercises and examples for advanced concepts',
        url: 'https://example.com/workbook.pdf',
        type: 'pdf'
      },
      {
        title: 'Research Paper',
        description: 'Seminal research paper on Advanced Concept 2',
        url: 'https://example.com/research-paper.pdf',
        type: 'pdf'
      },
      {
        title: 'Interactive Demo',
        description: 'Hands-on demonstration of advanced techniques',
        url: 'https://example.com/demo',
        type: 'link'
      }
    ]
  },
  {
    title: 'Final Assessment',
    description: 'Demonstrate your understanding of the course material',
    order_index: 4,
    duration: 45,
    content_type: 'quiz',
    sections: [
      {
        title: 'Course Review',
        content: `
# Course Review

Before taking the final assessment, let's review the key points from each module:

## Module 1: Introduction
- Course structure
- Learning approach
- Expectations

## Module 2: Core Concepts
- Key terminology
- Fundamental principles
- Practical applications

## Module 3: Advanced Topics
- Advanced concept 1
- Advanced concept 2
- Interactive exercises

Use this review as a study guide for your final assessment.
        `,
        content_type: 'text',
        order_index: 1,
        duration: 15
      },
      {
        title: 'Final Quiz',
        content: 'This would be a comprehensive quiz in a real course.',
        content_type: 'quiz',
        order_index: 2,
        duration: 30
      }
    ],
    resources: [
      {
        title: 'Study Guide',
        description: 'Comprehensive preparation for the final assessment',
        url: 'https://example.com/study-guide.pdf',
        type: 'pdf'
      },
      {
        title: 'Practice Questions',
        description: 'Sample questions similar to the final assessment',
        url: 'https://example.com/practice-questions.pdf',
        type: 'pdf'
      }
    ]
  }
];

async function insertSampleContent() {
  if (!SAMPLE_COURSE_ID) {
    console.error('Please provide a SAMPLE_COURSE_ID in your .env file');
    process.exit(1);
  }

  console.log(`Inserting sample content for course ID: ${SAMPLE_COURSE_ID}`);
  
  try {
    // Check if the course exists
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id, title')
      .eq('id', SAMPLE_COURSE_ID)
      .single();
    
    if (courseError) {
      console.error('Error checking course:', courseError);
      process.exit(1);
    }
    
    if (!courseData) {
      console.error(`Course with ID ${SAMPLE_COURSE_ID} not found`);
      process.exit(1);
    }
    
    console.log(`Found course: ${courseData.title}`);
    
    // Insert modules and keep track of their IDs
    const moduleIds = {};
    
    for (const module of sampleModules) {
      console.log(`Creating module: ${module.title}`);
      
      const { data: moduleData, error: moduleError } = await supabase
        .from('course_modules')
        .insert({
          course_id: SAMPLE_COURSE_ID,
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
      
      moduleIds[module.title] = moduleData.id;
      
      // Insert sections for this module
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
      
      // Insert resources for this module
      for (const resource of module.resources) {
        console.log(`  Creating resource: ${resource.title}`);
        
        const { error: resourceError } = await supabase
          .from('course_resources')
          .insert({
            course_id: SAMPLE_COURSE_ID,
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
    
    console.log('Sample content insertion completed!');
  } catch (error) {
    console.error('Error inserting sample content:', error);
    process.exit(1);
  }
}

// Run the insertion script
insertSampleContent()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  }); 