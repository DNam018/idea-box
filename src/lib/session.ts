import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'ib_session';
const MAX_AGE = 60 * 60 * 8; // 8 gio

function secretKey(secret: string) {
  return new TextEncoder().encode(secret);
}

/** Ky token phien. Chay o Node runtime (route handler dang nhap). */
export async function signSession(email: string, secret: string) {
  return new SignJWT({ sub: email, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey(secret));
}

/** Xac thuc token. `jose` chay duoc ca o Edge runtime nen middleware dung duoc. */
export async function verifySession(token: string, secret: string) {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret));
    return payload.role === 'admin' ? payload : null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    // httpOnly: JavaScript tren trang khong doc duoc cookie -> mot lo hong
    // XSS cung khong lay duoc phien dang nhap
    httpOnly: true,
    // sameSite lax: cookie khong di kem request tu site khac gui sang,
    // chan CSRF cho cac thao tac POST/PATCH/DELETE cua trang quan tri
    sameSite: 'lax' as const,
    // Chi gui qua HTTPS khi da deploy. O localhost phai tat, khong thi
    // trinh duyet bo cookie va khong bao gio dang nhap duoc.
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  };
}

/** Dung trong server component / route handler de chan truy cap. */
export async function requireAdmin() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token, process.env.SESSION_SECRET ?? '');
}
