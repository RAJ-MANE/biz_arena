import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('Missing required env var DATABASE_URL');
}

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:Rajmane%402006@db.jpokhmcngycrjnjkpzfl.supabase.co:5432/postgres";

// Reuse client across lambda invocations to avoid connection storms in serverless
declare global {
  // Allow storing on globalThis for serverless reuse
  var __pg_client__: any | undefined;
  var __drizzle_db__: any | undefined;
}

function createClient() {
  // Determine SSL: require for production-like URLs (e.g., Supabase), disable for local dev if explicitly set
  const useSsl = process.env.DATABASE_SSL === 'true' || /sslmode=require|postgres.*supabase|rds.amazonaws.com/.test(connectionString || '');

  return postgres(connectionString, {
    ssl: useSsl ? 'require' : false,
    max: Number(process.env.DB_MAX_CONN || 20),
    idle_timeout: Number(process.env.DB_IDLE_TIMEOUT || 20),
    connect_timeout: Number(process.env.DB_CONNECT_TIMEOUT || 30),
    max_lifetime: Number(process.env.DB_MAX_LIFETIME || 60 * 30),
    prepare: false,
  });
}

if (!global.__pg_client__) {
  global.__pg_client__ = createClient();
}

if (!global.__drizzle_db__) {
  global.__drizzle_db__ = drizzle(global.__pg_client__, { schema });
}

export const db: any = global.__drizzle_db__;

export type Database = any;