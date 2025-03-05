import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files with conflicts
const conflictFiles = [
  'src/components/CourseCard.tsx',
  'src/components/dashboard/ContinueLearningSection.tsx',
  'src/components/dashboard/DashboardTabs.tsx',
  'src/contexts/HRAuthContext.tsx',
  'src/pages/HRDashboard.tsx'
];

// Resolve conflicts by preferring the namespace import pattern
async function resolveConflicts() {
  for (const file of conflictFiles) {
    try {
      const filePath = path.resolve(__dirname, file);
      const content = await fs.promises.readFile(filePath, 'utf8');
      
      // Replace merge conflict markers with the stashed (namespace import) version
      let resolvedContent = content.replace(
        /<<<<<<< Updated upstream[\s\S]*?=======\s*(import \* as React from "react";)\s*>>>>>>> Stashed changes/g,
        '$1'
      );
      
      // In case the conflict pattern is different, also try the reverse
      resolvedContent = resolvedContent.replace(
        /<<<<<<< Stashed changes\s*(import \* as React from "react";)\s*=======[\s\S]*?>>>>>>> Updated upstream/g,
        '$1'
      );
      
      // Write the resolved content back to the file
      await fs.promises.writeFile(filePath, resolvedContent, 'utf8');
      console.log(`Resolved conflicts in ${file}`);
    } catch (error) {
      console.error(`Error resolving conflicts in ${file}:`, error);
    }
  }
}

resolveConflicts().catch(error => console.error('Error executing script:', error)); 