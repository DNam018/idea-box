import { NextResponse, type NextRequest } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

/**
 * Chan moi duong dan /admin khi chua dang nhap.
 * Middleware chay o Edge runtime nen chi dung `jose` (bcrypt khong chay duoc o day).
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname === '/admin/login') return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySession(token, process.env.SESSION_SECRET ?? '') : null;

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    // Nho lai trang dang muon vao de dang nhap xong quay lai dung cho
    if (pathname !== '/admin') url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
