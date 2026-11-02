import { createClient } from '@supabase/supabase-js';
import { env, BUCKET } from './env';

/**
 * Client Supabase dung service_role key - CHI chay o server.
 * Khong bao gio import file nay vao component co 'use client'.
 */
function admin() {
  return createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function absolute(url: string) {
  return url.startsWith('http') ? url : `${env.supabaseUrl}/storage/v1${url}`;
}

/**
 * Tao URL co chu ky de trinh duyet PUT thang file len Storage.
 * File khong di qua server cua minh -> khong dinh gioi han body cua
 * serverless function, va khong ton bang thong cua host.
 */
export async function createUploadUrl(storageKey: string) {
  const { data, error } = await admin()
    .storage.from(BUCKET)
    .createSignedUploadUrl(storageKey);

  if (error || !data) {
    throw new Error(`Khong tao duoc URL upload: ${error?.message ?? 'khong ro'}`);
  }
  return { uploadUrl: absolute(data.signedUrl), storageKey };
}

/** URL tai file, song trong `expiresIn` giay. Chi cap cho admin da dang nhap. */
export async function createDownloadUrl(storageKey: string, expiresIn = 300) {
  const { data, error } = await admin()
    .storage.from(BUCKET)
    .createSignedUrl(storageKey, expiresIn);

  if (error || !data) {
    throw new Error(`Khong tao duoc URL tai file: ${error?.message ?? 'khong ro'}`);
  }
  return data.signedUrl;
}

/** Xoa file khoi bucket. Goi khi xoa y tuong. Loi o day khong chan viec xoa ban ghi. */
export async function removeFiles(storageKeys: string[]) {
  if (storageKeys.length === 0) return;
  await admin().storage.from(BUCKET).remove(storageKeys);
}

/** Kiem tra file da thuc su ton tai tren Storage truoc khi ghi vao DB. */
export async function fileExists(storageKey: string) {
  const slash = storageKey.lastIndexOf('/');
  const dir = slash === -1 ? '' : storageKey.slice(0, slash);
  const name = storageKey.slice(slash + 1);
  const { data } = await admin().storage.from(BUCKET).list(dir, { search: name, limit: 1 });
  return Boolean(data?.some((f) => f.name === name));
}
