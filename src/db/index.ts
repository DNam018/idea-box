import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '@/lib/env';
import * as schema from './schema';

type Db = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Ket noi duoc tao LAZY - chi o lan truy van dau tien, khong phai luc
 * import module.
 *
 * Ly do: luc `next build`, Next.js import cac route handler de phan tich
 * tinh. Neu module nay mo ket noi ngay khi import thi no doc DATABASE_URL
 * ngay tai thoi diem do va lam vo ca build khi bien chua san sang.
 * Boc trong Proxy de phan con lai cua code van dung `db` nhu binh thuong.
 */
const globalForDb = globalThis as unknown as {
  __sql?: ReturnType<typeof postgres>;
  __db?: Db;
};

function real(): Db {
  if (globalForDb.__db) return globalForDb.__db;

  const sql =
    globalForDb.__sql ??
    postgres(env.databaseUrl, {
      max: 3,            // serverless: giu pool nho
      idle_timeout: 20,
      prepare: false,    // bat buoc khi di qua transaction pooler cua Supabase
    });

  const instance = drizzle(sql, { schema });

  if (process.env.NODE_ENV !== 'production') {
    globalForDb.__sql = sql;
    globalForDb.__db = instance;
  }
  return instance;
}

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const target = real() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(target, prop, receiver);
    return typeof value === 'function' ? value.bind(target) : value;
  },
});

export { schema };
