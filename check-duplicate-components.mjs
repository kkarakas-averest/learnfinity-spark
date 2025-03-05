import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getFiles(dir) {
  const subdirs = await fs.promises.readdir(dir);
  const files = await Promise.all(subdirs.map(async (subdir) => {
    const res = path.resolve(dir, subdir);
    return (await fs.promises.stat(res)).isDirectory() ? getFiles(res) : res;
  }));
  return files.flat().filter(file => 
    file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.jsx'));
}

// Function to extract exported component names from a file
function extractComponentNames(content) {
  const componentRegexes = [
    /export\s+const\s+([A-Z][A-Za-z0-9_]*)\s*=/g,
    /export\s+function\s+([A-Z][A-Za-z0-9_]*)/g,
    /export\s+default\s+function\s+([A-Z][A-Za-z0-9_]*)/g,
    /export\s+default\s+const\s+([A-Z][A-Za-z0-9_]*)\s*=/g
  ];
  
  let componentNames = [];
  
  componentRegexes.forEach(regex => {
    let match;
    while ((match = regex.exec(content)) !== null) {
      componentNames.push(match[1]);
    }
  });
  
  return componentNames;
}

async function findDuplicateComponents() {
  console.log("Searching for duplicate component declarations...");
  const srcDir = path.resolve(__dirname, './src');
  console.log(`Scanning directory: ${srcDir}`);
  
  try {
    const files = await getFiles(srcDir);
    console.log(`Found ${files.length} TypeScript/React files to process`);
    
    // Map to store component names and their file locations
    const componentMap = new Map();
    
    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file, 'utf8');
        const components = extractComponentNames(content);
        
        components.forEach(component => {
          if (!componentMap.has(component)) {
            componentMap.set(component, []);
          }
          componentMap.get(component).push(file);
        });
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
    
    // Find components that exist in more than one file
    let duplicates = 0;
    console.log("\nPotential duplicate components:");
    
    for (const [component, files] of componentMap.entries()) {
      if (files.length > 1) {
        console.log(`\nComponent "${component}" found in ${files.length} files:`);
        files.forEach(file => console.log(`  - ${file}`));
        duplicates++;
      }
    }
    
    if (duplicates === 0) {
      console.log("No duplicate component declarations found.");
    } else {
      console.log(`\nFound ${duplicates} potentially duplicate component declarations.`);
    }
  } catch (error) {
    console.error('Error scanning directory:', error);
  }
}

findDuplicateComponents().catch(error => console.error('Error executing script:', error)); 