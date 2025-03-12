/**
 * Database client configuration
 */
import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from './schema';

// Get database URL from environment variable
const DATABASE_URL = process.env.DATABASE_URL || '';

// Configure Neon
neonConfig.fetchConnectionCache = true;

// Create a SQL connection
const sql = neon(DATABASE_URL);

// Initialize Drizzle ORM with our schema
export const db = drizzle(sql, { schema });

// Export schema for convenience
export { schema };

// Export types
export type Database = typeof schema;
export type DbClient = typeof db; 