// vite-vercel-build.js
// Special build script for Vercel deployment of Vite apps
// This ensures proper static file handling and client-side routing

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Log the start of the build process
console.log('🚀 Starting Vite build for Vercel deployment...');

// Run the Vite build command
try {
  console.log('📦 Building Vite application...');
  execSync('npx vite build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

// Create or update the _redirects file for SPA routing support
const redirectsPath = path.join(process.cwd(), 'dist', '_redirects');
const redirectsContent = `
# SPA fallback
/*    /index.html   200

# Keep asset paths
/assets/*  /assets/:splat  200

# API routes should go to serverless functions
/api/*  /api/:splat  200
`;

try {
  console.log('📄 Creating SPA redirect rules...');
  fs.writeFileSync(redirectsPath, redirectsContent.trim());
  console.log('✅ Created _redirects file for client-side routing');
} catch (error) {
  console.error('❌ Failed to create _redirects file:', error);
}

// Ensure the public directory exists in dist (for Vercel static file handling)
const publicDirPath = path.join(process.cwd(), 'dist', 'public');
if (!fs.existsSync(publicDirPath)) {
  try {
    fs.mkdirSync(publicDirPath, { recursive: true });
    console.log('📁 Created public directory in dist');
  } catch (error) {
    console.error('❌ Failed to create public directory:', error);
  }
}

// Add an additional verification file to detect if the build completed successfully
const verificationPath = path.join(process.cwd(), 'dist', 'vercel-vite-build.json');
try {
  fs.writeFileSync(
    verificationPath,
    JSON.stringify({
      built: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production'
    }, null, 2)
  );
  console.log('✅ Created verification file');
} catch (error) {
  console.error('❌ Failed to create verification file:', error);
}

console.log('✅ Vite-Vercel build completed successfully!'); 