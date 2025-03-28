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
        // Add additional logging and error handling
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
            // Send a valid JSON response even when the API server is down
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'application/json');
              const body = {
                error: 'API server error or unavailable',
                message: err.message,
                status: 500
              };
              res.end(JSON.stringify(body));
            }
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`Proxying ${req.method} ${req.url} to API server`);
          });
          // Handle proxy response to ensure JSON
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // If the API server returns HTML for some reason, convert it to JSON
            const contentType = proxyRes.headers['content-type'] || '';
            if (contentType.includes('text/html')) {
              console.warn('API server returned HTML instead of JSON. Converting to JSON error response.');
              
              // Collect the original response
              let responseBody = '';
              proxyRes.on('data', (chunk) => {
                responseBody += chunk;
              });
              
              // When the response is complete, replace it with JSON
              proxyRes.on('end', () => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  error: 'API server error',
                  message: 'The API server returned an invalid response format',
                  status: 500
                }));
              });
            }
          });
        },
        // Try the next available port if 8083 fails
        rewrite: (path) => {
          console.log(`Proxying request to: ${path}`);
          return path;
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
    esbuildOptions: {
      // Using string format for tsconfigRaw as that's what Vite expects
      tsconfigRaw: `{
        "compilerOptions": {
          "allowSyntheticDefaultImports": true,
          "esModuleInterop": true,
          "jsx": "react-jsx"
        }
      }`
    }
  }
}));
