#!/usr/bin/env node

// Script to split the SQL file into smaller parts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the SQL file
const sqlFilePath = path.join(__dirname, 'populate-test-data.sql');
const outputDir = path.join(__dirname, 'split-sql');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Read the SQL file
console.log('📂 Reading SQL file...');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

// Split the SQL file by semicolons
const statements = sqlContent
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0);

console.log(`🔄 Found ${statements.length} SQL statements.`);

// Define logical groups for the SQL statements
const groups = [
  {
    name: '01-create-extension',
    pattern: /CREATE EXTENSION/i,
    statements: []
  },
  {
    name: '02-hr-employees',
    pattern: /INSERT INTO hr_employees/i,
    statements: []
  },
  {
    name: '03-employees-array',
    pattern: /SELECT ARRAY/i,
    statements: []
  },
  {
    name: '04-learning-paths',
    pattern: /INSERT INTO learning_paths/i,
    statements: []
  },
  {
    name: '05-temp-learning-paths',
    pattern: /CREATE TEMP TABLE temp_learning_paths/i,
    statements: []
  },
  {
    name: '06-courses',
    pattern: /INSERT INTO courses/i,
    statements: []
  },
  {
    name: '07-temp-courses',
    pattern: /CREATE TEMP TABLE temp_courses/i,
    statements: []
  },
  {
    name: '08-path-courses',
    pattern: /INSERT INTO learning_path_courses/i,
    statements: []
  },
  {
    name: '09-notice-auth-users',
    pattern: /RAISE NOTICE 'AUTH/i,
    statements: []
  },
  {
    name: '10-learning-path-assignments',
    pattern: /learning_path_assignments/i,
    statements: []
  },
  {
    name: '11-course-enrollments',
    pattern: /INSERT INTO course_enrollments/i,
    statements: []
  },
  {
    name: '12-agent-activities',
    pattern: /INSERT INTO agent_activities/i,
    statements: []
  },
  {
    name: '13-employee-user-mapping',
    pattern: /INSERT INTO employee_user_mapping/i,
    statements: []
  },
  {
    name: '14-cleanup',
    pattern: /DROP TABLE/i,
    statements: []
  },
  {
    name: '15-final-notice',
    pattern: /RAISE NOTICE 'Test data population complete'/i,
    statements: []
  },
  {
    name: '99-other',
    pattern: /./,
    statements: []
  }
];

// Group the statements
statements.forEach(stmt => {
  let found = false;
  for (const group of groups) {
    if (group.pattern.test(stmt)) {
      group.statements.push(stmt);
      found = true;
      break;
    }
  }
  if (!found) {
    groups[groups.length - 1].statements.push(stmt);
  }
});

// Write each group to a separate file
groups.forEach(group => {
  if (group.statements.length === 0) return;
  
  const filePath = path.join(outputDir, `${group.name}.sql`);
  const content = group.statements.join(';\n\n') + ';';
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Created ${filePath} with ${group.statements.length} statements`);
});

console.log('\n🎉 SQL file has been split into smaller parts.');
console.log(`📁 Files are located in: ${outputDir}`);
console.log('\nYou can now run each file individually with:');
console.log('cat src/scripts/split-sql/01-create-extension.sql | supabase db execute');
console.log('\nOr combine them with a script:');
console.log('for f in src/scripts/split-sql/*.sql; do cat $f | supabase db execute; done'); 