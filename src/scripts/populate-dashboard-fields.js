// Script to populate database tables with sample dashboard data
// Run this with: node src/scripts/populate-dashboard-fields.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client - try different environment variable names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Use the anon key which we've confirmed works
let supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('Using Supabase URL:', supabaseUrl);
console.log('Using Anon Key:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or key is missing. Please check your .env file.');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPA')));
  console.error('Please create a .env file with SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Placeholder image URLs for courses and learning paths
const placeholderImages = [
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80',
  'https://images.unsplash.com/photo-1584277261846-c6a1672ed979?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80'
];

// Skill sets for courses
const skillSets = [
  ['Technology', 'Coding', 'Software Development'],
  ['Communication', 'Teamwork', 'Leadership'],
  ['Project Management', 'Organization', 'Time Management'],
  ['Critical Thinking', 'Problem Solving', 'Decision Making']
];

// Function to get a random item from an array
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

// Update HR course thumbnails and skills
async function updateHrCourses() {
  console.log('Updating HR courses with thumbnails and skills...');
  
  // Get all HR courses
  const { data: courses, error } = await supabase
    .from('hr_courses')
    .select('id, title');
    
  if (error) {
    console.error('Error fetching HR courses:', error);
    return;
  }
  
  if (!courses || courses.length === 0) {
    console.log('No HR courses found to update.');
    return;
  }
  
  console.log(`Found ${courses.length} HR courses to update.`);
  
  // Update each course with thumbnail and skills
  for (const course of courses) {
    const thumbnailUrl = getRandomItem(placeholderImages);
    const skills = getRandomItem(skillSets);
    const category = skills[0];
    const estimatedDuration = Math.floor(Math.random() * 120) + 30; // 30-150 minutes
    
    const { error: updateError } = await supabase
      .from('hr_courses')
      .update({
        thumbnail_url: thumbnailUrl,
        skills: JSON.stringify(skills),
        category,
        estimated_duration: estimatedDuration
      })
      .eq('id', course.id);
      
    if (updateError) {
      console.error(`Error updating course ${course.title}:`, updateError);
    } else {
      console.log(`✅ Updated course: ${course.title}`);
    }
  }
}

// Create learner dashboard preferences for employees
async function createLearnerPreferences() {
  console.log('Creating learner dashboard preferences...');
  
  // Get all HR employees
  const { data: employees, error } = await supabase
    .from('hr_employees')
    .select('id, name');
    
  if (error) {
    console.error('Error fetching HR employees:', error);
    return;
  }
  
  if (!employees || employees.length === 0) {
    console.log('No HR employees found to create preferences for.');
    return;
  }
  
  console.log(`Found ${employees.length} HR employees to create preferences for.`);
  
  // Create preferences for each employee
  for (const employee of employees) {
    // Check if preferences already exist
    const { data: existingPrefs } = await supabase
      .from('learner_dashboard_preferences')
      .select('id')
      .eq('employee_id', employee.id)
      .single();
      
    if (existingPrefs) {
      console.log(`Preferences already exist for ${employee.name}, skipping.`);
      continue;
    }
    
    // Create random preferences
    const learningStyles = ['visual', 'auditory', 'reading', 'kinesthetic'];
    const contentTypes = ['video', 'interactive', 'audio', 'text', 'quiz', 'project'];
    const goals = [
      'Improve technical skills',
      'Develop leadership abilities',
      'Enhance communication',
      'Learn project management',
      'Master new technologies',
      'Prepare for promotion',
      'Increase industry knowledge'
    ];
    
    // Generate random preferences
    const preferences = {
      preferred_learning_style: getRandomItem(learningStyles),
      preferred_content_types: [
        getRandomItem(contentTypes),
        getRandomItem(contentTypes)
      ].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
      learning_goals: [
        getRandomItem(goals),
        getRandomItem(goals)
      ].filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
    };
    
    // Insert preferences
    const { error: insertError } = await supabase
      .from('learner_dashboard_preferences')
      .insert({
        id: uuidv4(),
        employee_id: employee.id,
        preferences
      });
      
    if (insertError) {
      console.error(`Error creating preferences for ${employee.name}:`, insertError);
    } else {
      console.log(`✅ Created preferences for: ${employee.name}`);
    }
  }
}

// Create learner statistics for employees
async function createLearnerStatistics() {
  console.log('Creating learner statistics...');
  
  // Get all HR employees
  const { data: employees, error } = await supabase
    .from('hr_employees')
    .select('id, name');
    
  if (error) {
    console.error('Error fetching HR employees:', error);
    return;
  }
  
  if (!employees || employees.length === 0) {
    console.log('No HR employees found to create statistics for.');
    return;
  }
  
  console.log(`Found ${employees.length} HR employees to create statistics for.`);
  
  // Create statistics for each employee
  for (const employee of employees) {
    // Check if statistics already exist
    const { data: existingStats } = await supabase
      .from('learner_statistics')
      .select('id')
      .eq('employee_id', employee.id)
      .single();
      
    if (existingStats) {
      console.log(`Statistics already exist for ${employee.name}, skipping.`);
      continue;
    }
    
    // Get course enrollments for this employee
    const { data: enrollments } = await supabase
      .from('hr_course_enrollments')
      .select('status, progress')
      .eq('employee_id', employee.id);
      
    // Calculate statistics based on enrollments
    const completedCourses = enrollments?.filter(e => e.status === 'completed' || e.progress === 100).length || 0;
    const inProgressCourses = enrollments?.filter(e => e.status === 'in_progress' || (e.progress > 0 && e.progress < 100)).length || 0;
    const totalCourses = enrollments?.length || 0;
    
    // Generate random statistics with some basis in reality
    const stats = {
      courses_completed: completedCourses,
      courses_in_progress: inProgressCourses,
      total_time_spent: completedCourses * 2 + Math.floor(Math.random() * 10),
      average_score: 70 + Math.floor(Math.random() * 30),
      certificates_earned: Math.floor(completedCourses * 0.7),
      learning_paths_completed: Math.floor(completedCourses / 3),
      assigned_courses: totalCourses,
      skills_acquired: completedCourses * 2 + Math.floor(Math.random() * 5)
    };
    
    // Insert statistics
    const { error: insertError } = await supabase
      .from('learner_statistics')
      .insert({
        id: uuidv4(),
        employee_id: employee.id,
        ...stats
      });
      
    if (insertError) {
      console.error(`Error creating statistics for ${employee.name}:`, insertError);
    } else {
      console.log(`✅ Created statistics for: ${employee.name}`);
    }
  }
}

// Create learner achievements for employees
async function createLearnerAchievements() {
  console.log('Creating learner achievements...');
  
  // Get all HR employees
  const { data: employees, error } = await supabase
    .from('hr_employees')
    .select('id, name');
    
  if (error) {
    console.error('Error fetching HR employees:', error);
    return;
  }
  
  if (!employees || employees.length === 0) {
    console.log('No HR employees found to create achievements for.');
    return;
  }
  
  console.log(`Found ${employees.length} HR employees to create achievements for.`);
  
  // List of possible skills to acquire
  const possibleSkills = [
    'JavaScript', 'Python', 'React', 'Communication', 'Leadership',
    'Project Management', 'Data Analysis', 'Problem Solving',
    'Time Management', 'Teamwork', 'Public Speaking', 'Design Thinking'
  ];
  
  // Create achievements for each employee
  for (const employee of employees) {
    // Check if employee already has achievements
    const { data: existingAchievements } = await supabase
      .from('learner_achievements')
      .select('id')
      .eq('employee_id', employee.id);
      
    if (existingAchievements && existingAchievements.length > 0) {
      console.log(`Achievements already exist for ${employee.name}, skipping.`);
      continue;
    }
    
    // Get completed courses for this employee
    const { data: completedEnrollments } = await supabase
      .from('hr_course_enrollments')
      .select('course_id, course:hr_courses(title)')
      .eq('employee_id', employee.id)
      .or('status.eq.completed,progress.eq.100');
      
    // Generate achievements based on completed courses
    const achievements = [];
    
    // Add skill achievements (2-5 skills per employee)
    const numSkills = Math.floor(Math.random() * 4) + 2;
    const selectedSkills = [];
    
    for (let i = 0; i < numSkills; i++) {
      const skill = getRandomItem(possibleSkills);
      if (!selectedSkills.includes(skill)) {
        selectedSkills.push(skill);
        achievements.push({
          id: uuidv4(),
          employee_id: employee.id,
          achievement_type: 'skill_acquired',
          skill,
          description: `Demonstrated proficiency in ${skill}`,
          achievement_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() // Random date in last 90 days
        });
      }
    }
    
    // Add course completion achievements
    if (completedEnrollments && completedEnrollments.length > 0) {
      for (const enrollment of completedEnrollments) {
        achievements.push({
          id: uuidv4(),
          employee_id: employee.id,
          achievement_type: 'course_completed',
          course_id: enrollment.course_id,
          description: `Completed course: ${enrollment.course.title}`,
          achievement_date: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString() // Random date in last 180 days
        });
      }
    }
    
    // Add certificate achievements for some completed courses
    if (completedEnrollments && completedEnrollments.length > 0) {
      const certifiedCourses = completedEnrollments.slice(0, Math.ceil(completedEnrollments.length * 0.7));
      for (const enrollment of certifiedCourses) {
        achievements.push({
          id: uuidv4(),
          employee_id: employee.id,
          achievement_type: 'certificate_earned',
          course_id: enrollment.course_id,
          description: `Earned certificate for ${enrollment.course.title}`,
          achievement_date: new Date(Date.now() - Math.random() * 160 * 24 * 60 * 60 * 1000).toISOString() // Random date in last 160 days
        });
      }
    }
    
    // Insert achievements
    if (achievements.length > 0) {
      const { error: insertError } = await supabase
        .from('learner_achievements')
        .insert(achievements);
        
      if (insertError) {
        console.error(`Error creating achievements for ${employee.name}:`, insertError);
      } else {
        console.log(`✅ Created ${achievements.length} achievements for: ${employee.name}`);
      }
    } else {
      console.log(`No achievements to create for ${employee.name}.`);
    }
  }
}

// Main function to run all updates
async function main() {
  console.log('Starting dashboard data population...');
  
  try {
    await updateHrCourses();
    await createLearnerPreferences();
    await createLearnerStatistics();
    await createLearnerAchievements();
    
    console.log('✅ Dashboard data population completed successfully!');
  } catch (error) {
    console.error('Error during dashboard data population:', error);
  }
}

// Run the main function
main(); 