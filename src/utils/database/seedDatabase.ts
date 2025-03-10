/**
 * Database Seeding Utility
 * 
 * This is the main entry point for seeding the database with sample data for development and testing.
 * It coordinates the various seed functions for different parts of the application.
 */

// Load environment variables from .env files
import 'dotenv/config';

// Import seed functions
import { seedAllCourseData } from './seedCourses';
import { seedAllEmployeeData } from './seedEmployees';
import { seedAllAssessmentData } from './seedAssessments';
import { seedAssessmentsV2 } from './seedAssessments';

// Supabase client
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client using environment variables
let supabase: any = null;

// Initialize the Supabase client
const initSupabase = () => {
  if (typeof window === 'undefined') {
    // Server-side
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in environment variables');
    }
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  } else {
    // Client-side
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in environment variables');
    }
    return createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
  }
};

// Ensure we have a supabase client
export const ensureSupabaseClient = () => {
  if (!supabase) {
    supabase = initSupabase();
  }
  return supabase;
};

// Export the client for use in seed functions
export const getSupabaseClient = () => {
  return ensureSupabaseClient();
};

/**
 * Main seeding function that coordinates all the seed operations
 */
export const seedDatabase = async () => {
  console.log('========================================');
  console.log('🌱 Starting database seeding process');
  console.log('========================================');
  
  try {
    // Initialize Supabase client
    ensureSupabaseClient();
    
    // Start with employees first as they're referenced by other data
    console.log('\n📊 SEEDING EMPLOYEE DATA');
    console.log('----------------------------------------');
    const employeeSuccess = await seedAllEmployeeData();
    if (!employeeSuccess) {
      throw new Error('Failed to seed employee data');
    }
    
    // Then seed courses
    console.log('\n📚 SEEDING COURSE DATA');
    console.log('----------------------------------------');
    const courseSuccess = await seedAllCourseData();
    if (!courseSuccess) {
      throw new Error('Failed to seed course data');
    }
    
    // Finally seed assessments
    console.log('\n📝 SEEDING ASSESSMENT DATA');
    console.log('----------------------------------------');
    // Get course IDs for assessments
    const { data: courses } = await supabase.from('courses').select('id');
    const courseIds = courses ? courses.map(course => course.id) : [];
    
    const assessmentSuccess = await seedAllAssessmentData(courseIds);
    if (!assessmentSuccess) {
      throw new Error('Failed to seed assessment data');
    }
    
    // Seed assessments with new schema
    console.log('\n📝 SEEDING NEW FORMAT ASSESSMENT DATA');
    console.log('----------------------------------------');
    const newFormatAssessmentSuccess = await seedAssessmentsV2();
    if (!newFormatAssessmentSuccess) {
      throw new Error('Failed to seed new format assessment data');
    }
    
    console.log('\n========================================');
    console.log('✅ Database seeding completed successfully!');
    console.log('========================================');
    
    return true;
  } catch (error) {
    console.error('\n========================================');
    console.error('❌ Database seeding failed:', error);
    console.error('========================================');
    
    return false;
  }
};

// If this script is run directly (not imported)
if (typeof require !== 'undefined' && require.main === module) {
  seedDatabase()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error in seed process:', error);
      process.exit(1);
    });
}

// For use in other scripts or from the command line
export default seedDatabase; 