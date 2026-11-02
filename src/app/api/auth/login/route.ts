import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { env } from '@/lib/env';
import { signSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/session';
import { rateLimit, clientIp } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// KHONG BAO GIO console.log body cua route nay: no chua mat khau dang ro.
// Log tren Netlify duoc luu lai va nhieu nguoi trong team doc duoc.

export async function POST(req: Request) {
  // 10 lan thu / 15 phut / IP - chan do mat khau
  const limited = rateLimit(`login:${clientIp(req)}`, 10, 15 * 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'Bạn đã thử quá nhiều lần. Vui lòng đợi ít phút rồi thử lại.' },
      { status: 429 },
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  // Doc env trong try: thieu bien thi bao dung nguyen nhan, thay vi
  // de nem ra 500 tho roi hien thanh "sai mat khau"
  let adminEmail: string;
  let adminHash: string;
  let secret: string;
  try {
    adminEmail = env.adminEmail;
    adminHash = env.adminPasswordHash;
    secret = env.sessionSecret;
  } catch (e) {
    console.error('[login] thieu bien moi truong', e);
    return NextResponse.json(
      {
        error:
          'Máy chủ chưa được cấu hình đủ (thiếu ADMIN_EMAIL, ADMIN_PASSWORD_HASH hoặc SESSION_SECRET). Kiểm tra .env.local rồi khởi động lại npm run dev.',
      },
      { status: 500 },
    );
  }

  const emailOk = email === adminEmail.trim().toLowerCase();
  // Luon chay bcrypt du email sai, de thoi gian phan hoi khong tiet lo
  // email nao la dung (timing attack)
  const passwordOk = await bcrypt.compare(password, adminHash);

  if (!emailOk || !passwordOk) {
    return NextResponse.json(
      { error: 'Email hoặc mật khẩu không đúng.' },
      { status: 401 },
    );
  }

  const token = await signSession(email, secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  // Phan hoi dang nhap khong duoc nam lai trong cache cua trinh duyet
  // hay proxy trung gian
  res.headers.set('Cache-Control', 'no-store, max-age=0');
  return res;
}
