/**
 * Doc bien moi truong mot cho, bao loi som va ro rang khi thieu.
 * Moi ham chi duoc goi tu server (route handler / server component).
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Thieu bien moi truong ${name}. Kiem tra lai file .env.local (xem .env.example).`,
    );
  }
  return value;
}

export const env = {
  get databaseUrl() {
    return required('DATABASE_URL');
  },
  get supabaseUrl() {
    return required('NEXT_PUBLIC_SUPABASE_URL');
  },
  get supabaseServiceKey() {
    return required('SUPABASE_SERVICE_ROLE_KEY');
  },
  get adminEmail() {
    return required('ADMIN_EMAIL');
  },
  get adminPasswordHash() {
    const hash = required('ADMIN_PASSWORD_HASH');
    // Next.js nap .env qua dotenv-expand: dau `$` khong escape se bi hieu
    // la ten bien va thay bang chuoi rong, lam hash rach nat ma khong bao loi.
    // Bat loi o day thay vi de dang nhap that bai mot cach kho hieu.
    if (!/^\$2[aby]?\$\d{2}\$/.test(hash)) {
      throw new Error(
        'ADMIN_PASSWORD_HASH khong phai hash bcrypt hop le. ' +
          'Rat co the cac dau $ chua duoc escape trong .env.local. ' +
          'Chay lai `npm run hash -- "matkhaucuaban"` va dan nguyen dong ket qua.',
      );
    }
    return hash;
  },
  get sessionSecret() {
    return required('SESSION_SECRET');
  },
};

/** Ten bucket luu tep dinh kem tren Supabase Storage. */
export const BUCKET = 'attachments';
