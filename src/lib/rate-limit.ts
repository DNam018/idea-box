/**
 * Rate limit don gian, luu trong bo nho cua tien trinh.
 *
 * Gioi han that: moi instance serverless co bo nho rieng va bi thu hoi sau
 * mot luc, nen day khong phai hang rao tuyet doi. Muc dich la chan bot ngay
 * tho va nguoi bam nut lien tuc - du cho mot cong cu noi bo. Neu sau nay bi
 * spam that su, thay bang Upstash Redis hoac Cloudflare Turnstile.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

/** Lay IP nguoi gui tu header cua Netlify / Vercel / Cloudflare. */
export function clientIp(req: Request) {
  const h = req.headers;
  return (
    h.get('x-nf-client-connection-ip') ??
    h.get('cf-connecting-ip') ??
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'
  );
}

/** Don rac dinh ky de Map khong phinh mai. */
setInterval(() => {
  const now = Date.now();
  for (const [key, b] of buckets) if (now > b.resetAt) buckets.delete(key);
}, 60_000).unref?.();
