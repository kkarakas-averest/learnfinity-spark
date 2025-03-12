/**
 * Course Data Seeding Utility
 * 
 * This script populates the database with sample course data for development and testing.
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/lib/supabase-client';

// Check if supabase client is configured properly
const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('courses').select('count').limit(1);
    if (error) throw error;
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};

/**
 * Seeds the courses table with sample data
 */
export const seedCourses = async () => {
  console.log('Seeding courses table...');
  
  // Sample course data
  const courses = [
    {
      id: uuidv4(),
      title: 'JavaScript Fundamentals',
      description: 'A comprehensive introduction to JavaScript programming language. Learn the core concepts, syntax, and common patterns used in modern JavaScript development.',
      short_description: 'Master the basics of JavaScript programming',
      thumbnail: 'https://example.com/images/javascript.jpg',
      banner_image: 'https://example.com/images/javascript-banner.jpg',
      skills_gained: ['JavaScript', 'Programming', 'Web Development', 'ES6'],
      level: 'beginner',
      category: 'Programming',
      tags: ['frontend', 'coding', 'web'],
      estimated_duration: 240, // 4 hours
      is_published: true,
      author_id: null, // Will be set when we have users
      company_id: null,
      ai_generated: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      title: 'React for Beginners',
      description: 'Start your journey with React, the popular JavaScript library for building user interfaces. Learn component-based architecture, state management, and more.',
      short_description: 'Build modern UIs with React',
      thumbnail: 'https://example.com/images/react.jpg',
      banner_image: 'https://example.com/images/react-banner.jpg',
      skills_gained: ['React', 'JavaScript', 'UI Development', 'Component Design'],
      level: 'beginner',
      category: 'Frontend Development',
      tags: ['frontend', 'react', 'javascript', 'ui'],
      estimated_duration: 300, // 5 hours
      is_published: true,
      author_id: null,
      company_id: null,
      ai_generated: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      title: 'Advanced TypeScript',
      description: 'Take your TypeScript skills to the next level. Learn advanced type features, generics, decorators, and how to structure large-scale TypeScript applications.',
      short_description: 'Master advanced TypeScript concepts',
      thumbnail: 'https://example.com/images/typescript.jpg',
      banner_image: 'https://example.com/images/typescript-banner.jpg',
      skills_gained: ['TypeScript', 'Advanced Types', 'Code Organization', 'Type Safety'],
      level: 'advanced',
      category: 'Programming',
      tags: ['typescript', 'advanced', 'javascript'],
      estimated_duration: 360, // 6 hours
      is_published: true,
      author_id: null,
      company_id: null,
      ai_generated: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      title: 'Database Design Principles',
      description: 'Learn the fundamentals of database design including normalization, indexing strategies, query optimization, and data modeling approaches for different applications.',
      short_description: 'Design efficient and scalable databases',
      thumbnail: 'https://example.com/images/database.jpg',
      banner_image: 'https://example.com/images/database-banner.jpg',
      skills_gained: ['Database Design', 'Normalization', 'SQL', 'Data Modeling'],
      level: 'intermediate',
      category: 'Databases',
      tags: ['sql', 'database', 'backend'],
      estimated_duration: 270, // 4.5 hours
      is_published: true,
      author_id: null,
      company_id: null,
      ai_generated: false,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      title: 'Leadership for Technical Teams',
      description: 'Develop the skills needed to lead technical teams effectively. Learn communication strategies, conflict resolution, motivational techniques, and technical project management.',
      short_description: 'Lead technical teams to success',
      thumbnail: 'https://example.com/images/leadership.jpg',
      banner_image: 'https://example.com/images/leadership-banner.jpg',
      skills_gained: ['Leadership', 'Communication', 'Team Management', 'Project Planning'],
      level: 'intermediate',
      category: 'Soft Skills',
      tags: ['leadership', 'management', 'communication'],
      estimated_duration: 210, // 3.5 hours
      is_published: true,
      author_id: null,
      company_id: null,
      ai_generated: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
  
  try {
    // Insert courses
    const { data, error } = await supabase
      .from('courses')
      .insert(courses)
      .select('id');
      
    if (error) throw error;
    
    console.log(`Successfully seeded ${data.length} courses`);
    return data.map(course => course.id);
  } catch (error) {
    console.error('Error seeding courses:', error);
    return [];
  }
};

/**
 * Seeds the modules table with sample data for each course
 */
export const seedModules = async (courseIds: string[]) => {
  console.log('Seeding modules table...');
  
  if (!courseIds || courseIds.length === 0) {
    console.warn('No course IDs provided for module seeding');
    return [];
  }
  
  // Generate modules for each course
  const allModules = [];
  
  for (const courseId of courseIds) {
    // Sample modules for a JavaScript course
    if (courseId === courseIds[0]) { // JavaScript Fundamentals
      allModules.push(
        {
          id: uuidv4(),
          course_id: courseId,
          title: 'Introduction to JavaScript',
          description: 'An overview of JavaScript and its role in web development',
          order_index: 1,
          is_locked: false,
          prerequisite_module_ids: [],
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: uuidv4(),
          course_id: courseId,
          title: 'Variables and Data Types',
          description: 'Understanding JavaScript variables, primitive and reference types',
          order_index: 2,
          is_locked: true,
          prerequisite_module_ids: [allModules[allModules.length - 1]?.id],
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: uuidv4(),
          course_id: courseId,
          title: 'Functions and Scope',
          description: 'Working with functions, parameters, and variable scope',
          order_index: 3,
          is_locked: true,
          prerequisite_module_ids: [allModules[allModules.length - 1]?.id],
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: uuidv4(),
          course_id: courseId,
          title: 'Arrays and Objects',
          description: 'Manipulating arrays and working with JavaScript objects',
          order_index: 4,
          is_locked: true,
          prerequisite_module_ids: [allModules[allModules.length - 1]?.id],
          created_at: new Date(),
          updated_at: new Date()
        }
      );
    } else if (courseId === courseIds[1]) { // React for Beginners
      allModules.push(
        {
          id: uuidv4(),
          course_id: courseId,
          title: 'React Fundamentals',
          description: 'Introduction to React and its core concepts',
          order_index: 1,
          is_locked: false,
          prerequisite_module_ids: [],
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: uuidv4(),
          course_id: courseId,
          title: 'Components and Props',
          description: 'Creating components and passing data with props',
          order_index: 2,
          is_locked: true,
          prerequisite_module_ids: [allModules[allModules.length - 1]?.id],
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: uuidv4(),
          course_id: courseId,
          title: 'State and Lifecycle',
          description: 'Managing component state and understanding lifecycle methods',
          order_index: 3,
          is_locked: true,
          prerequisite_module_ids: [allModules[allModules.length - 1]?.id],
          created_at: new Date(),
          updated_at: new Date()
        }
      );
    } else {
      // Generic modules for other courses
      allModules.push(
        {
          id: uuidv4(),
          course_id: courseId,
          title: 'Getting Started',
          description: 'Introduction to the course and setup instructions',
          order_index: 1,
          is_locked: false,
          prerequisite_module_ids: [],
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: uuidv4(),
          course_id: courseId,
          title: 'Core Concepts',
          description: 'Fundamental concepts you need to understand',
          order_index: 2,
          is_locked: true,
          prerequisite_module_ids: [allModules[allModules.length - 1]?.id],
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: uuidv4(),
          course_id: courseId,
          title: 'Advanced Topics',
          description: 'Taking your knowledge to the next level',
          order_index: 3,
          is_locked: true,
          prerequisite_module_ids: [allModules[allModules.length - 1]?.id],
          created_at: new Date(),
          updated_at: new Date()
        }
      );
    }
  }
  
  try {
    // Insert all modules
    const { data, error } = await supabase
      .from('modules')
      .insert(allModules)
      .select('id');
      
    if (error) throw error;
    
    console.log(`Successfully seeded ${data.length} modules`);
    return data.map(module => module.id);
  } catch (error) {
    console.error('Error seeding modules:', error);
    return [];
  }
};

/**
 * Seeds the sections table with sample data for each module
 */
export const seedSections = async (moduleIds: string[]) => {
  console.log('Seeding sections table...');
  
  if (!moduleIds || moduleIds.length === 0) {
    console.warn('No module IDs provided for section seeding');
    return [];
  }
  
  // Generate sections for each module
  const allSections = [];
  
  for (const moduleId of moduleIds) {
    // Create 2-4 sections per module
    const sectionCount = Math.floor(Math.random() * 3) + 2; // 2-4 sections
    
    for (let i = 1; i <= sectionCount; i++) {
      // Randomize content type for variety
      const contentTypes = ['video', 'text', 'quiz', 'interactive'];
      const contentType = contentTypes[Math.floor(Math.random() * contentTypes.length)];
      
      // Create section
      allSections.push({
        id: uuidv4(),
        module_id: moduleId,
        title: `Section ${i}: ${contentType === 'video' ? 'Video Lesson' : 
                             contentType === 'text' ? 'Reading Material' : 
                             contentType === 'quiz' ? 'Knowledge Check' : 
                             'Interactive Exercise'}`,
        description: `This section contains ${contentType} content to help reinforce the concepts in this module.`,
        content_type: contentType,
        content: contentType === 'text' ? 
                 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' : 
                 contentType === 'video' ? 
                 'https://example.com/videos/lesson-' + Math.floor(Math.random() * 100) + '.mp4' :
                 JSON.stringify({ activityId: 'activity-' + Math.floor(Math.random() * 1000) }),
        order_index: i,
        is_optional: i === sectionCount, // Last section is optional
        estimated_duration: Math.floor(Math.random() * 30) + 10, // 10-40 minutes
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }
  
  try {
    // Insert all sections
    const { data, error } = await supabase
      .from('sections')
      .insert(allSections)
      .select('id');
      
    if (error) throw error;
    
    console.log(`Successfully seeded ${data.length} sections`);
    return data.map(section => section.id);
  } catch (error) {
    console.error('Error seeding sections:', error);
    return [];
  }
};

/**
 * Seeds the course_templates table with sample data
 */
export const seedCourseTemplates = async () => {
  console.log('Seeding course templates...');
  
  const templates = [
    {
      id: uuidv4(),
      name: 'Technical Skills Workshop',
      description: 'A template for creating hands-on technical training courses with practical exercises',
      structure: {
        moduleCount: 5,
        moduleTitles: [
          'Introduction and Setup',
          'Core Concepts',
          'Practical Application',
          'Advanced Techniques',
          'Final Project'
        ],
        defaultSections: [
          {
            moduleIndex: 0,
            sectionTypes: ['video', 'text', 'interactive']
          },
          {
            moduleIndex: 1,
            sectionTypes: ['video', 'text', 'quiz', 'interactive']
          },
          {
            moduleIndex: 2,
            sectionTypes: ['video', 'interactive', 'assessment']
          }
        ]
      },
      default_duration: 480, // 8 hours
      target_skill_level: 'intermediate',
      target_audience: ['engineers', 'developers', 'technical staff'],
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Leadership Development',
      description: 'Template for creating leadership training courses for managers and team leads',
      structure: {
        moduleCount: 4,
        moduleTitles: [
          'Leadership Fundamentals',
          'Communication Skills',
          'Team Management',
          'Strategic Planning'
        ],
        defaultSections: [
          {
            moduleIndex: 0,
            sectionTypes: ['video', 'text', 'interactive']
          },
          {
            moduleIndex: 1,
            sectionTypes: ['video', 'interactive', 'assessment']
          }
        ]
      },
      default_duration: 360, // 6 hours
      target_skill_level: 'intermediate',
      target_audience: ['managers', 'team leads', 'executives'],
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: uuidv4(),
      name: 'Quick Onboarding',
      description: 'A compact template for creating onboarding courses for new employees',
      structure: {
        moduleCount: 3,
        moduleTitles: [
          'Company Introduction',
          'Tools and Systems',
          'Policies and Procedures'
        ],
        defaultSections: [
          {
            moduleIndex: 0,
            sectionTypes: ['video', 'text']
          },
          {
            moduleIndex: 1,
            sectionTypes: ['video', 'interactive']
          }
        ]
      },
      default_duration: 120, // 2 hours
      target_skill_level: 'beginner',
      target_audience: ['new employees', 'contractors'],
      created_at: new Date(),
      updated_at: new Date()
    }
  ];
  
  try {
    // Insert templates
    const { data, error } = await supabase
      .from('course_templates')
      .insert(templates)
      .select('id');
      
    if (error) throw error;
    
    console.log(`Successfully seeded ${data.length} course templates`);
    return data.map(template => template.id);
  } catch (error) {
    console.error('Error seeding course templates:', error);
    return [];
  }
};

/**
 * Main function to seed all course-related data
 */
export const seedAllCourseData = async () => {
  console.log('Starting to seed course-related data...');
  
  // Check connection first
  const isConnected = await checkSupabaseConnection();
  if (!isConnected) {
    console.error('Failed to connect to Supabase. Please check your credentials.');
    return false;
  }
  
  try {
    // 1. Create courses
    const courseIds = await seedCourses();
    
    // 2. Create modules for each course
    const moduleIds = await seedModules(courseIds);
    
    // 3. Create sections for each module
    await seedSections(moduleIds);
    
    // 4. Create course templates
    await seedCourseTemplates();
    
    console.log('✅ Successfully seeded all course-related data');
    return true;
  } catch (error) {
    console.error('❌ Error in seed process:', error);
    return false;
  }
}; 