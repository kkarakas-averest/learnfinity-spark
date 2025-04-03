import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  // Initialize Supabase client with anon key (which we've confirmed works)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or key is missing. Please check your .env file.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('Database Schema Update Script');
  console.log('============================');
  
  // 1. Create a function to execute SQL through RPC if available
  console.log('\n1. Checking if exec_sql function exists...');

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    if (error) {
      console.log('For schema updates, copy and paste these SQL commands into the Supabase SQL Editor:');
      outputSqlForManualExecution();
      return;
    }
    console.log('exec_sql function exists, attempting automatic schema updates...');
  } catch (err) {
    console.log('For schema updates, copy and paste these SQL commands into the Supabase SQL Editor:');
    outputSqlForManualExecution();
    return;
  }
  
  // 2. Add the estimated_completion_date column to hr_learning_path_enrollments
  console.log('\n2. Adding estimated_completion_date column to hr_learning_path_enrollments...');
  try {
    const { error } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE hr_learning_path_enrollments ADD COLUMN IF NOT EXISTS estimated_completion_date TIMESTAMP WITH TIME ZONE;' 
    });
    
    if (error) {
      console.error('Error adding column:', error.message);
      
      // Try with FROM version if pgRPC103 error (insufficient permissions)
      if (error.code === 'pgRPC103') {
        console.log('Trying alternative approach...');
        
        // Check if the column already exists
        try {
          const { error: altError } = await supabase
            .from('hr_learning_path_enrollments')
            .select('estimated_completion_date')
            .limit(1);
            
          if (altError && altError.message.includes('does not exist')) {
            console.log('Column does not exist. You need to add it manually in Supabase Dashboard or SQL Editor with:');
            console.log(`
              ALTER TABLE hr_learning_path_enrollments 
              ADD COLUMN IF NOT EXISTS estimated_completion_date TIMESTAMP WITH TIME ZONE;
            `);
          } else {
            console.log('Column appears to already exist or there was another error checking it:', altError?.message);
          }
        } catch (checkErr) {
          console.error('Error checking column:', checkErr);
        }
      }
    } else {
      console.log('Column added successfully!');
    }
  } catch (err) {
    console.error('Unexpected error adding column:', err);
  }
  
  // 3. Check if hr_learning_path_courses table exists, create if not
  console.log('\n3. Checking if hr_learning_path_courses table exists...');
  try {
    const { error } = await supabase
      .from('hr_learning_path_courses')
      .select('id')
      .limit(1);
      
    if (error && error.message.includes('does not exist')) {
      console.log('hr_learning_path_courses table does not exist. Creating table...');
      
      const createTableSql = `
        CREATE TABLE IF NOT EXISTS hr_learning_path_courses (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          learning_path_id UUID NOT NULL REFERENCES hr_learning_paths(id),
          course_id UUID NOT NULL REFERENCES hr_courses(id),
          order_number INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `;
      
      try {
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSql });
        
        if (createError) {
          console.error('Error creating table:', createError.message);
          console.log('You need to create the table manually in Supabase Dashboard or SQL Editor with:');
          console.log(createTableSql);
        } else {
          console.log('Table created successfully!');
        }
      } catch (createErr) {
        console.error('Unexpected error creating table:', createErr);
        console.log('You need to create the table manually in Supabase Dashboard or SQL Editor with:');
        console.log(createTableSql);
      }
    } else if (error) {
      console.error('Error checking table:', error.message);
    } else {
      console.log('hr_learning_path_courses table already exists');
    }
  } catch (err) {
    console.error('Unexpected error checking table:', err);
  }
  
  // 4. Check if courses table has the correct columns
  console.log('\n4. Checking columns in hr_learning_path_courses table...');
  try {
    const { error } = await supabase
      .from('hr_learning_path_courses')
      .select('order')
      .limit(1);
      
    if (error && error.message.includes('does not exist')) {
      console.log('order column does not exist in hr_learning_path_courses table.');
      
      // Try with order_number instead
      try {
        const { error: orderNumError } = await supabase
          .from('hr_learning_path_courses')
          .select('order_number')
          .limit(1);
          
        if (orderNumError && orderNumError.message.includes('does not exist')) {
          console.log('order_number column does not exist either. Attempting to add it...');
          
          try {
            const { error: addColError } = await supabase.rpc('exec_sql', { 
              sql: 'ALTER TABLE hr_learning_path_courses ADD COLUMN IF NOT EXISTS order_number INTEGER DEFAULT 0;' 
            });
            
            if (addColError) {
              console.error('Error adding order_number column:', addColError.message);
              console.log('You need to add the column manually in Supabase Dashboard or SQL Editor with:');
              console.log(`
                ALTER TABLE hr_learning_path_courses 
                ADD COLUMN IF NOT EXISTS order_number INTEGER DEFAULT 0;
              `);
            } else {
              console.log('order_number column added successfully!');
            }
          } catch (addErr) {
            console.error('Unexpected error adding column:', addErr);
          }
        } else {
          console.log('order_number column exists in hr_learning_path_courses table');
        }
      } catch (checkOrderNumErr) {
        console.error('Error checking order_number column:', checkOrderNumErr);
      }
    } else if (error) {
      console.error('Error checking order column:', error.message);
    } else {
      console.log('order column exists in hr_learning_path_courses table');
    }
  } catch (err) {
    console.error('Unexpected error checking columns:', err);
  }
  
  console.log('\nSchema update process completed!');
}

function outputSqlForManualExecution() {
  console.log(`
--- Copy and paste the following into the Supabase SQL Editor ---

-- Add estimated_completion_date column to hr_learning_path_enrollments
ALTER TABLE hr_learning_path_enrollments 
ADD COLUMN IF NOT EXISTS estimated_completion_date TIMESTAMP WITH TIME ZONE;

-- Create hr_learning_path_courses table if it doesn't exist
CREATE TABLE IF NOT EXISTS hr_learning_path_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_path_id UUID NOT NULL REFERENCES hr_learning_paths(id),
  course_id UUID NOT NULL REFERENCES hr_courses(id),
  order_number INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set default values for estimated_completion_date where null
UPDATE hr_learning_path_enrollments
SET estimated_completion_date = enrollment_date + INTERVAL '60 days'
WHERE estimated_completion_date IS NULL;

-- Create learner_statistics table if it doesn't exist
CREATE TABLE IF NOT EXISTS learner_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id),
  courses_completed INTEGER DEFAULT 0,
  learning_paths_completed INTEGER DEFAULT 0,
  assigned_courses INTEGER DEFAULT 0,
  skills_acquired INTEGER DEFAULT 0,
  total_time_spent INTEGER DEFAULT 0,
  average_score NUMERIC(5,2) DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create learner_dashboard_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS learner_dashboard_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES hr_employees(id),
  preferences JSONB DEFAULT '{"preferred_learning_style": "visual", "preferred_content_types": ["video", "interactive"], "learning_goals": ["Improve technical skills", "Develop leadership abilities"]}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
`);
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 