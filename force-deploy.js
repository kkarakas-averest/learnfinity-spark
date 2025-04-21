import fs from 'fs';
import { execSync } from 'child_process';

// Read the current vercel.json
const vercelJson = JSON.parse(fs.readFileSync('./vercel.json', 'utf-8'));

// Update the timestamp with current date and time
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
vercelJson.env.DEPLOYMENT_TIMESTAMP = timestamp;

// Write the updated vercel.json back to disk
fs.writeFileSync('./vercel.json', JSON.stringify(vercelJson, null, 2));

// Stage, commit, and push the changes
try {
  console.log('Committing new vercel.json with timestamp:', timestamp);
  execSync('git add vercel.json');
  execSync(`git commit -m "Force deployment: update timestamp to ${timestamp}"`);
  execSync('git push');
  console.log('Successfully pushed changes to trigger deployment');
} catch (error) {
  console.error('Error pushing changes:', error.message);
  process.exit(1);
} 