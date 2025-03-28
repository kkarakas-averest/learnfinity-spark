// Patch API server script 
// This script patches the api-server.js file to use real data from database
// Run this with node src/scripts/patch-api-server.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to api-server.js
const apiServerPath = path.join(__dirname, '../../api-server.js');

console.log('Reading api-server.js file...');
try {
  // Read the api-server.js file
  let apiServerCode = fs.readFileSync(apiServerPath, 'utf8');
  
  console.log('File found, checking for dashboard endpoint...');
  
  // Find the learner dashboard endpoint
  const dashboardEndpointRegex = /app\.get\('\/api\/learner\/dashboard'/;
  if (!dashboardEndpointRegex.test(apiServerCode)) {
    console.error('Dashboard endpoint not found in api-server.js');
    process.exit(1);
  }
  
  // Find the learningPaths section
  const learningPathsPattern = /let\s+learningPaths\s*=\s*\[[^\]]*\]/s;
  const learningPathsMatch = apiServerCode.match(learningPathsPattern);
  
  if (!learningPathsMatch) {
    console.error('Learning paths section not found in api-server.js');
    process.exit(1);
  }
  
  console.log('Found learning paths section, checking for new fields...');
  
  // Check if fields already exist
  if (apiServerCode.includes('estimatedCompletionDate') && apiServerCode.includes('enrollmentDate')) {
    console.log('New fields already exist in api-server.js');
    process.exit(0);
  }
  
  // Add the fields to learning paths
  const updatedLearningPaths = learningPathsMatch[0].replace(
    /(\s*}\s*)\]/,
    ',\n      estimatedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),\n      enrollmentDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()$1]'
  );
  
  // Replace the learning paths section
  let updatedCode = apiServerCode.replace(learningPathsPattern, updatedLearningPaths);
  
  // Now find the section where we query learning paths from the database
  const lpQueryPattern = /const\s*\{\s*data\s*:\s*lpEnrollments\s*,\s*error\s*:\s*lpError\s*\}\s*=\s*await\s*supabase[\s\S]*?employee_id',\s*userId\);/;
  const lpQueryMatch = updatedCode.match(lpQueryPattern);
  
  if (lpQueryMatch) {
    console.log('Found learning path query section, updating to include estimated_completion_date...');
    
    // Update to include estimated_completion_date in the query
    const updatedLpQuery = lpQueryMatch[0].replace(
      /(enrollment_date,\s*completion_date)/,
      '$1,\n          estimated_completion_date'
    );
    
    updatedCode = updatedCode.replace(lpQueryPattern, updatedLpQuery);
  }
  
  // Now find where learning paths are mapped from database to API
  const lpMapPattern = /realLearningPaths\s*=\s*lpEnrollments\.map\([\s\S]*?}\);/;
  const lpMapMatch = updatedCode.match(lpMapPattern);
  
  if (lpMapMatch) {
    console.log('Found learning path mapping section, updating to include estimated_completion_date and enrollment_date...');
    
    // Check if the mapping already includes the fields
    if (!lpMapMatch[0].includes('estimatedCompletionDate') && !lpMapMatch[0].includes('enrollmentDate')) {
      // Add the fields to the mapping
      const updatedLpMap = lpMapMatch[0].replace(
        /(thumbnail_url:[^,}]*[,}])/,
        '$1,\n          estimatedCompletionDate: enrollment.estimated_completion_date || null,\n          enrollmentDate: enrollment.enrollment_date || null'
      );
      
      updatedCode = updatedCode.replace(lpMapPattern, updatedLpMap);
    }
  }
  
  // Now find the courses section
  const coursesPattern = /let\s+courses\s*=\s*\[[^\]]*\]/s;
  const coursesMatch = updatedCode.match(coursesPattern);
  
  if (coursesMatch) {
    console.log('Found courses section, updating to include enrollmentDate...');
    
    // Add enrollmentDate to courses
    const updatedCourses = coursesMatch[0].replace(
      /course_type:\s*['"]required['"]([,}])/,
      'course_type: \'required\',\n      enrollmentDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()$1'
    );
    
    updatedCode = updatedCode.replace(coursesPattern, updatedCourses);
  }
  
  // Now find where courses are mapped
  const courseMapPattern = /realCourses\s*=\s*courseEnrollments\.map\([\s\S]*?}\);/;
  const courseMapMatch = updatedCode.match(courseMapPattern);
  
  if (courseMapMatch) {
    console.log('Found course mapping section, updating to include enrollment_date...');
    
    // Check if the mapping already includes the field
    if (!courseMapMatch[0].includes('enrollmentDate')) {
      // Add the field to the mapping
      const updatedCourseMap = courseMapMatch[0].replace(
        /(hr_training_title:[^,}]*[,}])/,
        '$1,\n          enrollmentDate: enrollment.enrollment_date || null'
      );
      
      updatedCode = updatedCode.replace(courseMapPattern, updatedCourseMap);
    }
  }
  
  // Check what changes were made
  if (updatedCode === apiServerCode) {
    console.log('No changes were made to api-server.js. It might already be patched or have a different structure.');
    process.exit(0);
  }
  
  // Write the updated code back to the file
  fs.writeFileSync(apiServerPath, updatedCode, 'utf8');
  
  console.log('Successfully patched api-server.js to include the new fields!');
  console.log('Please restart the API server to apply changes.');
  
} catch (error) {
  console.error('Error patching api-server.js:', error);
  process.exit(1);
} 