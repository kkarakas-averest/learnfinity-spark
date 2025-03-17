// Test Supabase connection
import { createClient } from '@supabase/supabase-js';

// Copy your project URL and API key directly from the .env file
const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';

// Try with anon key first
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2ODA4MzIsImV4cCI6MjA1NjI1NjgzMn0.ed-wciIqkubS4f2T3UNnkgqwzLEdpC-SVZoVsP7-W1E';

// Initialize Supabase client with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Also try with service role key
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqbHF6a2trZmF0ZWh4ZXF0YmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDY4MDgzMiwiZXhwIjoyMDU2MjU2ODMyfQ.SJDXu5mQ9mLxm-4dESG86JJ6rJQxe2p8RLRJp4ZTp5s';

// Initialize Supabase admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Testing Supabase connection...');
  
  // Test with anon key
  console.log('Testing with anon key:');
  try {
    const { data: departments, error } = await supabase
      .from('hr_departments')
      .select('*')
      .limit(5);
      
    if (error) {
      console.error('Error with anon key:', error);
    } else {
      console.log('Success with anon key!');
      console.log(departments);
    }
  } catch (err) {
    console.error('Exception with anon key:', err);
  }
  
  // Test with service role key
  console.log('\nTesting with service role key:');
  try {
    const { data: departments, error } = await supabaseAdmin
      .from('hr_departments')
      .select('*')
      .limit(5);
      
    if (error) {
      console.error('Error with service role key:', error);
    } else {
      console.log('Success with service role key!');
      console.log(departments);
    }
  } catch (err) {
    console.error('Exception with service role key:', err);
  }
}

main().catch(console.error); 