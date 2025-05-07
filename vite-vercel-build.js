// vite-vercel-build.js
// Special build script for Vercel deployment of Vite apps
// This ensures proper static file handling and client-side routing

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Print environment information for debugging
console.log('🔍 Build Environment:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- VERCEL: ${process.env.VERCEL}`);
console.log(`- VERCEL_ENV: ${process.env.VERCEL_ENV}`);

// Log the start of the build process
console.log('🚀 Starting Vite build for Vercel deployment...');

// Check if critical environment variables exist
const criticalVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'GROQ_API_KEY'
];

console.log('🔑 Checking environment variables:');
criticalVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`- ${varName}: ${varName.includes('KEY') ? '✅ Defined' : process.env[varName]}`);
  } else {
    console.log(`- ${varName}: ❌ Missing`);
  }
});

// Run the Vite build command
try {
  console.log('📦 Building Vite application...');
  execSync('npx vite build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}

// Generate diagnostic files
try {
  console.log('🔍 Generating diagnostic files...');
  execSync('node scripts/create-diagnostics.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to generate diagnostic files:', error);
  // Continue with build even if diagnostics fail
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

// Create a config file to indicate Vite deployment for diagnostic purposes
// NOTE: We no longer create a duplicate vercel.json file to avoid conflicts
const viteConfigPath = path.join(process.cwd(), 'dist', 'vite-config.json');
const viteConfigContent = {
  "build": "vite",
  "framework": "vite+react",
  "timestamp": new Date().toISOString(),
  "env": process.env.NODE_ENV || 'production'
};

try {
  console.log('📄 Creating Vite deployment indicator...');
  fs.writeFileSync(viteConfigPath, JSON.stringify(viteConfigContent, null, 2));
  console.log('✅ Created vite-config.json file for diagnostics');
} catch (error) {
  console.error('❌ Failed to create vite-config.json file:', error);
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

// Create an index.html file in the public directory as a fallback
const publicIndexPath = path.join(publicDirPath, 'index.html');
if (!fs.existsSync(publicIndexPath)) {
  try {
    // Copy the main index.html to public/index.html as a fallback
    fs.copyFileSync(
      path.join(process.cwd(), 'dist', 'index.html'),
      publicIndexPath
    );
    console.log('📄 Created fallback index.html in public directory');
  } catch (error) {
    console.error('❌ Failed to create fallback index.html:', error);
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
      environment: process.env.NODE_ENV || 'production',
      vercel: process.env.VERCEL === '1',
      vercelEnv: process.env.VERCEL_ENV || 'unknown'
    }, null, 2)
  );
  console.log('✅ Created verification file');
} catch (error) {
  console.error('❌ Failed to create verification file:', error);
}

// List all files in the dist directory to verify output
try {
  console.log('\n📂 Files in dist directory:');
  const distFiles = fs.readdirSync(path.join(process.cwd(), 'dist'));
  distFiles.forEach(file => {
    console.log(`- ${file}`);
  });
  
  // Check if assets directory exists and list its contents
  const assetsPath = path.join(process.cwd(), 'dist', 'assets');
  if (fs.existsSync(assetsPath)) {
    console.log('\n📂 Files in assets directory:');
    const assetFiles = fs.readdirSync(assetsPath);
    assetFiles.forEach(file => {
      console.log(`- ${file}`);
    });
  }
} catch (error) {
  console.error('❌ Error listing dist files:', error);
}

console.log('✅ Vite-Vercel build completed successfully!'); 