import type { NextConfig } from 'next';

/**
 * Header bao mat ap cho moi response.
 *
 * Luu y ve mat khau: gui mat khau dang ro trong body POST la cach lam
 * DUNG va tieu chuan. HTTPS ma hoa toan bo body truoc khi roi may.
 * Hash o client khong giup gi - chuoi hash se tro thanh mat khau moi.
 */
const securityHeaders = [
  // Buoc trinh duyet chi dung HTTPS voi domain nay trong 2 nam.
  // Chi co tac dung khi da deploy (localhost bo qua header nay).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Cam trinh duyet doan kieu file khac voi Content-Type khai bao
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Chan nhung trang khac nhung site nay trong iframe (chong clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Khong gui duong dan day du sang site khac qua Referer
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Tat cac quyen thiet bi app khong dung
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // bo header X-Powered-By: Next.js
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // Trang quan tri va API khong duoc nam trong bat ky cache nao
        source: '/admin/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ];
  },
};

export default nextConfig;
