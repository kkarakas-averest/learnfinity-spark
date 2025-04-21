
/**
 * This file provides centralized JSX runtime exports to ensure
 * consistent JSX rendering across the application.
 * 
 * This is useful for applications that might have mixed import styles
 * or TypeScript configurations.
 */

// Re-export the JSX runtime from React
export * from 'react/jsx-runtime';

// Export the development JSX runtime
export * from 'react/jsx-dev-runtime';

// Log when this module is first imported
console.log('JSX runtime compatibility layer loaded');
