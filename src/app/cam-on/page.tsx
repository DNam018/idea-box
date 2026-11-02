import Link from 'next/link';
import { IconBulb, IconCheck } from '@/components/icons';

export const metadata = { title: 'Đã gửi ý tưởng · Idea Box' };

export default function ThankYouPage() {
  return (
    <div className="page">
      <header className="topbar plain">
        <Link href="/" className="brand">
          <span className="logo"><IconBulb /></span>
          Idea Box
        </Link>
      </header>

      <main
        className="u-wrap"
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          flexGrow: 1, paddingBottom: 80,
        }}
      >
        <div
          className="card"
          style={{
            padding: '56px 40px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center', gap: 16,
          }}
        >
          <span className="ok-ring"><IconCheck /></span>
          <h1
            role="status"
            style={{
              fontSize: 30, lineHeight: 1.25, fontWeight: 700,
              letterSpacing: '-.02em', marginTop: 8,
            }}
          >
            Đã gửi ý tưởng. Cảm ơn bạn!
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 16, maxWidth: 420 }}>
            Quản trị viên sẽ đọc ý tưởng của bạn. Bạn có muốn đóng góp thêm ý tưởng nào nữa không?
          </p>
          <Link
            href="/"
            className="btn primary lg"
            style={{ marginTop: 12, minWidth: 240 }}
          >
            Gửi ý tưởng khác
          </Link>
        </div>
      </main>
    </div>
  );
}
