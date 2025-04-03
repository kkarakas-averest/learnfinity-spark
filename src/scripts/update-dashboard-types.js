// Script to update dashboard types to include new fields
// Run with: node src/scripts/update-dashboard-types.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Potential locations for the hybrid-data.ts file
const potentialPaths = [
  path.join(__dirname, '../../src/app/api/learner/dashboard/hybrid-data.ts'),
  path.join(__dirname, '../../app/api/learner/dashboard/hybrid-data.ts'),
  path.join(__dirname, '../app/api/learner/dashboard/hybrid-data.ts'),
  path.join(__dirname, '../../src/lib/types/dashboard.ts'),
  path.join(__dirname, '../../src/types/dashboard.ts')
];

// Find the file in potential locations
let typesFilePath = null;
for (const potentialPath of potentialPaths) {
  console.log(`Checking if file exists at: ${potentialPath}`);
  if (fs.existsSync(potentialPath)) {
    typesFilePath = potentialPath;
    console.log(`Found file at: ${typesFilePath}`);
    break;
  }
}

// If file not found in potential locations, create it
if (!typesFilePath) {
  console.log('Could not find hybrid-data.ts in expected locations');
  
  // Create file in a new location
  const fallbackDir = path.join(__dirname, '../../src/app/api/learner/dashboard');
  if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true });
  }
  
  typesFilePath = path.join(fallbackDir, 'hybrid-data.ts');
  
  // Create a new file with the basic interface
  const basicContent = `
export interface DashboardLearningPath {
  id: string;
  title: string;
  description: string;
  courses_count: number;
  skills: string[];
  due_date: string;
  progress: number;
  is_hr_assigned: boolean;
  hr_learning_path_id: string;
  thumbnail_url: string;
  estimatedCompletionDate?: string | null;
  enrollmentDate?: string | null;
}
`;
  
  fs.writeFileSync(typesFilePath, basicContent, 'utf8');
  console.log(`Created new hybrid-data.ts file at ${typesFilePath}`);
  process.exit(0);
}

try {
  // Read the file content
  const content = fs.readFileSync(typesFilePath, 'utf8');
  
  // Check if the DashboardLearningPath interface exists
  const interfacePattern = /export\s+interface\s+DashboardLearningPath\s*\{[^}]*\}/s;
  const match = content.match(interfacePattern);
  
  if (!match) {
    console.error('DashboardLearningPath interface not found in hybrid-data.ts');
    
    // Append the interface to the file
    const newInterface = `
export interface DashboardLearningPath {
  id: string;
  title: string;
  description: string;
  courses_count: number;
  skills: string[];
  due_date: string;
  progress: number;
  is_hr_assigned: boolean;
  hr_learning_path_id: string;
  thumbnail_url: string;
  estimatedCompletionDate?: string | null;
  enrollmentDate?: string | null;
}
`;
    
    fs.appendFileSync(typesFilePath, newInterface, 'utf8');
    console.log(`Added DashboardLearningPath interface to ${typesFilePath}`);
    process.exit(0);
  }
  
  const interfaceContent = match[0];
  
  // Check if the fields already exist
  if (interfaceContent.includes('estimatedCompletionDate') && 
      interfaceContent.includes('enrollmentDate')) {
    console.log('Fields already exist in the DashboardLearningPath interface');
    process.exit(0);
  }
  
  // Add the new fields to the interface
  let updatedInterfaceContent = interfaceContent;
  
  // If the interface doesn't end with a semicolon or field, add a comma
  const lastLine = updatedInterfaceContent.trim().split('\n').pop() || '';
  const needsComma = !lastLine.trim().endsWith(';') && 
                     !lastLine.trim().endsWith(',') &&
                     !lastLine.trim().endsWith('{');
  
  if (needsComma && !lastLine.trim().endsWith('}')) {
    updatedInterfaceContent = updatedInterfaceContent.replace(/}$/, ',\n  }');
  }
  
  // Add the new fields
  updatedInterfaceContent = updatedInterfaceContent.replace(
    /}$/,
    '  estimatedCompletionDate?: string | null;\n  enrollmentDate?: string | null;\n}'
  );
  
  // Replace the old interface with the updated one
  const updatedContent = content.replace(interfacePattern, updatedInterfaceContent);
  
  // Write the file back
  fs.writeFileSync(typesFilePath, updatedContent, 'utf8');
  
  console.log('Successfully updated DashboardLearningPath interface!');
  console.log('Added fields: estimatedCompletionDate, enrollmentDate');
  
} catch (error) {
  console.error('Error updating types file:', error);
  process.exit(1);
} 