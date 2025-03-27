/// <reference path="./env.d.ts" />
import { jest } from '@jest/globals';
import { config } from 'dotenv';
import path from 'path';

// Set import.meta.env before any module imports
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        MODE: 'test',
        VITE_APP_NAME: 'Learnfinity Test',
        VITE_DEBUG: 'true',
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
        VITE_GROQ_API_KEY: process.env.VITE_GROQ_API_KEY || 'test-api-key',
        VITE_ENABLE_LLM: 'true',
        VITE_ENABLE_BATCH_PROCESSING: 'true',
        VITE_ENABLE_NOTIFICATIONS: 'true',
        VITE_BATCH_SIZE: '5',
        VITE_MAX_CONCURRENT_REQUESTS: '3'
      }
    }
  },
  writable: false
});

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
config({ path: envPath });

// Set default test environment variables if not set
process.env.VITE_GROQ_API_KEY = process.env.VITE_GROQ_API_KEY || 'test-api-key';
process.env.VITE_ENABLE_LLM = 'true';
process.env.VITE_DEBUG = 'true';

// Increase timeout for API calls
jest.setTimeout(30000); 