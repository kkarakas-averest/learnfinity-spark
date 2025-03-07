// Script to fix authentication issues by syncing users in the application DB with Supabase auth
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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

// Create a service role key for admin operations
// Note: This won't work with the anon key - for actual implementation, 
// you'd need a service role key with higher privileges
const supabaseUrl = 'https://ujlqzkkkfatehxeqtbdl.supabase.co';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Password generator
const generateSecurePassword = () => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};

// Create a fixed password for the specific user we're fixing
const FIXED_PASSWORD = 'Supabase123!';

// Function to fix a specific user
const fixUserAuth = async (email) => {
  try {
    console.log(`Fixing auth for user: ${email}`);
    
    // Step 1: Check if user exists in the application database
    const { data: userTableData, error: userTableError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', email)
      .single();
    
    if (userTableError || !userTableData) {
      console.error('Error: User not found in application database:', userTableError);
      return { success: false, error: 'User not found in application database' };
    }
    
    console.log('Found user in application database:', userTableData);
    
    // Step 2: Try to create auth user using the admin API
    // Note: This requires admin/service role key, not anon key
    try {
      // We'll use RPC calls that should be available if the app has admin functions
      const { data: adminCreateResult, error: adminCreateError } = await supabase
        .rpc('admin_create_user', { 
          email_param: email,
          password_param: FIXED_PASSWORD,
          user_data: { name: userTableData.name, role: userTableData.role }
        });
      
      if (adminCreateError) {
        console.log('Admin API not available or failed:', adminCreateError);
        // Fall back to direct auth API which may have limited privileges
      } else {
        console.log('User created successfully via admin API');
        return { 
          success: true, 
          message: 'User created successfully via admin API', 
          password: FIXED_PASSWORD 
        };
      }
    } catch (adminError) {
      console.log('Admin API error:', adminError);
      // Continue to fallback approach
    }
    
    // Step 3: Fallback - Try to use the auth API directly (with limited privileges)
    try {
      // Try direct sign-up approach (may not work with anon key)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: FIXED_PASSWORD,
        options: {
          data: {
            name: userTableData.name,
            role: userTableData.role,
            user_id: userTableData.id
          }
        }
      });
      
      if (authError) {
        console.error('Error creating auth user:', authError);
        return { success: false, error: authError };
      }
      
      console.log('Auth user created successfully');
      
      // If we get here, auth user was created successfully
      return { 
        success: true, 
        message: 'User created successfully', 
        password: FIXED_PASSWORD 
      };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { success: false, error };
    }
  } catch (error) {
    console.error('Error fixing user:', error);
    return { success: false, error };
  }
};

// Function to create database triggers and functions for auto-syncing
const setupDatabaseTriggers = async () => {
  try {
    console.log('Setting up database triggers for auto-syncing users...');
    
    // This is just informational since we can't actually run these operations with anon key
    console.log(`
    WARNING: Setting up database triggers requires superuser access to the database.
    The following SQL would need to be executed by a database administrator:

    -- Create a function to sync users to auth
    CREATE OR REPLACE FUNCTION sync_user_to_auth()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Add logic to sync the user to auth.users
      -- This would require using Supabase's auth.users table or APIs
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create a trigger to call the function on insert/update
    CREATE TRIGGER user_sync_trigger
    AFTER INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_to_auth();
    `);
    
    return { 
      success: false, 
      message: 'Database triggers setup requires database administrator access' 
    };
  } catch (error) {
    console.error('Error setting up database triggers:', error);
    return { success: false, error };
  }
};

// Main function to fix auth issues
const fixAuthIssues = async () => {
  // Get email from command line argument or use default
  const email = process.argv[2] || 'kkarakass@averesttraining.com';
  
  console.log('Running auth fix script...');
  
  // 1. Fix specific user
  const userResult = await fixUserAuth(email);
  console.log('\nUser fix result:', userResult);
  
  if (userResult.success) {
    console.log('\n==========================================================');
    console.log(`✅ SUCCESS! User ${email} has been fixed.`);
    console.log(`👉 You can now login with:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${userResult.password}`);
    console.log('==========================================================\n');
  } else {
    console.log('\n==========================================================');
    console.log(`❌ FAILED to fix user ${email}.`);
    console.log(`Please try alternative approaches such as using Supabase dashboard.`);
    console.log('==========================================================\n');
  }
  
  // 2. Setup database triggers for future sync (informational only)
  console.log('\nAttempting to setup database triggers...');
  const triggerResult = await setupDatabaseTriggers();
  console.log('Database trigger setup result:', triggerResult);
};

// Run the fix script
fixAuthIssues(); 