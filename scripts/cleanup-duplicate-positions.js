#!/usr/bin/env node
// One-time script to clean up duplicate position records

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Initialize dotenv to load environment variables
dotenv.config();

// Set up Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicatePositions() {
  console.log('Starting cleanup of duplicate positions...');
  
  // Step 1: Get all position titles with counts
  const { data: counts, error: countError } = await supabase.rpc(
    'get_duplicate_titles',
    {},
    { count: 'exact' }
  );
  
  if (countError) {
    console.log('Using direct query instead of function');
    // Use direct query instead
    const { data: duplicateTitles, error: queryError } = await supabase
      .from('hr_positions')
      .select('title')
      .eq('title', 'Software Engineer');
      
    if (queryError) {
      console.error('Error querying positions:', queryError);
      return;
    }
  }
  
  // Define the titles we know have duplicates
  const duplicateTitles = [
    'Software Engineer',
    'Product Manager',
    'Data Scientist'
  ];
  
  for (const title of duplicateTitles) {
    console.log(`Processing duplicates for: ${title}`);
    
    // Get all positions with this title, ordered by creation date (oldest first)
    const { data: positions, error: posError } = await supabase
      .from('hr_positions')
      .select('id, title, created_at')
      .eq('title', title)
      .order('created_at', { ascending: true });
    
    if (posError) {
      console.error(`Error fetching positions for ${title}:`, posError);
      continue;
    }
    
    if (!positions || positions.length < 2) {
      console.log(`No duplicates found for ${title}`);
      continue;
    }
    
    console.log(`Found ${positions.length} positions with title "${title}"`);
    
    // Keep the first one (oldest) and delete the rest
    const keepPosition = positions[0];
    const deletePositions = positions.slice(1);
    const deleteIds = deletePositions.map(p => p.id);
    
    console.log(`Keeping position ${keepPosition.id} (created ${keepPosition.created_at})`);
    console.log(`Deleting ${deletePositions.length} duplicate positions`);
    
    // First update any references in position_skill_requirements
    for (const deletePos of deletePositions) {
      // Find requirements for the position to be deleted
      const { data: requirements, error: reqError } = await supabase
        .from('position_skill_requirements')
        .select('id, taxonomy_skill_id')
        .eq('position_id', deletePos.id);
      
      if (reqError) {
        console.error(`Error getting requirements for ${deletePos.id}:`, reqError);
        continue;
      }
      
      if (requirements && requirements.length > 0) {
        console.log(`Updating ${requirements.length} skill requirements to reference position ${keepPosition.id}`);
        
        // Update each requirement to point to the kept position
        for (const req of requirements) {
          const { error: updateError } = await supabase
            .from('position_skill_requirements')
            .update({ position_id: keepPosition.id })
            .eq('id', req.id);
          
          if (updateError) {
            console.error(`Error updating requirement ${req.id}:`, updateError);
          }
        }
      }
      
      // Also update references in hr_employees if any
      const { data: employees, error: empError } = await supabase
        .from('hr_employees')
        .select('id, name')
        .eq('position_id', deletePos.id);
      
      if (empError) {
        console.error(`Error getting employees for position ${deletePos.id}:`, empError);
      } else if (employees && employees.length > 0) {
        console.log(`Updating ${employees.length} employees to reference position ${keepPosition.id}`);
        
        // Update employees to point to the kept position
        const { error: updateEmpError } = await supabase
          .from('hr_employees')
          .update({ position_id: keepPosition.id })
          .eq('position_id', deletePos.id);
        
        if (updateEmpError) {
          console.error(`Error updating employee positions:`, updateEmpError);
        }
      }
    }
    
    // Then delete the duplicate positions
    const { error: deleteError } = await supabase
      .from('hr_positions')
      .delete()
      .in('id', deleteIds);
    
    if (deleteError) {
      console.error(`Error deleting duplicate positions:`, deleteError);
    } else {
      console.log(`Successfully deleted ${deleteIds.length} duplicate positions with title "${title}"`);
    }
  }
  
  console.log('Duplicate positions cleanup completed!');
}

// Run the cleanup
cleanupDuplicatePositions()
  .catch(error => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }); 