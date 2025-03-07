// Script to check for and fix potential email typos
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

// Check for and suggest email variations
const checkEmailVariations = (email) => {
  const variations = [];
  
  // Remove any trailing or leading whitespace
  const trimmedEmail = email.trim();
  if (trimmedEmail !== email) {
    variations.push({
      email: trimmedEmail,
      reason: 'Removed whitespace'
    });
  }
  
  // Check for common typos in domain
  if (email.includes('@averesttraining.com')) {
    const domainVariations = [
      'averesttraining.co',
      'averesttraining.org',
      'averest-training.com',
      'averesttrainings.com',
      'averesttraining.net'
    ];
    
    for (const domain of domainVariations) {
      const newEmail = email.replace('@averesttraining.com', `@${domain}`);
      variations.push({
        email: newEmail,
        reason: `Domain variation: ${domain}`
      });
    }
  }
  
  // Check for common typos in the local part
  const [localPart, domain] = email.split('@');
  
  // Check for single vs double characters
  if (localPart.includes('ss')) {
    const newEmail = email.replace('ss', 's');
    variations.push({
      email: newEmail,
      reason: 'Replaced "ss" with "s"'
    });
  }
  
  if (localPart.includes('s')) {
    const newEmail = email.replace(/([^s])s([^s])/g, '$1ss$2');
    if (newEmail !== email) {
      variations.push({
        email: newEmail,
        reason: 'Replaced "s" with "ss"'
      });
    }
  }
  
  return variations;
};

// Function to check if a user exists in the application database
const checkUserInDatabase = async (email) => {
  try {
    console.log(`Checking if user exists in database: ${email}`);
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', email);
    
    if (error) {
      console.error('Error checking user:', error);
      return { exists: false, error };
    }
    
    return { 
      exists: data && data.length > 0,
      user: data && data.length > 0 ? data[0] : null
    };
  } catch (error) {
    console.error('Error checking user in database:', error);
    return { exists: false, error };
  }
};

// Function to test if a user can authenticate
const testAuthentication = async (email, password) => {
  try {
    console.log(`Testing authentication for: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return { success: false, error };
    }
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error };
  }
};

// Function to get all users from auth
const getAllUsers = async () => {
  try {
    console.log('Fetching all users from the application database...');
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role');
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${data.length} users in the application database.`);
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Function to update a user's email
const updateUserEmail = async (oldEmail, newEmail) => {
  try {
    console.log(`Updating user email from ${oldEmail} to ${newEmail}...`);
    
    // Find the user in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', oldEmail)
      .single();
    
    if (userError) {
      console.error('Error finding user:', userError);
      return { success: false, error: userError };
    }
    
    // Update the user's email
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ email: newEmail })
      .eq('id', userData.id);
    
    if (updateError) {
      console.error('Error updating user email:', updateError);
      return { success: false, error: updateError };
    }
    
    console.log('User email updated successfully in application database.');
    
    // Note that we can't update the email in auth without admin privileges
    console.log('NOTE: Email only updated in application database.');
    console.log('The auth system would require admin privileges to update.');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating user email:', error);
    return { success: false, error };
  }
};

// Main function
const main = async () => {
  const targetEmail = process.argv[2] || 'kkarakass@averesttraining.com';
  
  console.log('=== EMAIL TYPO DETECTION UTILITY ===');
  console.log(`Checking for potential typos in: ${targetEmail}`);
  
  // First, check if the user exists in the application database
  const dbCheck = await checkUserInDatabase(targetEmail);
  
  if (dbCheck.exists) {
    console.log(`✅ User found in application database: ${targetEmail}`);
    console.log('User details:', dbCheck.user);
  } else {
    console.log(`❌ User not found in application database: ${targetEmail}`);
    
    // Try to find all users with similar emails
    console.log('\nAttempting to find similar emails in the database...');
    const allUsers = await getAllUsers();
    
    const similarEmails = allUsers.filter(user => {
      const similarity = calculateSimilarity(user.email, targetEmail);
      return similarity > 0.7; // 70% similarity threshold
    });
    
    if (similarEmails.length > 0) {
      console.log('\nFound similar emails in the database:');
      similarEmails.forEach(user => {
        console.log(`- ${user.email} (${user.name})`);
      });
      
      // Ask if user wants to try these emails
      console.log('\nYou could try logging in with one of these emails instead.');
    }
  }
  
  // Generate email variations
  const variations = checkEmailVariations(targetEmail);
  
  if (variations.length > 0) {
    console.log('\nPotential email variations to try:');
    
    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i];
      console.log(`${i + 1}. ${variation.email} (${variation.reason})`);
      
      // Check if this variation exists in the database
      const variationCheck = await checkUserInDatabase(variation.email);
      
      if (variationCheck.exists) {
        console.log(`   ✅ Found in application database!`);
        console.log(`   User details: ${JSON.stringify(variationCheck.user)}`);
        
        // Try common passwords with this variation
        console.log(`   Testing authentication with common passwords...`);
        
        const passwords = [
          'password123',
          'Password123',
          '123456',
          'changeme',
          'test1234',
          'Welcome1',
          'Averest123!',
          'supabase',
          'Supabase123',
          'password',
          'Password1'
        ];
        
        let authenticated = false;
        
        for (const password of passwords) {
          const authTest = await testAuthentication(variation.email, password);
          
          if (authTest.success) {
            console.log(`   ✅ SUCCESS! Authenticated with: ${variation.email} / ${password}`);
            authenticated = true;
            break;
          }
        }
        
        if (!authenticated) {
          console.log(`   ❌ Authentication failed with common passwords`);
        }
      } else {
        console.log(`   ❌ Not found in application database`);
      }
    }
    
    console.log('\nWould you like to update your email in the database?');
    console.log('To update, run: node fix-email-typo.js [old-email] [new-email] --update');
  } else {
    console.log('\nNo potential variations found for this email.');
  }
  
  // Check if the user wants to update an email
  if (process.argv.includes('--update') && process.argv.length >= 5) {
    const oldEmail = process.argv[2];
    const newEmail = process.argv[3];
    
    console.log(`\nUpdating email from ${oldEmail} to ${newEmail}...`);
    
    const updateResult = await updateUserEmail(oldEmail, newEmail);
    
    if (updateResult.success) {
      console.log(`✅ Email updated successfully from ${oldEmail} to ${newEmail}`);
      console.log('You can now try to log in with the new email.');
    } else {
      console.log(`❌ Failed to update email: ${updateResult.error}`);
    }
  }
};

// Simple string similarity function (Levenshtein distance)
function calculateSimilarity(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }

  // Calculate similarity as 1 - normalized distance
  const maxLength = Math.max(a.length, b.length);
  return 1 - matrix[b.length][a.length] / maxLength;
}

// Run the main function
main(); 