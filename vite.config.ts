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
    proxy: {
      // Forward API requests to our development server
      '/api': {
        target: 'http://localhost:3083',
        changeOrigin: true,
        secure: false,
        ws: true, // Add support for WebSockets if needed
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('Proxy Error:', err);
            // Ensure JSON response even if API server is unreachable
            if (!res.headersSent) {
              res.writeHead(503, { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
              });
              res.end(JSON.stringify({
                error: 'API server unavailable',
                message: err.message,
                status: 503
              }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Proxy] Requesting: ${req.method} ${req.url} -> ${options.target}${req.url}`);
            
            // Ensure the proper content-type is set
            if (!proxyReq.getHeader('Content-Type') && req.method !== 'GET') {
              proxyReq.setHeader('Content-Type', 'application/json');
            }
            
            // Always set accept header
            proxyReq.setHeader('Accept', 'application/json');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const statusCode = proxyRes.statusCode ?? 500; // Default to 500 if undefined
            console.log(`[Proxy] Response from API: ${statusCode}`);
            const contentType = proxyRes.headers['content-type'] || '';
            
            // Handle non-JSON responses from the API server
            if (!contentType.includes('application/json')) {
              console.warn(`[Proxy] API returned non-JSON response (${statusCode}): ${contentType}. Converting to JSON.`);
              
              let body = '';
              proxyRes.on('data', chunk => body += chunk);
              proxyRes.on('end', () => {
                if (!res.headersSent) {
                  res.writeHead(statusCode === 200 ? 500 : statusCode, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({
                    error: 'API Server Error',
                    message: `Received non-JSON response from API: ${body.substring(0, 100)}...`,
                    status: statusCode
                  }));
                }
              });
              // Consume the original response data to prevent it from being sent
              proxyRes.resume(); 
            }
          });
        },
        // By default, the path is the same on both client and server
        rewrite: (path) => path
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
