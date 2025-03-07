/**
 * Authentication Migration Script
 * 
 * This script helps migrate users from the workaround authentication system
 * to the proper Supabase authentication system.
 * 
 * Usage:
 * node auth-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');
const readline = require('readline');
const path = require('path');

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create readline interface for user prompts
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function migrateUsers() {
  try {
    console.log('🔄 Starting authentication migration...');
    
    // Load the auth mappings file from the backup directory
    const mappingsPath = path.join('./auth-backup', 'auth-mappings.json');
    let authMappings;
    try {
      const mappingsFile = fs.readFileSync(mappingsPath, 'utf8');
      authMappings = JSON.parse(mappingsFile);
    } catch (error) {
      console.error('❌ Error loading auth mappings:', error);
      console.log(`No mappings found or invalid file format at ${mappingsPath}. Exiting.`);
      return;
    }
    
    if (!authMappings.mappings || !Array.isArray(authMappings.mappings) || authMappings.mappings.length === 0) {
      console.log('No users to migrate. Exiting.');
      return;
    }
    
    console.log(`Found ${authMappings.mappings.length} users to migrate.`);
    
    // Ask for confirmation
    const confirm = await promptUser('Do you want to proceed with migration? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Migration cancelled.');
      return;
    }
    
    // Process each user mapping
    const results = {
      success: 0,
      failed: 0,
      details: []
    };
    
    for (const mapping of authMappings.mappings) {
      console.log(`\nProcessing user: ${mapping.originalEmail}`);
      
      try {
        // Check if user already exists in auth
        const { data: existingUsers, error: checkError } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', mapping.originalEmail);
        
        if (checkError) {
          throw new Error(`Error checking existing user: ${checkError.message}`);
        }
        
        if (existingUsers && existingUsers.length > 0) {
          console.log(`User ${mapping.originalEmail} already exists in the database.`);
          
          // Ask if user wants to reset password
          const resetPw = await promptUser('Do you want to reset this user\'s password? (yes/no): ');
          
          if (resetPw.toLowerCase() === 'yes') {
            const newPassword = await promptUser('Enter new password (min 6 characters): ');
            
            if (newPassword.length < 6) {
              throw new Error('Password must be at least 6 characters.');
            }
            
            // Update password in auth
            const { error: resetError } = await supabase.auth.admin.updateUserById(
              existingUsers[0].id,
              { password: newPassword }
            );
            
            if (resetError) {
              throw new Error(`Failed to reset password: ${resetError.message}`);
            }
            
            console.log('✅ Password reset successfully.');
          }
          
          results.success++;
          results.details.push({
            email: mapping.originalEmail,
            status: 'already_exists',
            passwordReset: resetPw.toLowerCase() === 'yes'
          });
          continue;
        }
        
        // Create new user with original details
        const password = await promptUser(`Enter password for ${mapping.originalEmail} (min 6 characters): `);
        
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters.');
        }
        
        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: mapping.originalEmail,
          password: password,
          email_confirm: true,
          user_metadata: {
            name: mapping.originalName,
            role: mapping.originalRole
          }
        });
        
        if (authError) {
          throw new Error(`Failed to create auth user: ${authError.message}`);
        }
        
        // Create user profile
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            name: mapping.originalName,
            email: mapping.originalEmail,
            role: mapping.originalRole
          });
        
        if (insertError) {
          throw new Error(`Failed to create user profile: ${insertError.message}`);
        }
        
        console.log(`✅ Successfully migrated user: ${mapping.originalEmail}`);
        results.success++;
        results.details.push({
          email: mapping.originalEmail,
          status: 'migrated',
          auth_id: authData.user.id
        });
      } catch (error) {
        console.error(`❌ Error processing user ${mapping.originalEmail}:`, error.message);
        results.failed++;
        results.details.push({
          email: mapping.originalEmail,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    // Log summary
    console.log('\n====== Migration Summary ======');
    console.log(`Total users processed: ${authMappings.mappings.length}`);
    console.log(`Successful: ${results.success}`);
    console.log(`Failed: ${results.failed}`);
    
    // Save results to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(
      `migration-results-${timestamp}.json`,
      JSON.stringify(results, null, 2)
    );
    
    console.log(`\nDetailed results saved to migration-results-${timestamp}.json`);
    console.log('\n✅ Migration complete!');
    
    // We don't need to rename the original mappings file since it's already in the backup directory
    
  } catch (error) {
    console.error('❌ Migration failed with error:', error);
  } finally {
    rl.close();
  }
}

migrateUsers(); 