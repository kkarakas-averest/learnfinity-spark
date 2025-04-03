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
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('Proxy Error:', err);
            // Ensure JSON response even if API server is unreachable
            if (!res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                error: 'API server unavailable',
                message: err.message,
                status: 503
              }));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Proxy] Requesting: ${req.method} ${req.url} -> ${options.target}${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const statusCode = proxyRes.statusCode ?? 500; // Default to 500 if undefined
            console.log(`[Proxy] Response from API: ${statusCode}`);
            const contentType = proxyRes.headers['content-type'] || '';
            
            // Handle non-JSON responses from the API server
            if (statusCode >= 400 && !contentType.includes('application/json')) {
              console.warn(`[Proxy] API returned non-JSON error (${statusCode}). Converting to JSON.`);
              
              let body = '';
              proxyRes.on('data', chunk => body += chunk);
              proxyRes.on('end', () => {
                if (!res.headersSent) {
                  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
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
        // Remove rewrite as it's not needed with explicit target
        // rewrite: (path) => {
        //   console.log(`Proxying request to: ${path}`);
        //   return path;
        // }
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
