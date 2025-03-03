// Script to create a test user with proper database schema
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

// Examine the schema of the users table
const examineSchema = async () => {
  try {
    console.log('Examining schema of the users table...');
    
    // Just get one row to see the schema
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error fetching user:', error);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log('Schema of users table:');
      console.log(Object.keys(data[0]));
      return Object.keys(data[0]);
    } else {
      console.log('No users found to examine schema');
      return false;
    }
  } catch (error) {
    console.error('Error examining schema:', error);
    return false;
  }
};

// Create a test user in Auth
const createUserInAuth = async (email, password) => {
  try {
    console.log(`Creating user in Auth: ${email}`);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: 'Test User',
          role: 'learner'
        }
      }
    });
    
    if (error) {
      console.error('Error creating user in Auth:', error);
      return { success: false, error };
    }
    
    console.log('✅ User created in Auth system');
    return { success: true, data };
  } catch (error) {
    console.error('Error creating user in Auth:', error);
    return { success: false, error };
  }
};

// Create a user in the database
const createUserInDatabase = async (authUserId, email, schema) => {
  try {
    console.log(`Creating user in database: ${email}`);
    
    // Create a proper user object based on the schema
    const user = {
      id: authUserId,
      email,
      name: 'Test User',
      role: 'learner',
    };
    
    // Add password field if required by schema
    if (schema.includes('password')) {
      user.password = 'hashed_password_placeholder'; // In a real app, this would be hashed
    }
    
    // Add created_at field if required
    if (schema.includes('created_at')) {
      user.created_at = new Date().toISOString();
    }
    
    // Add any other required fields from schema
    
    console.log('User object to insert:', user);
    
    const { data, error } = await supabase
      .from('users')
      .insert([user]);
    
    if (error) {
      console.error('Error creating user in database:', error);
      return { success: false, error };
    }
    
    console.log('✅ User created in database');
    return { success: true };
  } catch (error) {
    console.error('Error creating user in database:', error);
    return { success: false, error };
  }
};

// Test authentication
const testAuthentication = async (email, password) => {
  try {
    console.log(`Testing authentication for: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Authentication failed:', error);
      return { success: false, error };
    }
    
    console.log('✅ Authentication successful!');
    console.log('User data:', data.user);
    return { success: true, data };
  } catch (error) {
    console.error('Error during authentication test:', error);
    return { success: false, error };
  }
};

// Main function
const main = async () => {
  // Get email and password from command line or use defaults
  const testEmail = process.argv[2] || `test${Date.now()}@example.com`;
  const testPassword = process.argv[3] || 'Test123!';
  
  console.log('=== TEST USER CREATION UTILITY ===');
  console.log(`Test email: ${testEmail}`);
  
  // 1. Examine schema
  const schema = await examineSchema();
  
  if (!schema) {
    console.log('❌ Could not determine schema, aborting');
    process.exit(1);
  }
  
  // 2. Create user in Auth
  const authResult = await createUserInAuth(testEmail, testPassword);
  
  if (!authResult.success) {
    console.log('❌ Failed to create user in Auth, aborting');
    process.exit(1);
  }
  
  const authUserId = authResult.data.user.id;
  console.log(`Auth user ID: ${authUserId}`);
  
  // 3. Create user in database
  const dbResult = await createUserInDatabase(authUserId, testEmail, schema);
  
  if (!dbResult.success) {
    console.log('❌ Failed to create user in database');
    console.log('Warning: Auth user was created but database user was not');
    process.exit(1);
  }
  
  // 4. Test authentication
  const authTest = await testAuthentication(testEmail, testPassword);
  
  if (authTest.success) {
    console.log('\n✅ TEST USER CREATED SUCCESSFULLY!');
    console.log('\nLogin credentials:');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
  } else {
    console.log('\n⚠️ Test user created but authentication not working yet.');
    console.log('You may need to confirm the email first.');
    console.log('\nLogin credentials after confirmation:');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}`);
  }
};

// Run the main function
main(); 