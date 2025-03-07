// Script to implement a workaround for user authentication issues
// by temporarily mapping problem users to a working test user
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

const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';

if (!supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_ANON_KEY not found in .env.local');
  process.exit(1);
}

// Create a Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Default test user that works
const TEST_USER_EMAIL = 'test1740997540466@example.com';
const TEST_USER_PASSWORD = 'Test123!';

// Function to check if a user exists in the database
const checkUserInDatabase = async (email) => {
  try {
    console.log(`Checking if user exists in database: ${email}`);
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, password, created_at')
      .eq('email', email)
      .single();
    
    if (error) {
      if (error.message.includes('No rows found')) {
        return { exists: false };
      }
      console.error('Error checking user in database:', error);
      return { exists: false, error };
    }
    
    console.log('User found in database:', data);
    return { exists: true, user: data };
  } catch (error) {
    console.error('Error checking user in database:', error);
    return { exists: false, error };
  }
};

// Function to update the database user to map to test user
const updateUserToMapToTestUser = async (problemEmail, testEmail) => {
  try {
    console.log(`Updating user ${problemEmail} to map to test user ${testEmail}`);
    
    // First, get the test user from auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: TEST_USER_PASSWORD
    });
    
    if (authError) {
      console.error('Error signing in with test user:', authError);
      return { success: false, error: authError };
    }
    
    const testUserId = authData.user.id;
    console.log(`Test user auth ID: ${testUserId}`);
    
    // Next, check if the test user exists in the database
    const testUserDb = await checkUserInDatabase(testEmail);
    
    if (!testUserDb.exists) {
      console.error('Test user not found in database');
      return { success: false, error: 'Test user not found in database' };
    }
    
    // Now update the problem user in the database with new fields
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({
        auth_id: testUserId,       // Field to store the auth ID for login
        test_user_email: testEmail // Field to mark this as using a test user
      })
      .eq('email', problemEmail);
    
    if (updateError) {
      console.error('Error updating user in database:', updateError);
      return { success: false, error: updateError };
    }
    
    console.log('✅ User updated to map to test user');
    return { success: true };
  } catch (error) {
    console.error('Error mapping user to test user:', error);
    return { success: false, error };
  }
};

// Function to create auth_id and test_user_email columns if they don't exist
const ensureColumnsExist = async () => {
  try {
    console.log('Checking if required columns exist in the users table...');
    
    // First, let's check the schema
    const { data: schemaData, error: schemaError } = await supabase.rpc('get_table_ddl', {
      table_name: 'users'
    });
    
    if (schemaError) {
      console.error('Error getting schema:', schemaError);
      
      // Let's try an alternative approach - querying a user and checking columns
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (userError) {
        console.error('Error querying users table:', userError);
        return { success: false, error: userError };
      }
      
      const hasAuthId = userData.length > 0 && 'auth_id' in userData[0];
      const hasTestUserEmail = userData.length > 0 && 'test_user_email' in userData[0];
      
      if (!hasAuthId) {
        console.log('Adding auth_id column to users table...');
        
        const { error: addAuthIdError } = await supabase.rpc('add_column_if_not_exists', {
          table_name: 'users',
          column_name: 'auth_id',
          column_type: 'uuid'
        });
        
        if (addAuthIdError) {
          console.error('Error adding auth_id column:', addAuthIdError);
          return { success: false, error: addAuthIdError };
        }
      }
      
      if (!hasTestUserEmail) {
        console.log('Adding test_user_email column to users table...');
        
        const { error: addTestUserEmailError } = await supabase.rpc('add_column_if_not_exists', {
          table_name: 'users',
          column_name: 'test_user_email',
          column_type: 'text'
        });
        
        if (addTestUserEmailError) {
          console.error('Error adding test_user_email column:', addTestUserEmailError);
          return { success: false, error: addTestUserEmailError };
        }
      }
      
      return { success: true, created: !hasAuthId || !hasTestUserEmail };
    }
    
    // Parse the schema to check if columns exist
    const schemaString = schemaData || '';
    const hasAuthId = schemaString.includes('auth_id');
    const hasTestUserEmail = schemaString.includes('test_user_email');
    
    if (!hasAuthId || !hasTestUserEmail) {
      console.log('Adding required columns to users table...');
      
      // Create a SQL function to add columns if they don't exist
      const addColumnsSQL = `
        CREATE OR REPLACE FUNCTION add_column_if_not_exists(
          table_name text,
          column_name text,
          column_type text
        ) RETURNS void AS $$
        BEGIN
          IF NOT EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = add_column_if_not_exists.table_name
            AND column_name = add_column_if_not_exists.column_name
          ) THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', 
                          table_name, column_name, column_type);
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `;
      
      const { error: functionError } = await supabase.rpc('run_sql', {
        sql: addColumnsSQL
      });
      
      if (functionError) {
        console.error('Error creating SQL function:', functionError);
        return { success: false, error: functionError };
      }
      
      if (!hasAuthId) {
        console.log('Adding auth_id column...');
        
        const { error: authIdError } = await supabase.rpc('run_sql', {
          sql: "SELECT add_column_if_not_exists('users', 'auth_id', 'uuid');"
        });
        
        if (authIdError) {
          console.error('Error adding auth_id column:', authIdError);
          return { success: false, error: authIdError };
        }
      }
      
      if (!hasTestUserEmail) {
        console.log('Adding test_user_email column...');
        
        const { error: testUserEmailError } = await supabase.rpc('run_sql', {
          sql: "SELECT add_column_if_not_exists('users', 'test_user_email', 'text');"
        });
        
        if (testUserEmailError) {
          console.error('Error adding test_user_email column:', testUserEmailError);
          return { success: false, error: testUserEmailError };
        }
      }
      
      return { success: true, created: true };
    }
    
    console.log('Required columns already exist in the users table');
    return { success: true, created: false };
  } catch (error) {
    console.error('Error ensuring columns exist:', error);
    return { success: false, error };
  }
};

// Main function
const main = async () => {
  // Get problematic user email from command line
  const problemEmail = process.argv[2] || 'kkarakas@averesttraining.com';
  const testEmail = process.argv[3] || TEST_USER_EMAIL;
  const skipColumnCheck = process.argv.includes('--skip-column-check');
  
  console.log('=== AUTHENTICATION WORKAROUND UTILITY ===');
  console.log(`Problem user email: ${problemEmail}`);
  console.log(`Test user email: ${testEmail}\n`);
  
  // First, check if the problematic user exists
  const userCheck = await checkUserInDatabase(problemEmail);
  
  if (!userCheck.exists) {
    console.error(`❌ Problem user not found in database: ${problemEmail}`);
    console.error('Cannot proceed without a valid user record.');
    process.exit(1);
  }
  
  console.log(`✅ Problem user found: ${problemEmail}`);
  
  // Check if the test user exists and is working
  console.log(`\nVerifying test user: ${testEmail}`);
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: TEST_USER_PASSWORD
  });
  
  if (authError) {
    console.error(`❌ Test user authentication failed: ${testEmail}`);
    console.error('Error:', authError.message);
    process.exit(1);
  }
  
  console.log(`✅ Test user authentication successful: ${testEmail}`);
  
  // If we need to add columns for the workaround
  if (!skipColumnCheck) {
    console.log('\nChecking and creating required database columns...');
    
    const columnsResult = await ensureColumnsExist();
    
    if (!columnsResult.success) {
      console.error('❌ Failed to ensure required columns exist');
      console.error('Error:', columnsResult.error);
      console.log('\nYou can try running with --skip-column-check if columns already exist.');
      process.exit(1);
    }
    
    if (columnsResult.created) {
      console.log('✅ Required columns added to the database');
    } else {
      console.log('✅ Required columns already exist');
    }
  }
  
  // Update the problematic user to use the test user auth
  console.log(`\nUpdating user ${problemEmail} to use test user authentication...`);
  
  const updateResult = await updateUserToMapToTestUser(problemEmail, testEmail);
  
  if (!updateResult.success) {
    console.error('❌ Failed to update user');
    console.error('Error:', updateResult.error);
    process.exit(1);
  }
  
  console.log(`\n✅ WORKAROUND IMPLEMENTED SUCCESSFULLY!`);
  console.log('\nThe problem user can now be authenticated using:');
  console.log(`Email: ${testEmail}`);
  console.log(`Password: ${TEST_USER_PASSWORD}`);
  console.log('\nIn your application code, you can use the auth_id and test_user_email fields to map');
  console.log('the authenticated test user back to the original user for API operations.');
};

// Run the main function
main(); 