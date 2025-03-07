// Script to check if a user exists in the Supabase users table
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseAnonKey = envContent
  .split('\n')
  .find(line => line.startsWith('VITE_SUPABASE_ANON_KEY='))
  ?.split('=')[1]
  ?.trim();

if (!supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_ANON_KEY not found in .env.local');
  process.exit(1);
}

const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const checkUser = async (email) => {
  try {
    console.log(`Checking if user exists: ${email}`);
    
    // Check users table first
    const { data: userTableData, error: userTableError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', email);
    
    if (userTableError) {
      console.error('Error querying users table:', userTableError);
    }
    
    console.log('\nUsers table results:');
    if (userTableData && userTableData.length > 0) {
      console.log(JSON.stringify(userTableData, null, 2));
    } else {
      console.log('No records found in users table');
    }
    
    // Now check auth.users
    const { data: authData, error: authError } = await supabase
      .rpc('admin_get_users');
    
    if (authError) {
      console.error('Error querying auth.users:', authError);
      console.log('Note: This requires admin privileges and may not work with anon key');
    } else {
      const matchingAuthUsers = authData?.filter(user => user.email === email);
      
      console.log('\nAuth users results:');
      if (matchingAuthUsers && matchingAuthUsers.length > 0) {
        console.log(JSON.stringify(matchingAuthUsers, null, 2));
      } else {
        console.log('No matching users found in auth.users');
      }
    }
    
  } catch (error) {
    console.error('Error checking user:', error);
  }
};

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error('Usage: node check-user-exists.js user@example.com');
  process.exit(1);
}

checkUser(email); 