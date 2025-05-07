// scripts/create-diagnostics.js
// This script generates diagnostic HTML files for Vercel debugging
// It should be called during the build process

import fs from 'fs';
import path from 'path';

// Make sure this script runs in the correct directory
const workingDir = process.cwd();
const distDir = path.join(workingDir, 'dist');

console.log('🔍 Creating diagnostic files in', distDir);

// Create the dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Test HTML file for static routing debugging
const testHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vercel Static Test</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: #f7f7f7;
    }
    
    .container {
      max-width: 600px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    h1 {
      color: #0070f3;
    }
    
    .status {
      margin: 20px 0;
      padding: 10px;
      background: #d4edda;
      color: #155724;
      border-radius: 4px;
      font-weight: bold;
    }
    
    .info {
      background: #e7f5ff;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    
    button {
      background: #0070f3;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      margin-top: 10px;
    }
    
    button:hover {
      background: #005cc5;
    }
    
    .diagnostic {
      margin-top: 20px;
      font-family: monospace;
      background: #f1f1f1;
      padding: 15px;
      border-radius: 4px;
      width: 100%;
      overflow: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Vercel Static File Test</h1>
    
    <div class="status">
      ✅ Static file serving is working!
    </div>
    
    <div class="info">
      <p>This is a simple test file to verify that Vercel is correctly serving static files from the <code>dist</code> directory.</p>
      <p>If you're seeing this page, it means static file serving is working, but there might be issues with the main application.</p>
    </div>
    
    <button id="check-api">Check API Endpoint</button>
    <div id="api-result" class="diagnostic">API check result will appear here...</div>
    
    <h2>Next Steps</h2>
    <ol>
      <li>Verify your <code>vercel.json</code> configuration</li>
      <li>Check that the main <code>index.html</code> file exists in the correct location</li>
      <li>Try the <a href="/api/debug-env?key=debug-env-check">/api/debug-env</a> endpoint directly</li>
      <li>Review the Vercel deployment logs for any build errors</li>
    </ol>
  </div>
  
  <script>
    document.getElementById('check-api').addEventListener('click', async () => {
      const resultEl = document.getElementById('api-result');
      resultEl.textContent = 'Testing API connection...';
      
      try {
        const response = await fetch('/api/debug-env?key=debug-env-check');
        
        if (!response.ok) {
          throw new Error(\`API request failed with status \${response.status}\`);
        }
        
        const data = await response.json();
        resultEl.textContent = \`✅ API working! Response: \${JSON.stringify(data, null, 2)}\`;
        resultEl.style.background = '#d4edda';
      } catch (error) {
        resultEl.textContent = \`❌ API error: \${error.message}\`;
        resultEl.style.background = '#f8d7da';
        console.error('API check error:', error);
      }
    });
  </script>
</body>
</html>`;

// Debug index HTML file
const debugIndexHtmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Debug Test Page</title>
  <style>
    body {
      font-family: sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      text-align: center;
    }
    .success { color: green; }
    .card {
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>Vercel Debug Test Page</h1>
  
  <div class="card">
    <h2 class="success">If you can see this, static file serving is working correctly</h2>
    <p>This is a minimal test page to verify that Vercel is serving static files.</p>
    <p>Try checking the browser console for any JavaScript errors.</p>
    <p>API Status: <span id="api-status">Checking...</span></p>
  </div>
  
  <script>
    // Simple test to check if API endpoints are working
    fetch('/api/debug-env?key=debug-env-check')
      .then(response => {
        if (!response.ok) throw new Error('API request failed');
        return response.json();
      })
      .then(data => {
        document.getElementById('api-status').textContent = 'Working ✓';
        document.getElementById('api-status').style.color = 'green';
        console.log('API response:', data);
      })
      .catch(error => {
        document.getElementById('api-status').textContent = 'Failed ✗';
        document.getElementById('api-status').style.color = 'red';
        console.error('API error:', error);
      });
  </script>
</body>
</html>`;

// Create dist/test.html
try {
  fs.writeFileSync(path.join(distDir, 'test.html'), testHtmlContent);
  console.log('✅ Created dist/test.html');
} catch (error) {
  console.error('❌ Failed to create dist/test.html:', error);
}

// Create dist/index.html.debug
try {
  fs.writeFileSync(path.join(distDir, 'index.html.debug'), debugIndexHtmlContent);
  console.log('✅ Created dist/index.html.debug');
} catch (error) {
  console.error('❌ Failed to create dist/index.html.debug:', error);
}

// Create a public directory within dist if needed (will be copied to output)
const distPublicDir = path.join(distDir, 'public');
if (!fs.existsSync(distPublicDir)) {
  fs.mkdirSync(distPublicDir, { recursive: true });
}

// Make sure index.html is also in the public directory as a fallback
try {
  // Copy the existing index.html if it exists, otherwise use a fallback
  const indexHtmlPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    fs.copyFileSync(indexHtmlPath, path.join(distPublicDir, 'index.html'));
  } else {
    // Create a minimal index.html if the original doesn't exist yet
    fs.writeFileSync(path.join(distPublicDir, 'index.html'), `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fallback Page</title>
</head>
<body>
  <h1>This is a fallback page</h1>
  <p>The main application should be at the root URL.</p>
</body>
</html>`);
  }
  console.log('✅ Ensured index.html exists in public directory');
} catch (error) {
  console.error('❌ Failed to handle public/index.html:', error);
}

console.log('✅ All diagnostic files created successfully.'); 