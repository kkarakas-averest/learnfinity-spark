#!/usr/bin/env node
// Sample data seeder for the skills taxonomy system

import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

// Initialize dotenv to load environment variables
dotenv.config();

// Set up Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.A2AVZwetKe-CIJUzVcNm0OdNlceABZvDFU6YsX3kDRA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample positions IDs (normally these would come from your HR system)
const samplePositions = [
  { id: uuidv4(), title: 'Software Engineer', department: 'Engineering', description: 'Develops software applications and systems' },
  { id: uuidv4(), title: 'Product Manager', department: 'Product', description: 'Manages product lifecycle and roadmap' },
  { id: uuidv4(), title: 'Data Scientist', department: 'Data', description: 'Analyzes and interprets complex data sets' }
];

// Sample employees - to be loaded from the database
let sampleEmployees = [];

// Function to get random taxonomy skills from each category
async function getRandomSkills(count = 30) {
  // Get some random categories first
  const { data: categories, error: categoryError } = await supabase
    .from('skill_taxonomy_categories')
    .select('id, name')
    .limit(5);
  
  if (categoryError) {
    console.error('Error fetching categories:', categoryError);
    return [];
  }
  
  const skills = [];
  
  // For each category, get some skills
  for (const category of categories) {
    // First get subcategories
    const { data: subcategories, error: subcategoryError } = await supabase
      .from('skill_taxonomy_subcategories')
      .select('id')
      .eq('category_id', category.id)
      .limit(3);
    
    if (subcategoryError || !subcategories) continue;
    
    for (const subcategory of subcategories) {
      // Get groups
      const { data: groups, error: groupError } = await supabase
        .from('skill_taxonomy_groups')
        .select('id')
        .eq('subcategory_id', subcategory.id)
        .limit(2);
      
      if (groupError || !groups) continue;
      
      for (const group of groups) {
        // Get skills
        const { data: groupSkills, error: skillError } = await supabase
          .from('skill_taxonomy_items')
          .select('id, name, description')
          .eq('group_id', group.id)
          .limit(3);
        
        if (skillError || !groupSkills) continue;
        
        skills.push(...groupSkills);
      }
    }
  }
  
  return skills.slice(0, count);
}

// Fetch existing employees from the database
async function fetchExistingEmployees() {
  console.log('Fetching existing employees from the database...');
  
  const { data: employees, error } = await supabase
    .from('hr_employees')
    .select('id, name, position_id')
    .limit(10);
  
  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
  
  if (!employees || employees.length === 0) {
    console.log('No existing employees found in the database');
    return [];
  }
  
  console.log(`Found ${employees.length} existing employees`);
  
  // Use the first 3 employees or however many are available
  sampleEmployees = employees.slice(0, 3).map(emp => ({
    id: emp.id,
    name: emp.name,
    position: emp.position_id
  }));
  
  return sampleEmployees;
}

// Create sample positions in hr_positions table
async function createSamplePositions() {
  console.log('Creating sample positions...');
  
  // Prepare position data
  const positionData = samplePositions.map(position => ({
    id: position.id,
    title: position.title,
    department: position.department,
    description: position.description,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
  
  // Insert positions
  const { error } = await supabase
    .from('hr_positions')
    .upsert(positionData, { onConflict: 'id' });
  
  if (error) {
    console.error('Error inserting sample positions:', error);
  } else {
    console.log(`Successfully created ${positionData.length} sample positions`);
  }
}

// Create employee skills entries
async function createEmployeeSkills() {
  console.log('Creating sample employee skills data...');
  
  if (sampleEmployees.length === 0) {
    console.log('No employees to create skills for, skipping...');
    return;
  }
  
  // First get some random skills from the taxonomy
  const skills = await getRandomSkills(30);
  
  if (skills.length === 0) {
    console.log('No skills found in taxonomy');
    return;
  }
  
  console.log(`Found ${skills.length} skills in taxonomy`);
  
  const employeeSkillsData = [];
  
  // For each employee, assign some random skills with random proficiency
  for (const employee of sampleEmployees) {
    const employeeSkillCount = Math.floor(Math.random() * 10) + 5; // 5-15 skills per employee
    const shuffledSkills = [...skills].sort(() => 0.5 - Math.random());
    const employeeSkills = shuffledSkills.slice(0, employeeSkillCount);
    
    for (const skill of employeeSkills) {
      // Generate proficiency levels - ensure required fields are not null
      const proficiency = Math.floor(Math.random() * 5) + 1; // 1-5 proficiency
      const proficiencyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
      
      employeeSkillsData.push({
        id: uuidv4(),
        employee_id: employee.id,
        taxonomy_skill_id: skill.id,
        raw_skill: skill.name,
        // Make sure required fields are not null
        skill_name: skill.name, // Use skill name from taxonomy
        proficiency_level: proficiencyLevels[proficiency - 1], // Convert numeric proficiency to text level
        proficiency: proficiency, // 1-5 proficiency
        verified: Math.random() > 0.3, // 70% chance of being verified
        source: ['cv', 'assessment', 'self-reported', 'manager'][Math.floor(Math.random() * 4)],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    console.log(`Created ${employeeSkills.length} skills for employee ${employee.name}`);
  }
  
  // Insert skills in batches to avoid hitting limits
  const batchSize = 50;
  for (let i = 0; i < employeeSkillsData.length; i += batchSize) {
    const batch = employeeSkillsData.slice(i, i + batchSize);
    const { error } = await supabase
      .from('hr_employee_skills')
      .upsert(batch, { onConflict: 'id' });
    
    if (error) {
      console.error(`Error inserting employee skills batch ${i / batchSize + 1}:`, error);
    } else {
      console.log(`Inserted batch ${i / batchSize + 1} of employee skills`);
    }
  }
  
  console.log(`Created a total of ${employeeSkillsData.length} employee skills entries`);
}

// Create position skill requirements
async function createPositionRequirements() {
  console.log('Creating sample position skill requirements...');
  
  // Get some random skills from the taxonomy
  const skills = await getRandomSkills(30);
  
  if (skills.length === 0) {
    console.log('No skills found in taxonomy');
    return;
  }
  
  const positionRequirementsData = [];
  
  // For each position, define some required skills
  for (const position of samplePositions) {
    const requiredSkillCount = Math.floor(Math.random() * 10) + 8; // 8-18 required skills
    const shuffledSkills = [...skills].sort(() => 0.5 - Math.random());
    const requiredSkills = shuffledSkills.slice(0, requiredSkillCount);
    
    for (const skill of requiredSkills) {
      positionRequirementsData.push({
        id: uuidv4(),
        position_id: position.id,
        taxonomy_skill_id: skill.id,
        importance_level: Math.floor(Math.random() * 5) + 1, // 1-5 importance
        required_proficiency: Math.floor(Math.random() * 3) + 2, // 2-5 required proficiency
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    console.log(`Created ${requiredSkills.length} requirements for position ${position.title}`);
  }
  
  // Insert requirements in batches
  const batchSize = 50;
  for (let i = 0; i < positionRequirementsData.length; i += batchSize) {
    const batch = positionRequirementsData.slice(i, i + batchSize);
    const { error } = await supabase
      .from('position_skill_requirements')
      .upsert(batch, { onConflict: 'position_id, taxonomy_skill_id' });
    
    if (error) {
      console.error(`Error inserting position requirements batch ${i / batchSize + 1}:`, error);
    } else {
      console.log(`Inserted batch ${i / batchSize + 1} of position requirements`);
    }
  }
  
  console.log(`Created a total of ${positionRequirementsData.length} position skill requirements`);
}

// Log sample data for testing
function logSampleData() {
  console.log('\n--- Sample Test Data ---');
  console.log('Sample Employees:');
  sampleEmployees.forEach(e => console.log(`- ${e.name} (${e.id})`));
  
  console.log('\nSample Positions:');
  samplePositions.forEach(p => console.log(`- ${p.title} (${p.id})`));
  
  console.log('\nSample API Requests:');
  if (sampleEmployees.length > 0 && samplePositions.length > 0) {
    console.log(`\n1. Gap analysis for ${sampleEmployees[0].name} as ${samplePositions[0].title}:`);
    console.log(`   GET /api/skills/gap-analysis?employeeId=${sampleEmployees[0].id}&positionId=${samplePositions[0].id}`);
    
    console.log(`\n2. Generate course for filling gaps:`);
    console.log(`   POST /api/skills/course-generation`);
    console.log(`   {
     "title": "Gap-filling course for ${sampleEmployees[0].name}",
     "employeeId": "${sampleEmployees[0].id}",
     "positionId": "${samplePositions[0].id}",
     "format": "markdown"
   }`);
  }
}

async function seedData() {
  console.log('Starting sample data seeding...');
  
  // First clear any existing data
  console.log('Clearing existing sample data...');
  await supabase.from('hr_employee_skills').delete().filter('id', 'neq', 'no_records');
  await supabase.from('position_skill_requirements').delete().filter('id', 'neq', 'no_records');
  await supabase.from('hr_positions').delete().filter('id', 'neq', 'no_records');
  
  // Fetch existing employees
  await fetchExistingEmployees();
  
  // Create positions first (since they're referenced by position_skill_requirements)
  await createSamplePositions();
  
  // Create data
  await createEmployeeSkills();
  await createPositionRequirements();
  
  // Log sample data for testing
  logSampleData();
  
  console.log('\nSample data seeding completed!');
}

// Run the seeder
seedData()
  .catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  }); 