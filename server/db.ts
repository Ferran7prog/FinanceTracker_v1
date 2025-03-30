import { drizzle } from 'drizzle-orm/node-postgres';
// Fix the ESM import for pg
import pkg from 'pg';
const { Pool } = pkg;
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from '@shared/schema';
import { log } from './vite';

// Initialize PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema });

// Function to initialize database connection
export async function initializeDatabase() {
  try {
    log('Initializing database connection...', 'database');
    
    // We don't run migrations here - use `npm run db:push` instead
    // Test database connection
    try {
      const result = await db.query.users.findMany();
      log(`Found ${result.length} users in the database`, 'database');
    } catch (e) {
      // This may fail if tables don't exist yet, which is fine
      log('Tables may not exist yet. Run `npm run db:push` to create them.', 'database');
    }
    
    return true;
  } catch (error) {
    log(`Error initializing database: ${error instanceof Error ? error.message : String(error)}`, 'database');
    return false;
  }
}