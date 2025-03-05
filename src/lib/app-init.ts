
/**
 * This file contains application initialization code that's executed
 * before the main application starts.
 */

import { enableJsxCompatibility } from './jsx-compatibility';

// Initialize all configuration and helpers
export function initializeApp() {
  // Enable JSX compatibility helpers
  enableJsxCompatibility();
  
  console.log('Application initialization complete');
}
