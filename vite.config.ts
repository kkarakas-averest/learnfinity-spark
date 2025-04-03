import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    historyApiFallback: true,
    headers: {
      // CORS headers that apply to all responses
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    },
    proxy: {
      // Forward API requests to our development server
      '/api': {
        target: 'http://localhost:3083',
        changeOrigin: true,
        secure: false,
        ws: true, // Support WebSockets
        rewrite: (path) => {
          // In development, completely bypass the proxy for learner API routes
          // This prevents the HTML response issue by not letting Vite handle these requests
          if (process.env.NODE_ENV === 'development' && path.startsWith('/api/learner/')) {
            console.log(`[Rewrite] No rewrite for ${path} - direct API access`);
            return path;
          }
          console.log(`[Rewrite] Standard proxy for ${path}`);
          return path;
        },
        configure: (proxy, options) => {
          // Log proxy setup
          console.log(`[Config] Setting up proxy to ${options.target}`);
          
          proxy.on('error', (err, req, res) => {
            console.error('[Proxy] Error:', err);
            // Ensure JSON response even if API server is unreachable
            if (!res.headersSent) {
              res.writeHead(503, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
              });
              res.end(JSON.stringify({
                error: 'API server unavailable',
                message: err.message,
                status: 503,
                timestamp: new Date().toISOString(),
                // Fallback mock data for important routes when API server is down
                fallback: req.url?.includes('/dashboard') ? {
                  profile: {
                    name: 'Anonymous User',
                    email: 'user@example.com',
                    role: 'learner'
                  },
                  stats: {
                    coursesCompleted: 0,
                    coursesInProgress: 0
                  }
                } : undefined
              }));
            }
          });

          // Handle OPTIONS requests for CORS
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Proxy] Requesting: ${req.method} ${req.url} -> ${options.target}${req.url}`);
            
            // Handle preflight requests
            if (req.method === 'OPTIONS') {
              res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
                'Access-Control-Max-Age': '86400'
              });
              res.end();
              return;
            }
            
            // Ensure content type headers are set
            if (!proxyReq.getHeader('Content-Type') && req.method !== 'GET') {
              proxyReq.setHeader('Content-Type', 'application/json');
            }
            
            // Always set accept header
            proxyReq.setHeader('Accept', 'application/json');
          });

          proxy.on('proxyRes', (proxyRes, req, res) => {
            const statusCode = proxyRes.statusCode ?? 500;
            console.log(`[Proxy] Response from API: ${statusCode} for ${req.method} ${req.url}`);
            const contentType = proxyRes.headers['content-type'] || '';
            
            if (statusCode >= 400) {
              console.warn(`[Proxy] API returned error status: ${statusCode}`);
            }
            
            // Log if response is not JSON for debugging
            if (!contentType.includes('application/json')) {
              console.warn(`[Proxy] API returned non-JSON response: ${contentType}`);
              
              // Capture non-JSON responses and convert to JSON error
              let body = '';
              proxyRes.on('data', chunk => body += chunk);
              
              proxyRes.on('end', () => {
                if (!res.headersSent) {
                  console.warn(`[Proxy] Converting HTML response to JSON error. First 100 chars: ${body.substring(0, 100)}`);
                  
                  res.writeHead(statusCode === 200 ? 500 : statusCode, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({
                    error: 'API Server Error',
                    message: `Received non-JSON response from API: ${body.substring(0, 100)}...`,
                    status: statusCode,
                    timestamp: new Date().toISOString()
                  }));
                }
              });
              
              // Consume the original response
              proxyRes.resume();
            }
          });
        }
      }
    }
  },
  plugins: [
    react({
      // Using React's standard JSX runtime
      jsxImportSource: "react",
      // Enable JSX compatibility for better TypeScript support
      tsDecorators: true,
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: ['groq-sdk'],
      output: {
        manualChunks: undefined,
      },
    },
  },
  optimizeDeps: {
    exclude: [
      '@tanstack/react-query'
    ],
    // Force include these dependencies to ensure they're pre-bundled properly
    include: [
      'react', 
      'react-dom',
      'react-router-dom'
    ],
    // Force re-optimization on server restart
    force: true
  },
  // Clear the cache on startup to avoid stale dependencies
  cacheDir: '.vite'
}));
