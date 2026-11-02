'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IconAlert, IconBulb } from '@/components/icons';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Phan biet ro: sai mat khau (401) khac han voi server hong (500).
        // Gop chung lam nguoi dung go lai mat khau mai ma khong biet
        // van de nam o cau hinh.
        setError(
          data.error ??
            (res.status >= 500
              ? `Máy chủ gặp lỗi (${res.status}). Kiểm tra terminal chạy npm run dev.`
              : 'Email hoặc mật khẩu không đúng.'),
        );
        setBusy(false);
        return;
      }
      // Chi cho phep quay ve duong dan noi bo, tranh open redirect
      router.replace(next.startsWith('/') ? next : '/admin');
      router.refresh();
    } catch {
      setError('Không kết nối được máy chủ. Vui lòng thử lại.');
      setBusy(false);
    }
  }

  return (
    <form className="card login" onSubmit={onSubmit} noValidate>
      <span className="brand">
        <span className="logo"><IconBulb /></span>
        Idea Box · Quản trị
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em' }}>Đăng nhập</h1>
        <p className="muted">Dành cho quản trị viên.</p>
      </div>

      {error && (
        <div className="banner warn" role="alert">
          <IconAlert />
          <span>{error}</span>
        </div>
      )}

      <div className="field">
        <label className="label" htmlFor="email">Email</label>
        <input
          className="input" id="email" type="email" autoComplete="email" required
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="label" htmlFor="password">Mật khẩu</label>
        <input
          className="input" id="password" type="password" autoComplete="current-password" required
          value={password} onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button type="submit" className="btn primary lg block" disabled={busy}>
        {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </button>
    </form>
  );
}
