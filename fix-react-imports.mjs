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

async function fixImports() {
  console.log("Starting to fix React imports...");
  const srcDir = path.resolve(__dirname, './src');
  console.log(`Scanning directory: ${srcDir}`);
  
  try {
    const files = await getFiles(srcDir);
    console.log(`Found ${files.length} TypeScript/React files to process`);
    
    let modifiedFiles = [];
    let processedFilesCount = 0;
    
    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file, 'utf8');
        processedFilesCount++;
        
        // Different React import patterns to match
        const patterns = [
          // import React from 'react'
          /import\s+React\s+from\s+["']react["']/g,
          
          // import { useState, useEffect } from 'react'
          /import\s+{\s*([^}]*)\s*}\s+from\s+["']react["']/g,
          
          // import React, { useState, useEffect } from 'react'
          /import\s+React,\s*{\s*([^}]*)\s*}\s+from\s+["']react["']/g
        ];
        
        let newContent = content;
        let wasModified = false;
        
        // Check for each pattern
        for (const pattern of patterns) {
          if (pattern.test(newContent)) {
            // Reset lastIndex
            pattern.lastIndex = 0;
            
            // If the correct pattern is already present, don't modify
            if (/import\s+\*\s+as\s+React\s+from\s+["']react["']/g.test(newContent)) {
              continue;
            }
            
            // Replace any match with our standard import
            newContent = newContent.replace(pattern, 'import * as React from "react"');
            wasModified = true;
          }
        }
        
        if (wasModified) {
          await fs.promises.writeFile(file, newContent, 'utf8');
          modifiedFiles.push(file);
          console.log(`Fixed imports in: ${file}`);
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
    
    console.log(`\nProcessed ${processedFilesCount} files`);
    console.log(`Fixed imports in ${modifiedFiles.length} files`);
    
    if (modifiedFiles.length > 0) {
      console.log(`Files modified:`);
      modifiedFiles.forEach(file => console.log(`- ${file}`));
    }
  } catch (error) {
    console.error('Error scanning directory:', error);
  }
}

fixImports().catch(error => console.error('Error executing script:', error)); 