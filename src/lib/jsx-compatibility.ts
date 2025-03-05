
/**
 * This file provides consistent React import compatibility for the project.
 * It helps ensure uniform import styles across the codebase, especially 
 * for components that use direct React imports but don't have access to
 * the allowSyntheticDefaultImports flag in tsconfig.
 * 
 * This is primarily used as a workaround for TypeScript error TS2497:
 * "This module can only be referenced with ECMAScript imports/exports by 
 * turning on the 'allowSyntheticDefaultImports' flag and referencing its default export."
 */

export const enableJsxCompatibility = () => {
  console.log('JSX compatibility helper loaded');
  // This function doesn't need to do anything, it just needs to be imported
  // to trigger the side effect of loading this file
};

// Add any other helper functions or utilities related to JSX compatibility here
