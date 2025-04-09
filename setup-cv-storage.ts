/* eslint-disable no-console */
import { setupCvStorageStructure } from './src/utils/createCvStorageStructure';

/**
 * Script to set up the CV storage structure in Supabase
 */
(async function main() {
  console.log('Setting up CV storage structure...');
  
  try {
    const result = await setupCvStorageStructure();
    
    if (result.success) {
      console.log('✅ CV storage structure set up successfully!');
      process.exit(0);
    } else {
      console.error('❌ Failed to set up CV storage structure:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unhandled exception:', error);
    process.exit(1);
  }
})(); 