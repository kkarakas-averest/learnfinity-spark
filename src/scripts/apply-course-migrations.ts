import fs from 'fs';
import path from 'path';
import { db } from '@/db';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';

/**
 * This script applies course migrations to the database.
 * It reads SQL files from the migrations directory and executes them.
 */
async function applyCourseSchemaToDb() {
  try {
    console.log('Applying course schema migrations...');
    
    // Path to migration file
    const migrationFile = path.join(process.cwd(), 'src', 'db', 'migrations', '01_course_schema.sql');
    
    // Read migration file
    const migrationSql = fs.readFileSync(migrationFile, 'utf8');
    
    // Execute SQL
    console.log('Executing SQL...');
    await db.execute(sql.raw(migrationSql));
    
    console.log('✅ Course schema migrations applied successfully!');
    console.log('Tables created:');
    console.log('- courses');
    console.log('- course_modules');
    console.log('- course_quizzes');
    console.log('- quiz_questions');
    console.log('- course_assignments');
    console.log('- course_resources');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error applying course schema migrations:', error);
    return { success: false, error };
  }
}

// Run the migration
applyCourseSchemaToDb()
  .then((result) => {
    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 