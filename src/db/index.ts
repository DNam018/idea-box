import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/lib/env';
import * as schema from './schema';

/**
 * Giu 1 connection pool duy nhat qua cac lan hot-reload cua dev server,
 * neu khong moi lan sua file lai mo them ket noi toi Supabase.
 */
const globalForDb = globalThis as unknown as { __sql?: ReturnType<typeof postgres> };

const sql =
  globalForDb.__sql ??
  postgres(env.databaseUrl, {
    max: 3,            // serverless: giu pool nho
    idle_timeout: 20,
    prepare: false,    // bat buoc khi di qua pooler cua Supabase
  });

if (process.env.NODE_ENV !== 'production') globalForDb.__sql = sql;

export const db = drizzle(sql, { schema });
export { schema };
