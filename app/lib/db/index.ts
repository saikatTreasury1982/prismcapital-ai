import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

let _db: ReturnType<typeof drizzle> | null = null;
let _initError: Error | null = null;

function initDB() {
  if (_db) return _db;
  if (_initError) throw _initError;

  try {
    const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
    const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

    if (!TURSO_DATABASE_URL || TURSO_DATABASE_URL === 'undefined') {
      throw new Error('TURSO_DATABASE_URL is not set in environment variables');
    }

    if (!TURSO_AUTH_TOKEN || TURSO_AUTH_TOKEN === 'undefined') {
      throw new Error('TURSO_AUTH_TOKEN is not set in environment variables');
    }

    const tursoClient = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });

    _db = drizzle(tursoClient, { schema });
    return _db;
  } catch (error) {
    _initError = error as Error;
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const dbInstance = initDB();
    return (dbInstance as any)[prop];
  }
});

export { schema };