#!/usr/bin/env node
// taxonomy-import.js - Direct script to import taxonomy data to Supabase

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Set up Supabase client with hardcoded credentials
const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define the path to the taxonomy file from command line argument
const taxonomyFilePath = process.argv[2];

if (!taxonomyFilePath) {
  console.error('Please provide the path to the taxonomy JSON file as a command line argument.');
  process.exit(1);
}

// Check the existing tables before starting
async function checkTables() {
  console.log('Checking existing tables...');
  
  // First, let's check what tables exist
  const { data, error } = await supabase
    .from('skill_taxonomy_categories')
    .select('id')
    .limit(1);
  
  if (error) {
    console.log('skill_taxonomy_categories table may not exist or cannot be accessed:', error.message);
    return false;
  }
  
  console.log('Found skill_taxonomy_categories table');
  return true;
}

async function importTaxonomy() {
  try {
    // First check if tables exist
    const tablesExist = await checkTables();
    if (!tablesExist) {
      console.error('Required tables do not exist. Please create them first.');
      process.exit(1);
    }
    
    // Read and parse the taxonomy file
    console.log(`Reading taxonomy file from: ${taxonomyFilePath}`);
    const rawData = fs.readFileSync(taxonomyFilePath, 'utf8');
    console.log(`Parsing JSON data...`);
    const taxonomyData = JSON.parse(rawData);
    
    // Count total items for progress reporting
    let totalCategories = Object.keys(taxonomyData).length;
    console.log(`Found ${totalCategories} top-level categories to process`);
    
    // Track statistics for logs
    const stats = {
      categories: 0,
      subcategories: 0,
      groups: 0,
      skills: 0
    };

    // Process each category
    const categoryEntries = Object.entries(taxonomyData);
    for (let i = 0; i < categoryEntries.length; i++) {
      const [categoryKey, subcategories] = categoryEntries[i];
      const categoryId = uuidv4();
      
      // Extract the category name from the key
      const categoryName = categoryKey; 
      const categoryDescription = `Category for ${categoryKey}`; 
      
      console.log(`[${i+1}/${totalCategories}] Processing category: ${categoryName}`);
      
      try {
        // Insert category
        const { error: categoryError } = await supabase
          .from('skill_taxonomy_categories')
          .insert([{ 
            id: categoryId, 
            name: categoryName, 
            description: categoryDescription
          }]);
        
        if (categoryError) {
          console.error(`  Error inserting category ${categoryName}:`, categoryError);
          continue; // Skip to next category if there's an error
        }
        
        stats.categories++;
        console.log(`  ✓ Category inserted: ${categoryName}`);
        
        // Process subcategories
        const subcategoryEntries = Object.entries(subcategories);
        console.log(`  Found ${subcategoryEntries.length} subcategories for ${categoryName}`);
        
        for (let j = 0; j < subcategoryEntries.length; j++) {
          const [subcategoryKey, groups] = subcategoryEntries[j];
          const subcategoryId = uuidv4();
          const subcategoryName = subcategoryKey;
          const subcategoryDescription = `Subcategory of ${categoryName}: ${subcategoryKey}`;
          
          console.log(`  [${j+1}/${subcategoryEntries.length}] Processing subcategory: ${subcategoryName}`);
          
          try {
            // Insert subcategory
            const { error: subcategoryError } = await supabase
              .from('skill_taxonomy_subcategories')
              .insert([{ 
                id: subcategoryId, 
                category_id: categoryId, 
                name: subcategoryName, 
                description: subcategoryDescription
              }]);
            
            if (subcategoryError) {
              console.error(`    Error inserting subcategory ${subcategoryName}:`, subcategoryError);
              continue; // Skip to next subcategory if there's an error
            }
            
            stats.subcategories++;
            console.log(`    ✓ Subcategory inserted: ${subcategoryName}`);
            
            // Process groups
            const groupEntries = Object.entries(groups);
            console.log(`    Found ${groupEntries.length} groups for ${subcategoryName}`);
            
            for (let k = 0; k < groupEntries.length; k++) {
              const [groupKey, items] = groupEntries[k];
              const groupId = uuidv4();
              const groupName = groupKey;
              const groupDescription = `Group of ${subcategoryName}: ${groupKey}`;
              
              console.log(`    [${k+1}/${groupEntries.length}] Processing group: ${groupName}`);
              
              try {
                // Insert group
                const { error: groupError } = await supabase
                  .from('skill_taxonomy_groups')
                  .insert([{ 
                    id: groupId, 
                    subcategory_id: subcategoryId, 
                    name: groupName, 
                    description: groupDescription
                  }]);
                
                if (groupError) {
                  console.error(`      Error inserting group ${groupName}:`, groupError);
                  continue; // Skip to next group if there's an error
                }
                
                stats.groups++;
                console.log(`      ✓ Group inserted: ${groupName}`);
                
                // Process skills (items)
                if (items && typeof items === 'object') {
                  const itemEntries = Object.entries(items);
                  console.log(`      Found ${itemEntries.length} skills for ${groupName}`);
                  
                  // Process in batches of 50 for better performance
                  const BATCH_SIZE = 50;
                  let batch = [];
                  
                  for (let l = 0; l < itemEntries.length; l++) {
                    const [itemKey, itemValue] = itemEntries[l];
                    const itemId = uuidv4();
                    
                    // Use the value as the name if it's a string, otherwise use the key
                    const itemName = typeof itemValue === 'string' ? itemValue : itemKey;
                    let itemDescription = `Skill in ${groupName}`;
                    
                    // Add the numeric key as external_id if it looks like a numeric ID
                    let externalId = null;
                    if (/^\d+$/.test(itemKey)) {
                      externalId = itemKey;
                    }
                    
                    // Add to batch
                    batch.push({ 
                      id: itemId, 
                      group_id: groupId, 
                      name: itemName, 
                      description: itemDescription,
                      external_id: externalId
                    });
                    
                    // If batch is full or this is the last item, insert batch
                    if (batch.length >= BATCH_SIZE || l === itemEntries.length - 1) {
                      try {
                        // Insert skills batch
                        const { error: itemError } = await supabase
                          .from('skill_taxonomy_items')
                          .insert(batch);
                        
                        if (itemError) {
                          console.error(`      Error inserting skill batch (${batch.length} items):`, itemError);
                        } else {
                          stats.skills += batch.length;
                          console.log(`      ✓ Inserted batch of ${batch.length} skills (${stats.skills} total)`);
                        }
                      } catch (batchErr) {
                        console.error(`      Error inserting skill batch:`, batchErr);
                      }
                      
                      // Reset batch
                      batch = [];
                    }
                  }
                }
              } catch (groupErr) {
                console.error(`      Error processing group ${groupName}:`, groupErr);
              }
            }
          } catch (subcategoryErr) {
            console.error(`    Error processing subcategory ${subcategoryName}:`, subcategoryErr);
          }
        }
      } catch (categoryErr) {
        console.error(`  Error processing category ${categoryName}:`, categoryErr);
      }
      
      // Print progress after each category
      console.log(`\nProgress so far:
      - Categories: ${stats.categories}/${totalCategories}
      - Subcategories: ${stats.subcategories}
      - Groups: ${stats.groups}
      - Skills: ${stats.skills}
      `);
    }
    
    console.log('\nTaxonomy import completed!');
    console.log(`Final statistics:
    - Categories: ${stats.categories}
    - Subcategories: ${stats.subcategories}
    - Groups: ${stats.groups}
    - Skills: ${stats.skills}
    `);
    
  } catch (error) {
    console.error('Error importing taxonomy:', error);
    process.exit(1);
  }
}

// Run the import
importTaxonomy(); 