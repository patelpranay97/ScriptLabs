import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isSupabase = process.env.DATABASE_URL.includes("supabase");
const poolConfig: pg.PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  ...(isSupabase && {
    ssl: { rejectUnauthorized: false },
  }),
};

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });
