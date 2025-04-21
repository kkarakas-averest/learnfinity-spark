
/**
 * Development startup script
 * Runs both Vite dev server and Express API server concurrently
 */

const { spawn } = require('child_process');
const path = require('path');

// Define colors for console output
const colors = {
  vite: '\x1b[36m', // Cyan
  api: '\x1b[35m',  // Magenta
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',  // Reset
};

console.log(`${colors.reset}Starting development environment...`);

// Start Vite dev server
const viteProcess = spawn('npx', ['vite'], {
  stdio: 'pipe',
  shell: true
});

console.log(`${colors.vite}[VITE] Starting dev server...${colors.reset}`);

viteProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  console.log(`${colors.vite}[VITE] ${output}${colors.reset}`);
});

viteProcess.stderr.on('data', (data) => {
  const output = data.toString().trim();
  console.log(`${colors.error}[VITE ERROR] ${output}${colors.reset}`);
});

// Start API server
const apiProcess = spawn('node', ['api-server-cors-fix.js'], {
  stdio: 'pipe',
  shell: true
});

console.log(`${colors.api}[API] Starting API server...${colors.reset}`);

apiProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  console.log(`${colors.api}[API] ${output}${colors.reset}`);
});

apiProcess.stderr.on('data', (data) => {
  const output = data.toString().trim();
  console.log(`${colors.error}[API ERROR] ${output}${colors.reset}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down development servers...');
  viteProcess.kill();
  apiProcess.kill();
  process.exit();
});

// Handle child process exits
viteProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`${colors.error}[VITE] Process exited with code ${code}${colors.reset}`);
  }
});

apiProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.log(`${colors.error}[API] Process exited with code ${code}${colors.reset}`);
  }
});

console.log(`\n${colors.reset}Development environment started!`);
console.log(`- Vite dev server: http://localhost:8080`);
console.log(`- API server: http://localhost:3084/api/debug-api-health`);
console.log(`Press Ctrl+C to stop both servers.\n`);
